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
from requests.structures import CaseInsensitiveDict
import pandas as pd


class EduHub:
    # __metaclass__ = "EduHub"

    def __init__(self):
        self.url = 'https://' + \
            os.getenv('HASURA_SERVICE_NAME') + '.opencampus.sh/v1/graphql'
        self.hasura_admin_secret = os.getenv('HASURA_GRAPHQL_ADMIN_KEY')
        self.headers = ""

    def set_url(self, url: str):
        self.url = url

    def set_hasura_admin_secret(self, hasura_admin_secret: str):
        self.hasura_admin_secret = hasura_admin_secret

    def set_headers(self):
        self.headers = CaseInsensitiveDict()
        self.headers["x-hasura-admin-secret"] = self.hasura_admin_secret
        self.headers["content-type"] = 'application/json'

    def to_datetime(self, date_time):
        hasura_format = '%Y-%m-%dT%H:%M:%SZ'
        hasura_timezone = 'UTC'
        reference_timezone = 'Europe/Berlin'
        return pd.to_datetime(date_time, format=hasura_format).dt.tz_localize(hasura_timezone).dt.tz_convert(reference_timezone)

    def send_query(self, query, variables):
        self.set_headers()
        logging.info(
            f"URL: {self.url}\nHeader: {self.headers}\nQuery: {query}\nVariables: {variables}")
        r = requests.post(
            self.url, json={'query': query, 'variables': variables}, headers=self.headers)
        if r.status_code == 200:
            return r.json()
        else:
            return(f'Something went wrong. HTTP Code: {r.status_code}')

    def get_sessions_without_attendance_check(self):
        variables = {}
        query = """query {
            Session(where: {attendanceData: {_is_null: true}}) {
                id
                SessionAddresses {
                    link
                    latitude
                    longitude
                }
                startDateTime
                endDateTime
            }
        }"""
        result = self.send_query(query, variables)
        if result.get('data') is None:
            return logging.error(f'{result}')
        result_list = result['data']['Session']
        unnested_list = []
        unnested_list.append([[item['id'], item['SessionAddresses']]
                              for item in result_list])
        sessions_df = pd.DataFrame(unnested_list[0], columns=[
                                   'id', 'link', 'latitude', 'longitude', 'startDateTime', 'endDateTime'])
        sessions_df['startDateTime'] = self.to_datetime(
            sessions_df['startDateTime'])
        sessions_df['endDateTime'] = self.to_datetime(
            sessions_df['endDateTime'])
        return sessions_df

    def get_course_participants_from_session_id(self, session_id):
        variables = {'session_id': f'{session_id}'}
        query = """query($session_id: Int) {
            CourseEnrollment(where: {Course: {Sessions: {id: {_eq: $session_id}}}}) {
                User {
                    id
                    firstName
                    lastName
                    email
                }
            }
        }"""
        result = self.send_query(query, variables)
        if result.get('data') is None:
            return logging.error(f'{result}')
        result_list = result['data']['CourseEnrollment']
        unnested_list = []
        unnested_list.append([item['User'] for item in result_list])
        return pd.DataFrame(unnested_list[0], columns=['id', 'firstName', 'lastName', 'email'])

    def get_participants_from_course(self, course_id):
        variables = {'course_id': course_id}
        query = """query($course_id: Int) {
            CourseEnrollment(where: {courseId: {_eq: $course_id}}) {
                User {
                    id
                    firstName
                    lastName
                    email
                }
            }
        }"""
        result = self.send_query(query, variables)
        result_list = result['data']['CourseEnrollment']
        unnested_list = []
        unnested_list.append([item['User'] for item in result_list])
        return pd.DataFrame(unnested_list[0], columns=['id', 'firstName', 'lastName', 'email'])

    def insert_attendance(self, course_participant_attendance):
        variables = {'leaveDateTime': course_participant_attendance.get('leaveDateTime').iloc[0], 'interruptionCount': course_participant_attendance.get('interruptionCount').iloc[0],
                     'recordedName': course_participant_attendance.get('recordedName').iloc[0], 'sessionId': course_participant_attendance.get('sessionId').iloc[0],
                     'source': course_participant_attendance.get('source').iloc[0], 'joinDateTime': course_participant_attendance.get('joinDateTime').iloc[0],
                     'status': course_participant_attendance.get('status').iloc[0], 'totalAttendanceTime': course_participant_attendance.get('duration').iloc[0],
                     'userId': course_participant_attendance.get('userId').iloc[0]}
        mutation = """mutation($leaveDateTime: timestamptz, $interruptionCount: Int, $recordedName: String,
                               $sessionId: Int, $source: String, $joinDateTime: timestamptz, $status: AttendanceStatus_enum,
                               $totalAttendanceTime: Int, $userId: uuid) {
            insert_Attendance(objects: {endDateTime: $leaveDateTime, interruptionCount: $interruptionCount,
            recordedName: $recordedName, sessionId: $sessionId, source: $source, startDateTime: $joinDateTime,
            status: $status, totalAttendanceTime: $totalAttendanceTime, userId: $userId}) {
                returning {
                    id
                    created_at
                    endDateTime
                    interruptionCount
                    recordedName
                    sessionId
                    source
                    startDateTime
                    status
                    totalAttendanceTime
                    updated_at
                    userId
                }
            }
        }"""
        return self.send_query(mutation, variables)

    def update_session_attendanceData(self, attendance_data):
        variables = {
            'sessionId': int(attendance_data['sessionId'][0]), 'attendanceData': attendance_data.to_json()}
        mutation = """mutation($sessionId: Int, $attendanceData: String) {
            update_Session(where: {id: {_eq: $sessionId}}, _set: {attendanceData: $attendanceData}) {
                affected_rows
                returning {
                    attendanceData
                    courseId
                    created_at
                    description
                    endDateTime
                    id
                    startDateTime
                    title
                    updated_at
                }
            }
        }"""
        return self.send_query(mutation, variables)


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

    def to_datetime(self, date_time):
        zoom_format = '%Y-%m-%dT%H:%M:%SZ'
        zoom_timezone = 'UTC'
        reference_timezone = 'Europe/Berlin'
        return pd.to_datetime(date_time, format=zoom_format).dt.tz_localize(zoom_timezone).dt.tz_convert(reference_timezone)

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

    def format_zoom_attendances(self, session_participants):
        attendances = pd.DataFrame(
            session_participants, columns=['name', 'email', 'join_time', 'leave_time', 'duration'])
        attendances.rename(
            columns={'join_time': 'joinDateTime', 'leave_time': 'leaveDateTime'}, inplace=True)
        attendances['duration'] = attendances.groupby(
            ['name']).transform('sum')['duration']
        attendances['interruptionCount'] = attendances.groupby(
            ['name']).transform('count')['duration']
        attendances = attendances.drop_duplicates('name')
        return attendances

    def get_meeting_id(self, meeting_url):
        """It removes the http part at the beginning and password or addon part in the end of the meeting_id"""
        if meeting_url[: 4] == 'http' or meeting_url.find('/j/') > 0:
            meeting_url = meeting_url.split('/j/')[1]
        if meeting_url.find('?') > 0:
            meeting_url = meeting_url[: meeting_url.index('?')]
        return meeting_url

    def get_session_attendance(self, meeting_url):
        logging.info(f"Getting online attendances from Zoom")
        meeting_id = self.get_meeting_id(meeting_url)
        # gets the particpations for the last occuring meeting under the given url
        zoom_session = self.get_last_meeting_session(meeting_id)
        if zoom_session.status_code != 200:
            return f"Error: Zoom API answered with {zoom_session} \n\nFull Text: {zoom_session.text}"
        logging.info(f"Zoom API response: {zoom_session}")
        logging.info(f"Zoom API response text: {zoom_session.text}")
        zoom_session = json.loads(zoom_session.text)
        if zoom_session.get('participants') is None:
            return f"Report has no participants. Are you sure the meeting id is correct?\nReport:\n{zoom_session.text}"
        zoom_attendances = self.format_zoom_attendances(
            zoom_session['participants'])
        return zoom_attendances


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
