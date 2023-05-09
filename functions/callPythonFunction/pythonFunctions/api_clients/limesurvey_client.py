import json
import logging
import urllib
import base64
from datetime import datetime, timedelta
import sys
import os
from requests.structures import CaseInsensitiveDict
import pandas as pd


# version 13/10/2021
class LimeSurveyClient:
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

    def to_datetime(self, date_time):
        limesurvey_format = '%Y-%m-%d %H:%M:%S'
        limesurvey_timezone = 'UTC'
        reference_timezone = 'Europe/Berlin'
        return pd.to_datetime(date_time, format=limesurvey_format).dt.tz_localize(limesurvey_timezone).dt.tz_convert(reference_timezone)

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

    def get_responses(self):
        func_name = "export_responses"
        payload = {'method': func_name,
                   'params': [self.s_key, self.sID, 'json'],
                   'id': 1}
        req = self.create_lms_request(payload)
        try:
            f = urllib.request.urlopen(req)
            request_json = json.loads(f.read())
            result_base64 = request_json['result']
            # check whether result is a valid base64 string
            # if result_base64['status'] == "No permission":
            #     logging.error(
            #         f"############# No permission to access the survey. Please check your credentials.")
            #     return f"############# No permission to access the survey. Please check your credentials."
            result_json = json.loads(base64.b64decode(result_base64))
            response_df = self.format_responses(result_json['responses'])
            return(response_df)

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

    def format_responses(self, response_list):
        unnested_responses = []
        for i, resp in enumerate(response_list):
            for d_key in resp.keys():
                resp_data = resp[d_key]  # so it is encapsulated
                unnested_responses.append(resp_data)
        response_df = pd.DataFrame(unnested_responses, columns=list(
            list(response_list[0].items())[0][1].keys()))
        return response_df

    def clean_responses(self, response_json):
        """remove empty and non valid responses."""
        valid_responses = []
        logging.info(f"Got {len(response_json)} responses")
        for i, resp in enumerate(response_json):
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
        Times should be strings in Zoom format, timestamptz % Y-%m-%dT % H: % M: % SZ.
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
        format_survey = '%Y-%m-%d %H:%M:%S'
        for attendance in attendances:
            joinDateTime = attendance['joinDateTime']
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
