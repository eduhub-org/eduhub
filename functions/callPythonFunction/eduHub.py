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
        query = """query($session_id: Int) {
            CourseEnrollment(where: {Course: {Sessions: {id: {_eq: $session_id}}}}) {
                User {
                    firstName
                    lastName
                    email
                }
            }
        }"""
        result = self.send_query(query, variables)
        result_list = result['data']['CourseEnrollment']
        unnested = []
        unnested.append([item['User'] for item in result_list])
        return pd.DataFrame(unnested[0], columns=['firstName', 'lastName', 'email'])

    def get_participants_from_session(self, session_id):
        variables = {'session_id': session_id}
        query = """query($session_id: Int) {
            CourseEnrollment(where: {Course: {Sessions: {id: {_eq: $session_id}}}}) {
                User {
                    firstName
                    lastName
                    email
                }
            }
        }"""
        result = self.send_query(query, variables)
        result_list = result['data']['CourseEnrollment']
        unnested = []
        unnested.append([item['User'] for item in result_list])
        return pd.DataFrame(unnested[0], columns=['firstName', 'lastName', 'email'])

    def get_participants_from_course(self, course_id):
        variables = {'course_id': course_id}
        query = """query($course_id: Int) {
            CourseEnrollment(where: {courseId: {_eq: $course_id}}) {
                User {
                    firstName
                    lastName
                    email
                }
            }
        }"""
        return self.send_query(query, variables)
