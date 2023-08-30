import logging
import requests
import os
from requests.structures import CaseInsensitiveDict
import pandas as pd


class EduHubClient:
    def __init__(self):
        self.url = os.getenv("HASURA_ENDPOINT", "http://localhost:8080/v1/graphql")
        self.hasura_admin_secret = os.getenv(
            "HASURA_GRAPHQL_ADMIN_KEY", "myadminsecretkey"
        )
        self.headers = ""

    def set_url(self, url: str):
        self.url = url

    def set_hasura_admin_secret(self, hasura_admin_secret: str):
        self.hasura_admin_secret = hasura_admin_secret

    def set_headers(self):
        self.headers = CaseInsensitiveDict()
        self.headers["x-hasura-admin-secret"] = self.hasura_admin_secret
        self.headers["content-type"] = "application/json"

    def to_datetime(self, date_time):
        hasura_format = "%Y-%m-%dT%H:%M:%S%z"
        reference_timezone = "Europe/Berlin"
        date_time = pd.to_datetime(date_time, format=hasura_format)
        return date_time.tz_convert(reference_timezone)

    def send_query(self, query, variables):
        self.set_headers()
        logging.debug(
            f"URL: {self.url}\nHeader: {self.headers}\nQuery: {query}\nVariables: {variables}"
        )
        r = requests.post(
            self.url,
            json={"query": query, "variables": variables},
            headers=self.headers,
        )
        if r.status_code == 200:
            return r.json()
        else:
            print(f"Response text: {r.text}")
            return f"Something went wrong. HTTP Code: {r.status_code}"

    def get_finished_sessions_without_attendance_check(self):
        variables = {}
        query = """query {
            Session(where: {attendanceData: {_is_null: true}, endDateTime: {_lt: "now()"}}) {
                id
                title
                startDateTime
                endDateTime
                Course {
                    CourseLocations {
                        locationOption
                        defaultSessionAddress
                    }
                }
                SessionAddresses {
                    address
                    type
                }
            }
        }"""
        result = self.send_query(query, variables)
        if result.get("data") is None:
            return logging.error(f"{result}")
        result_list = result["data"]["Session"]

        # convert startDateTime and endDateTime to datetime
        for session in result_list:
            session["startDateTime"] = self.to_datetime(session["startDateTime"])
            session["endDateTime"] = self.to_datetime(session["endDateTime"])

        return result_list

    def get_course_participants_from_session_id(self, session_id):
        variables = {"session_id": f"{session_id}"}
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
        if result.get("data") is None:
            return logging.error(f"{result}")
        result_list = result["data"]["CourseEnrollment"]
        unnested_list = []
        unnested_list.append([item["User"] for item in result_list])
        return pd.DataFrame(
            unnested_list[0], columns=["id", "firstName", "lastName", "email"]
        )

    def get_participants_from_course(self, course_id):
        variables = {"course_id": course_id}
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
        result_list = result["data"]["CourseEnrollment"]
        unnested_list = []
        unnested_list.append([item["User"] for item in result_list])
        return pd.DataFrame(
            unnested_list[0], columns=["id", "firstName", "lastName", "email"]
        )

    def get_participants_from_program(self, program_id):
        variables = {"program_id": program_id}
        query = """query($program_id:Int!) {
            Program_by_pk(id: $program_id) {
                Courses {
                    CourseEnrollments {
                        achievementCertificateURL
                        attendanceCertificateURL
                        courseId
                        status
                        User {
                            firstName
                            lastName
                            email
                            matriculationNumber
                            otherUniversity
                            university
                            employment
                        }
                    }
                    ects
                    title
                }
            }
        }"""
        result = self.send_query(query, variables)
        result_list = result["data"]["Program_by_pk"]["Courses"]
        unnested_list = []
        for item in result_list:
            for enrollment in item["CourseEnrollments"]:
                unnested_enrollment = enrollment.copy()
                user_info = unnested_enrollment.pop("User")
                for key, value in user_info.items():
                    unnested_enrollment[f"User_{key}"] = value
                unnested_enrollment["Course_ects"] = item["ects"]
                unnested_enrollment["Course_title"] = item["title"]
                unnested_list.append(unnested_enrollment)
        # Convert the unnested list to a DataFrame
        return pd.DataFrame(unnested_list)

    def insert_attendance(self, course_participant_attendance):
        variables = {
            "leaveDateTime": course_participant_attendance.get("leaveDateTime").iloc[0],
            "interruptionCount": None
            if course_participant_attendance.get("interruptionCount").iloc[0] is None
            else int(course_participant_attendance.get("interruptionCount").iloc[0]),
            "recordedName": course_participant_attendance.get("recordedName").iloc[0],
            "sessionId": int(course_participant_attendance.get("sessionId").iloc[0]),
            "source": course_participant_attendance.get("source").iloc[0],
            "joinDateTime": course_participant_attendance.get("joinDateTime").iloc[0],
            "status": course_participant_attendance.get("status").iloc[0],
            "totalAttendanceTime": None
            if course_participant_attendance.get("duration").iloc[0] is None
            else int(course_participant_attendance.get("duration").iloc[0]),
            "userId": course_participant_attendance.get("userId").iloc[0],
        }
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

    def update_session_attendanceData(self, attendance_data, session_id):
        variables = {
            "sessionId": int(session_id),
            "attendanceData": attendance_data.to_json(),
        }
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
