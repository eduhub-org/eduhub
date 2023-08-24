import os
import logging
import pandas as pd
from fuzzywuzzy import fuzz
from api_clients import EduHubClient, ZoomClient, LimeSurveyClient


def check_attendance(payload):
    """For all sessions for which the attendance hasn't been checked yet
    (no attendance data stored in the session table), gets the participations
    from Zoom and Limesurvey and adds the individual attendances to the
    attandance table (for each registered and correctly identified person)
    and the Session table (a JSON including all recorded participants of the
    session).
    Args:
        <Null>
    Returns:
        Ids of the sessions for which the attendances were checked
    """
    logging.info("########## Check Attendance Function ##########")

    eduhub_client = EduHubClient()
    logging.debug(f"eduhub_client.url:  {eduhub_client.url}")
    sessions = eduhub_client.get_finished_sessions_without_attendance_check()

    # test if session is null
    if len(sessions) == 0:
        logging.info("No finished sessions without attendance check found")
        return "No finished sessions without attendance check found"
    else:
        logging.info(
            "########## Finished Sessions without Attendance Check:\n%s", sessions
        )

    with pd.option_context(
        "display.max_rows", None, "display.max_columns", None, "display.width", None
    ):
        logging.debug("########## Full DataFrame:\n%s", sessions)

    zoom_client = ZoomClient()

    # iterate over all elements in the sessions dictionary
    for session in sessions:
        logging.info(
            f"########## Checking session {session['title']} from {session['startDateTime']} to {session['endDateTime']}"
        )

        attendance_data = pd.DataFrame()

        # iterate over all location options in the session and get the corresponding attendance data
        for location in session["Course"]["CourseLocations"]:
            logging.info("### Getting attendances for %s", location["locationOption"])

            # Checking zoom attendance
            if location["locationOption"] == "ONLINE":
                try:
                    zoom_attendance = zoom_client.get_session_attendance(
                        location["defaultSessionAddress"]
                    )
                    logging.debug(
                        f"############# Zoom Attendance Data\n{zoom_attendance}"
                    )
                    zoom_attendance["source"] = "ZOOM"
                    attendance_data = pd.concat([attendance_data, zoom_attendance])
                except Exception as e:
                    logging.error(f"Error while getting Zoom attendance: {e}")

            # Checking offline attendance
            elif location["locationOption"] == "KIEL":
                logging.info("Getting offline attendances from LimeSurvey")
                offline_attendance = get_offline_session_attendance(session, location)
                offline_attendance["source"] = "LIMESURVEY"
                logging.debug(
                    f"############# Offline Attendance Data\n{offline_attendance}"
                )
                attendance_data = pd.concat([attendance_data, offline_attendance])

        logging.debug(f"############# Attendance Data\n{attendance_data}")

        # attendance_data['sessionId'] = session['id']
        # reset the index for later argmax search in `prepare_participant_attendance_data()`
        attendance_data.reset_index(drop=True, inplace=True)
        logging.debug(f"############# Attendance Data\n{attendance_data}")

        # Get course participants
        course_participants = eduhub_client.get_course_participants_from_session_id(
            session["id"]
        )
        logging.info(
            "########## Checking attendances for the %s confirmed participants in the session's course",
            len(course_participants),
        )
        # Matching each course participant with the names in the attendance data
        # and storing the partipant's attendance in the Attendance table
        pd.options.mode.chained_assignment = None  # default='warn'

        for p in range(len(course_participants)):
            try:
                logging.debug(
                    f"############# Preparation of attendance data for participant {course_participants.iloc[p, :]['firstName']} {course_participants.iloc[p, :]['lastName']}"
                )
                course_participant_attendance = prepare_participant_attendance_data(
                    course_participants.iloc[p, :], attendance_data, session["id"]
                )
                logging.debug(
                    f"############# Course Participant Attendance\n{course_participant_attendance}"
                )
                eduhub_client.insert_attendance(course_participant_attendance)
                logging.info(
                    "### %s: %s [%s: %s to %s; recorded name: %s]",
                    course_participants.iloc[p, :]["email"],
                    course_participant_attendance["status"][0],
                    course_participant_attendance["source"][0],
                    course_participant_attendance["joinDateTime"][0],
                    course_participant_attendance["leaveDateTime"][0],
                    course_participant_attendance["recordedName"][0],
                )
            except Exception as e:
                logging.error(
                    f"Error while preparing attendance data for participant {course_participants.iloc[p, :]['firstName']} {course_participants.iloc[p, :]['lastName']}: {e}"
                )
        # Storing JSON of complete attendance_data in Session table
        eduhub_client.update_session_attendanceData(attendance_data, session["id"])
        logging.info("Attendance data updated for session %s", session["title"])

    return sessions


#############################################################################################
# Helper functions


def get_offline_session_attendance(session, location):
    """Retrieves the attendance registration from LimeSurvey, filters them to those relevant for the
    indicated session, and brings them into the needed format"""
    if session.get("startDateTime") is None or session.get("endDateTime") is None:
        return "Error: Attendances cannot be checked since start or end time of the meeting was not provided"
    else:
        # Retrieve survey data from LimeSurvey
        limesurvey_client = LimeSurveyClient(sid=os.getenv("LMS_ATTENDANCE_SURVEY_ID"))
        logging.debug(
            "############# LMS_ATTENDANCE_SURVEY_ID:\n%s",
            os.getenv("LMS_ATTENDANCE_SURVEY_ID"),
        )
        limesurvey_client.set_key(limesurvey_client.get_session_key())
        survey_answers = limesurvey_client.get_responses()
        logging.debug("############# Survey Answers\n%s", survey_answers)
        # Rename variables from LimeSurvey
        survey_answers.rename(
            columns={
                "datestamp": "joinDateTime",
                "N1": "firstName",
                "N2": "lastName",
                "Place": "location",
            },
            inplace=True,
        )
        # New column for full name
        survey_answers["name"] = (
            survey_answers["firstName"] + " " + survey_answers["lastName"]
        )
        # Format time variable
        survey_answers["joinDateTime"] = limesurvey_client.to_datetime(
            survey_answers["joinDateTime"]
        )
        logging.debug("############# Survey Answers\n%s", survey_answers)
        # Filter to only those answers who registered during the correct time
        # session_attendances = survey_answers[(survey_answers['joinDateTime'] >= (session['startDateTime'] - pd.Timedelta(hours=1))) & (
        #     survey_answers['joinDateTime'] <= (session['endDateTime'] + pd.Timedelta(hours=1)))]
        session_attendances = survey_answers[
            (survey_answers["joinDateTime"] >= (session["startDateTime"]))
        ].copy()
        logging.debug("############# Session Attendances\n%s", session_attendances)

        # TODO If offline address is provided in the session filter the attendances
        # additionally according to the given location

        # Add interruption count, duration and leaveDateTime of None since not available for offline sessions
        session_attendances["interruptionCount"] = None
        session_attendances["duration"] = None
        session_attendances["leaveDateTime"] = None

        return session_attendances


def prepare_participant_attendance_data(participant, attendance_data, session_id):
    """Prepares the attendance data for each participant by matching the participant's name"""
    logging.debug("############# Participant\n%s", participant)
    participant_full_name = participant["firstName"] + " " + participant["lastName"]
    # If no attendance data is available for the session, the participant is marked as MISSED
    if len(attendance_data) == 0:
        participant_attendance = pd.DataFrame(
            [
                {
                    "userId": participant["id"],
                    "sessionId": int(session_id),
                    "interruptionCount": None,
                    "duration": None,
                    "joinDateTime": None,
                    "leaveDateTime": None,
                    "score": None,
                    "status": "MISSED",
                    "recordedName": None,
                }
            ]
        )
    else:
        # Matching participant's name with the names in the attendance data
        attendance_data["score"] = [
            fuzz.token_sort_ratio(participant_full_name.lower(), str(name).lower())
            for name in attendance_data["name"]
        ]
        logging.debug("############# Attendance Data\n%s", attendance_data)
        participant_attendance = attendance_data.iloc[attendance_data["score"].idxmax()]
        participant_attendance["userId"] = participant["id"]
        # Formatting of the missing/ null values to None for GraphQL
        participant_attendance = participant_attendance.where(
            pd.notnull(participant_attendance), None
        )
        # Formatting of the int variables for GraphQL
        participant_attendance["sessionId"] = int(session_id)
        if participant_attendance["interruptionCount"] is not None:
            participant_attendance["interruptionCount"] = int(
                participant_attendance["interruptionCount"]
            )
        if participant_attendance["duration"] is not None:
            participant_attendance["duration"] = int(participant_attendance["duration"])
        # Formatting of the datetime variables for GraphQL
        if participant_attendance["joinDateTime"] is not None:
            participant_attendance["joinDateTime"] = str(
                participant_attendance["joinDateTime"]
            )
        if participant_attendance["leaveDateTime"] is not None:
            participant_attendance["leaveDateTime"] = str(
                participant_attendance["leaveDateTime"]
            )

        if participant_attendance["score"] >= 80:
            participant_attendance["status"] = "ATTENDED"
            participant_attendance["recordedName"] = participant_attendance["name"]
        else:
            participant_attendance["status"] = "MISSED"
            participant_attendance["recordedName"] = participant_attendance["name"]
    return pd.DataFrame([participant_attendance.to_dict()])

    # Other potential functions are fuzz.ratio() and fuzz.partial_ratio()
    # For testing purposes:
    # data = [[fuzz.token_sort_ratio(participant_full_name.lower(), name.lower()), name]
    #        for name in attendance_data['name']]
    # m = pd.DataFrame(data=data, columns={'score', 'name'})
    # mlist = list(m.iloc[m['score'].idxmax()])
