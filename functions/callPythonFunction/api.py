import json
import logging
import time
import requests
from typing import Optional, Dict, Union, Any
from authlib.jose import jwt
import urllib
import base64
from datetime import datetime, timedelta
import sys
import os


class Zoom:
    __metaclass__ = "api"

    def __init__(self):
        self.api_key = os.getenv('ZOOM_API_KEY')
        self.api_secret = os.getenv('ZOOM_API_SECRET')
        self.base_url = "https://api.zoom.us/v2"
        self.reports_url = f"{self.base_url}/report/meetings"
        self.jwt_token_exp = 1800
        self.jwt_token_algo = "HS256"
        self.jwt_token = self.generate_jwt_token()

    def set_api_key(self, api_key: str):
        self.api_key = api_key

    def set_api_secret(self, api_secret: str):
        self.api_secret = api_secret

    def set_jwt_token(self, jwt_token: str):
        self.jwt_token = jwt_token

    def get_jwt_token(self):
        return self.jwt_token

    def generate_jwt_token(self) -> bytes:
        if self.api_key is None or self.api_secret is None:
            return 'Error: No API key or secret defined in the environment variables'
        iat = int(time.time())
        jwt_payload: Dict[str, Any] = {
            "aud": None,
            "iss": self.api_key,
            "exp": iat + self.jwt_token_exp,
            "iat": iat
        }
        header: Dict[str, str] = {"alg": self.jwt_token_algo}
        jwt_token: bytes = jwt.encode(header, jwt_payload, self.api_secret)
        return jwt_token

    def get_last_meeting_session(self, meeting_id: str,
                                 next_page_token: Optional[str] = None) -> requests.Response:
        url: str = f"{self.reports_url}/{meeting_id}/participants"
        query_params: Dict[str, Union[int, str]] = {"page_size": 3000}
        if next_page_token:
            query_params.update({"next_page_token": next_page_token})

        r: requests.Response = requests.get(url,
                                            headers={
                                                "Authorization": f"Bearer {self.jwt_token.decode('utf-8')}"},
                                            params=query_params)

        return r

    def zoom_get_meeting_report(self, meeting_id: str) -> requests.Response:
        url: str = f"{self.reports_url}/{meeting_id}"
        r: requests.Response = requests.get(url,
                                            headers={"Authorization": f"Bearer {self.jwt_token.decode('utf-8')}"})
        return r


# version 13/10/2021
class LimeSurvey:
    __metaclass__ = "api"

    def __init__(self, sid):
        self.user = os.getenv('LMS_USER')
        self.url = os.getenv('LMS_URL')
        self.psw = os.getenv('LMS_PASSWORD')
        self.sID = sid  # 918679 for the attendance questionnaire
        self.s_key = ""

    def set_user(self, user: str):
        self.user = user

    def set_psw(self, psw: str):
        self.psw = psw

    def set_url(self, url: str):
        self.url = url

    def set_survey_id(self, sID: int):
        self.sID = sID

    def set_key(self, s_key):
        self.s_key = s_key

    def create_lms_request(self, payload):
        req = urllib.request.Request(
            url=self.url, data=json.dumps(payload).encode("utf-8"))
        req.add_header('content-type', 'application/json')
        req.add_header('connection', 'Keep-Alive')
        # to avoid 403 Forbidden / scraping block
        req.add_header('User-Agent', 'Mozilla/5.0')
        return req

    def get_session_key(self):
        func_name = "get_session_key"
        payload = {'method': func_name,
                   'params': [self.user, self.psw],
                   'id': 1}

        req = self.create_lms_request(payload)
        try:
            f = urllib.request.urlopen(req)
            myretun = f.read()
            # print("response: ", myretun)
            j = json.loads(myretun)
            return j['result']
        except:
            e = sys.exc_info()[0]
            print("<p>Error: %s</p>" % e)

    def get_answers(self):
        func_name = "export_responses"
        payload = {'method': func_name,
                   'params': [self.s_key, self.sID, 'json'],
                   'id': 1}
        req = self.create_lms_request(payload)
        try:
            f = urllib.request.urlopen(req)
            answersb64 = f.read()
            ans_j = json.loads(answersb64)
            return base64.b64decode(ans_j['result'])
        except:
            e = sys.exc_info()[0]
            print("<p>Error: %s</p>" % e)

    def get_summary(self):
        func_name = "get_summary"
        payload = {'method': func_name,
                   'params': [self.key, self.sID],
                   'id': 1}
        req = self.create_lms_request(payload)
        try:
            f = urllib.request.urlopen(req)
            myretun = f.read()
            print(myretun)
            # pdb.set_trace()
            j = json.loads(myretun)
            return j
        except:
            e = sys.exc_info()[0]
            print("<p>Error: %s</p>" % e)

    def clean_responses(self, json_response: str):
        """remove empty and non valid responses."""
        valid_responses = []
        resp_list = json.loads(json_response)['responses']
        logging.info(f"Got {len(resp_list)} responses")
        for i, resp in enumerate(resp_list):
            # resp is a dict
            for d_key in resp.keys():
                resp_data = resp[d_key]  # so it is encapsulated
                # I do not know beforehand the id key
                if resp_data['N1'] is not None and resp_data['N2'] is not None:
                    valid_responses.append({
                        'firstName': resp_data['N1'],
                        'lastName': resp_data['N2'],
                        'location': resp_data['Place'],
                        'joinDateTime': resp_data['datestamp']
                    })
        return valid_responses

    def filter_attendances_by_time(self, attendances, start_datetime: str, end_datetime: str):
        """
        It returns only the responses within the given time range.
        Times should be strings in Zoom format, timestamptz %Y-%m-%dT%H:%M:%SZ.
        """
        format_zoom = '%Y-%m-%dT%H:%M:%SZ'
        start_datetime = datetime.strptime(start_datetime, format_zoom)
        end_datetime = datetime.strptime(end_datetime, format_zoom)
        # we allow 1 hour before and after for the registration
        # but zoom time have 2 hours less than german times,
        # so we add 2 and then -1 and +1 becomes +1 and +3
        start_timerange_allowed = start_datetime + timedelta(hours=1)
        end_timerange_allowed = end_datetime + timedelta(hours=3)
        filtered_resp = []
        for attendance in attendances:
            joinDateTime = attendance['joinDateTime']
            format_survey = '%Y-%m-%d %H:%M:%S'
            join_datetime = datetime.strptime(joinDateTime, format_survey)
            if join_datetime.date() == start_datetime.date():
                if join_datetime.time() > start_timerange_allowed.time() and join_datetime.time() < end_timerange_allowed.time():
                    filtered_resp.append(attendance)

        return filtered_resp

    def read_survey_response(self):

        responses_string = self.get_answers()
        responses_json = json.loads(responses_string)
        responses_list = responses_json['responses']
        cleaned_responses = self.clean_responses(responses_list)

        return cleaned_responses
