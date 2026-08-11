import logging
import requests
import os
from requests.structures import CaseInsensitiveDict
import pandas as pd

# Every request runs on a cloud function's request thread, so a stalled connection
# must fail instead of holding the invocation until the platform kills it. Generous
# enough for the bulk queries (the Hasura action itself allows 300s).
GRAPHQL_REQUEST_TIMEOUT_SECONDS = 60


class EduHubClient:
    def __init__(self):
        self.url = os.getenv("HASURA_ENDPOINT")
        self.hasura_admin_secret = os.getenv("HASURA_ADMIN_SECRET")
        if not self.url:
            raise ValueError("HASURA_ENDPOINT is not set")
        if not self.hasura_admin_secret:
            raise ValueError("HASURA_ADMIN_SECRET is not set")
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
                            occupation
                            Organization {
                                name
                            }
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
                # Extract and remove User data
                user_info = unnested_enrollment.pop("User")
                # Add all user info, handling Organization specially
                for key, value in user_info.items():
                    if key == "Organization":
                        # Handle case where Organization might be None
                        unnested_enrollment[f"User_{key}"] = value["name"] if value is not None else None
                    else:
                        unnested_enrollment[f"User_{key}"] = value
                # Add course info
                unnested_enrollment["Course_ects"] = item["ects"]
                unnested_enrollment["Course_title"] = item["title"]
                unnested_list.append(unnested_enrollment)
        # Convert the unnested list to a DataFrame
        return pd.DataFrame(unnested_list)

    def fetch_enrollments(self, user_ids, course_id):
        """
        Fetches enrollment data for given user IDs and a course ID from a GraphQL API.

        Raises:
            requests.exceptions.RequestException: If an error occurs during the request.

        Returns:
            list: A list of course enrollment records, or an empty list if no data is found.
        """
        # GraphQL query
        query = """query GetEnrollments($userIds: [uuid!]!, $courseId: Int!) {
            CourseEnrollment(where: {userId: {_in: $userIds}, Course: {id: {_eq: $courseId}}}) {
                User {
                    Attendances {
                        Session {
                            id
                            startDateTime
                        }
                    id
                    status
                    source
                    }
                    firstName
                    lastName
                    ProjectAuthors(
                        where: {participationStatus: {_eq: ACCEPTED}, Project: {status: {_eq: COMPLETED}, ProjectCourses: {courseId: {_eq: $courseId}}}},
                        order_by: {Project: {updated_at: desc}}, limit: 1
                    ) {
                        Project {
                            title
                            type
                            ProjectType {
                                CertificateTemplate { html }
                            }
                        }
                    }
                id
                }
                Course {
                    Program {
                        title
                        type
                        achievementCertificateTemplateURL
                        attendanceCertificateTemplateURL
                        AttendanceCertificateTemplate { html }
                        id
                    }
                    AchievementCertificateTemplate { html }
                    AttendanceCertificateTemplate { html }
                    Sessions(order_by: {startDateTime: asc}) {
                        id
                        title
                        startDateTime
                    }
                    id
                    ects
                    title
                    learningGoals
                    requiredEcts
                    requiredEventCount
                }
            }
        }"""
        # Variables for the GraphQL query
        variables = {
            "userIds": user_ids,
            "courseId": course_id 
        }

        try:
            response = requests.post(
                self.url,
                headers={"x-hasura-admin-secret": self.hasura_admin_secret},
                json={"query": query, "variables": variables},
                timeout=GRAPHQL_REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()  # Raises a HTTPError if the HTTP request returned an unsuccessful status code

            data = response.json()
            if not isinstance(data, dict):
                raise ValueError(
                    f"fetch_enrollments: expected JSON object, got {type(data).__name__}"
                )
            return self._extract_course_enrollment(data)
        except requests.exceptions.RequestException as e:
            # Handle any errors that occur during the request
            logging.error(f"An error occurred during fetch_enrollments: {e}")
            raise

    def fetch_degree_participations(self, user_ids, degree_course_id):
        """Fetches the degree-relevant member-course enrollments of all given users.

        A "degree" is a Course in a Program of type DEGREES; its member courses are
        linked through CourseDegree.degreeCourseId. A member enrollment qualifies
        when it either carries an achievementCertificateURL (a passed course) or
        belongs to an EVENTS program (enrollment alone counts, no certificate
        required). That is exactly the rule public.DegreeParticipationStats applies,
        so the certificate can never contradict the numbers shown in the admin UI.

        One query covers every user: degree certificates are generated as a bulk
        action, and the pre-refactor implementation ran one query per user.

        Args:
            user_ids (list): User UUIDs.
            degree_course_id (int): Id of the degree course.

        Returns:
            dict: {userId: [{"courseId", "title", "ects", "programTitle",
                             "programType", "hasAchievementCertificate"}, ...]}
                  Users without a qualifying enrollment are absent from the dict.
        """
        # Program.type is a plain text column (ProgramType is not a Hasura enum),
        # hence the quoted "EVENTS".
        query = """query GetDegreeParticipations($userIds: [uuid!]!, $degreeCourseId: Int!) {
            CourseEnrollment(
                where: {
                    userId: {_in: $userIds},
                    Course: {CourseDegrees: {degreeCourseId: {_eq: $degreeCourseId}}},
                    _or: [
                        {achievementCertificateURL: {_is_null: false}},
                        {Course: {Program: {type: {_eq: "EVENTS"}}}}
                    ]
                },
                order_by: [
                    {Course: {Program: {lectureStart: asc}}},
                    {Course: {title: asc}}
                ]
            ) {
                userId
                achievementCertificateURL
                Course {
                    id
                    title
                    ects
                    Program {
                        title
                        type
                    }
                }
            }
        }"""

        data = self._post_graphql(
            query,
            {"userIds": user_ids, "degreeCourseId": degree_course_id},
            "fetch_degree_participations",
        )
        rows = data.get("CourseEnrollment")
        if rows is None:
            raise ValueError(
                "fetch_degree_participations: missing CourseEnrollment in response"
            )

        participations = {}
        for row in rows:
            course = row.get("Course")
            if course is None:
                raise ValueError(
                    "fetch_degree_participations: missing Course on enrollment"
                )
            program = course.get("Program") or {}
            participations.setdefault(row["userId"], []).append(
                {
                    "courseId": course.get("id"),
                    "title": course.get("title"),
                    "ects": course.get("ects"),
                    "programTitle": program.get("title"),
                    "programType": program.get("type"),
                    "hasAchievementCertificate": row.get("achievementCertificateURL")
                    is not None,
                }
            )
        return participations

    def _post_graphql(self, query, variables, operation_name):
        """POSTs a GraphQL document with the admin secret and fails loudly.

        Unlike `send_query`, this raises on a non-200 response and on a populated
        `errors` key instead of returning a string / a half-empty payload. Use it
        wherever silently returning no data would produce a wrong result rather
        than a visible failure.

        Returns:
            dict: The `data` object of the response.
        """
        response = requests.post(
            self.url,
            headers={
                "x-hasura-admin-secret": self.hasura_admin_secret,
                "content-type": "application/json",
            },
            json={"query": query, "variables": variables},
            timeout=GRAPHQL_REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        self._raise_on_graphql_errors(data, operation_name)
        return data["data"]

    def _raise_on_graphql_errors(self, data, operation_name):
        if not isinstance(data, dict):
            raise ValueError(f"{operation_name}: expected JSON object, got {type(data).__name__}")
        if data.get("errors"):
            logging.error("%s GraphQL errors: %s", operation_name, data["errors"])
            raise ValueError(f"{operation_name} failed: {data['errors']}")
        if data.get("data") is None:
            raise ValueError(f"{operation_name}: missing data in GraphQL response")

    def _extract_course_enrollment(self, data):
        """
        Extracts course enrollment data from the API response.

        Args:
            data (dict): The response data from the API.

        Returns:
            list: A list of course enrollment records, or an empty list if no data is found.
        """
        self._raise_on_graphql_errors(data, "fetch_enrollments")
        try:
            enrollments = data["data"]["CourseEnrollment"]
        except KeyError as e:
            logging.error(f"Key error in response parsing: {e}")
            raise
        for enrollment in enrollments:
            course = enrollment.get("Course")
            if course is None:
                raise ValueError("fetch_enrollments: missing Course on enrollment")
            program = course.get("Program")
            if program is None:
                raise ValueError("fetch_enrollments: missing Program on Course")
            # `type` decides whether this is a degree certificate, and NULL is a
            # legitimate value for the two thresholds ("requirement not checked").
            # An *absent* key therefore has to fail loudly instead of silently
            # turning a degree into a project achievement / skipping the gate.
            if "type" not in program:
                raise ValueError("fetch_enrollments: missing type on Program")
            if "requiredEcts" not in course or "requiredEventCount" not in course:
                raise ValueError(
                    "fetch_enrollments: missing degree requirement columns on Course"
                )
            if "AttendanceCertificateTemplate" not in program:
                raise ValueError(
                    "fetch_enrollments: missing AttendanceCertificateTemplate on Program"
                )
            if "AchievementCertificateTemplate" not in course:
                raise ValueError(
                    "fetch_enrollments: missing AchievementCertificateTemplate on Course"
                )
            if "AttendanceCertificateTemplate" not in course:
                raise ValueError(
                    "fetch_enrollments: missing AttendanceCertificateTemplate on Course"
                )
            user = enrollment.get("User")
            if user is None:
                raise ValueError("fetch_enrollments: missing User on enrollment")
            project_authors = user.get("ProjectAuthors")
            if project_authors is None:
                raise ValueError("fetch_enrollments: missing ProjectAuthors on User")
            for author in project_authors:
                project = author.get("Project")
                if project is None:
                    continue
                project_type = project.get("ProjectType")
                if project_type is None:
                    raise ValueError("fetch_enrollments: missing ProjectType on Project")
                if "CertificateTemplate" not in project_type:
                    raise ValueError(
                        "fetch_enrollments: missing CertificateTemplate on ProjectType"
                    )
        return enrollments
        

    def _safe_iloc(self, series, cast=None):
        """Safely extract the first value from a DataFrame column (Series).
        Returns None when the column is missing or empty."""
        if series is None:
            return None
        if hasattr(series, "empty") and series.empty:
            return None
        val = series.iloc[0]
        if pd.isnull(val):
            return None
        return cast(val) if cast else val

    def insert_attendance(self, course_participant_attendance):
        col = course_participant_attendance.get
        variables = {
            "leaveDateTime": self._safe_iloc(col("leaveDateTime")),
            "interruptionCount": self._safe_iloc(col("interruptionCount"), cast=int),
            "recordedIdentifier": self._safe_iloc(col("recordedIdentifier")),
            "matchType": self._safe_iloc(col("matchType")),
            "sessionId": self._safe_iloc(col("sessionId"), cast=int),
            "source": self._safe_iloc(col("source")),
            "joinDateTime": self._safe_iloc(col("joinDateTime")),
            "status": self._safe_iloc(col("status")),
            "totalAttendanceTime": self._safe_iloc(col("duration"), cast=int),
            "userId": self._safe_iloc(col("userId")),
            "location": self._safe_iloc(col("location"), cast=str),
        }
        mutation = """mutation($leaveDateTime: timestamptz, $interruptionCount: Int, $recordedIdentifier: String,
                               $matchType: String, $sessionId: Int, $source: String, $joinDateTime: timestamptz,
                               $status: AttendanceStatus_enum, $totalAttendanceTime: Int, $userId: uuid, $location: String) {
            insert_Attendance(objects: {endDateTime: $leaveDateTime, interruptionCount: $interruptionCount,
            recordedIdentifier: $recordedIdentifier, matchType: $matchType, sessionId: $sessionId, source: $source,
            startDateTime: $joinDateTime, status: $status, totalAttendanceTime: $totalAttendanceTime, userId: $userId,
            location: $location}) {
                returning {
                    id
                    created_at
                    endDateTime
                    interruptionCount
                    recordedIdentifier
                    matchType
                    sessionId
                    source
                    startDateTime
                    status
                    totalAttendanceTime
                    updated_at
                    userId
                    location
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

    def get_user_details_from_id(self, user_id):
        variables = {"userId": f"{user_id}"}
        query = """query ($userId: uuid!) {
            User(where: {id: {_eq: $userId}}) {
                email
                firstName
                lastName
                id
            }
        }"""
        result = self.send_query(query, variables)
        return pd.json_normalize(result["data"]["User"])

    def get_channellinks_from_confirmed_users(self, id):
        variables = {"id": id}
        query = """query ($id: Int!) {
            Course(where: {id: {_eq: $id}}) {
                chatLink
                }
            }
        """
        result = self.send_query(query, variables)

        # Check for errors in the GraphQL response
        if "errors" in result:
            return None  # or handle error as appropriate for your use case
        try:
            chat_link = result["data"]["Course"][0]["chatLink"]
            return chat_link
        except (KeyError, IndexError) as e:
            return None  # or handle error as appropriate for your use case

    def update_course_enrollment_record(self, user_id, course_id, certificate_url, certificate_type):
        """
        Updates the course enrollment record with a new certificate URL.

        Args:
            certificate_url (str): The new URL for the course certificate.

        Returns:
            tuple: A tuple containing a boolean indicating success and the number of affected rows.
        """
        if certificate_type == "achievement":
            mutation = """
            mutation UpdateAchievementCertificate($userId: uuid!, $courseId: Int!, $certificateUrl: String!) {
                update_CourseEnrollment(
                    where: { 
                        userId: { _eq: $userId }, 
                        courseId: { _eq: $courseId } 
                    },
                    _set: {
                        achievementCertificateURL: $certificateUrl
                    }
                ) {
                    affected_rows
                }
            }"""
        else:
            mutation = """
            mutation UpdateAttendanceCertificate($userId: uuid!, $courseId: Int!, $certificateUrl: String!) {
                update_CourseEnrollment(
                    where: { 
                        userId: { _eq: $userId }, 
                        courseId: { _eq: $courseId } 
                    },
                    _set: {
                        attendanceCertificateURL: $certificateUrl
                    }
                ) {
                    affected_rows
                }
            }"""

        variables = {
            "userId": user_id,
            "courseId": course_id,
            "certificateUrl": certificate_url
        }

        return self.send_query(mutation, variables)