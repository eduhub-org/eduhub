import json
import logging
import time
import requests
from typing import Optional, Dict, Union, Any
from authlib.jose import jwt
import os
import pandas as pd


class ZoomClient:

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
        logging.debug(f"Zoom API response: {zoom_session}")
        logging.debug(f"Zoom API response text: {zoom_session.text}")
        zoom_session = json.loads(zoom_session.text)
        if zoom_session.get('participants') is None:
            raise Exception(
                f"Report has no participants. Are you sure the meeting id is correct?\nReport:\n{zoom_session.text}")
        zoom_attendances = self.format_zoom_attendances(
            zoom_session['participants'])
        return zoom_attendances
