import os
from typing import Optional, Dict, Union, Any
from authlib.jose import jwt
import json
import yaml
import logging
import api
import pandas as pd
from flask import escape
from flask import jsonify
from fuzzywuzzy import fuzz


def checkAttendance(payload):
    """ For all sessions for which the attendance hasn't been checked yet
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

    return payload

    edu = api.EduHub()
    sessions = edu.get_finished_sessions_without_attendance_check()

    zoom = api.Zoom()

    for session in sessions:
        attendance_data = pd.DataFrame()

        # Checking zoom attendance
        if session.get('link') is not None:
            zoom_attendance = zoom.get_session_attendance(session['link'])
            zoom_attendance['source'] = 'ZOOM'
            attendance_data = pd.concat([attendance_data, zoom_attendance])

        # Checking offline attendance
        # TODO: Only execute if an offline address is provided
        # if session.get('latitude') is not None:
        offline_attendance = get_offline_session_attendance(session)
        offline_attendance['source'] = 'LIMESURVEY'
        attendance_data = pd.concat([attendance_data, offline_attendance])

        attendance_data['sessionId'] = session['id']
        # reset the index for later argmax search in `get_attendance_data()`
        attendance_data.reset_index(drop=True, inplace=True)

        # Get course participants
        course_participants = edu.get_course_participants_from_session_id(
            session_id=session['id'])

        # Matching each course participant with the names in the attendance data
        # and storing the partipant's attendance in the Attendance table
        pd.options.mode.chained_assignment = None  # default='warn'

        for p in range(len(course_participants)):
            course_participant_attendance = get_attendance_data(
                course_participants.iloc[p, :], attendance_data)
            edu.insert_attendance(course_participant_attendance)

        # Storing JSON of complete attendance_data in Session table
        edu.update_session_attendanceData(attendance_data)

    return sessions


#############################################################################################
# Helper functions

def get_offline_session_attendance(session):
    """Retrieves the attendance registration from LimeSurvey, filters them to those relevant for the
    indicated session, and brings them into the needed format"""
    if (session.get('startDateTime') is None or session.get('endDateTime') is None):
        return "Error: Attendances cannot be checked since start or end time of the meeting was not provided"
    else:
        # Retrieve survey data from LimeSurvey
        lms = api.LimeSurvey(sid=os.getenv("LMS_ATTENDANCE_SURVEY_ID"))
        lms.set_key(lms.get_session_key())
        survey_answers = lms.get_responses()
        # Rename variables from LimeSurvey
        survey_answers.rename(columns={'datestamp': 'joinDateTime', 'N1': 'firstName',
                              'N2': 'lastName', 'Place': 'location'}, inplace=True)
        # New column for full name
        survey_answers['name'] = survey_answers['firstName'] + \
            ' ' + survey_answers['lastName']
        # Format time variable
        survey_answers['joinDateTime'] = lms.to_datetime(
            survey_answers['joinDateTime'])
        # Filter to only those answers who registered during the correct time
        session_attendances = survey_answers[(survey_answers['joinDateTime'] >= (session['startDateTime'] - pd.Timedelta(hours=1))) & (
            survey_answers['joinDateTime'] <= (session['endDateTime'] + pd.Timedelta(hours=1)))]

        # TODO If offline address is provided in the session filter the attendances
        # additionally according to the given location

        return session_attendances


def get_attendance_data(participant, attendance_data):
    """lorem  ipsum"""
    participant_full_name = participant['firstName'] + \
        ' ' + participant['lastName']
    attendance_data['score'] = [fuzz.token_sort_ratio(participant_full_name.lower(), name.lower())
                                for name in attendance_data['name']]
    participant_attendance = attendance_data.iloc[attendance_data['score'].idxmax(
    )]
    participant_attendance['userId'] = participant['id']
    # Formatting of the missing/ null values to None for GraphQL
    participant_attendance = participant_attendance.where(
        pd.notnull(participant_attendance), None)
    # Formatting of the int variables for GraphQL
    participant_attendance['sessionId'] = int(
        attendance_data['sessionId'][0])
    if participant_attendance['interruptionCount'] is not None:
        participant_attendance['interruptionCount'] = int(
            participant_attendance['interruptionCount'])
    if participant_attendance['duration'] is not None:
        participant_attendance['duration'] = int(
            participant_attendance['duration'])
    # Formatting of the datetime variables for GraphQL
    if participant_attendance['joinDateTime'] is not None:
        participant_attendance['joinDateTime'] = str(
            participant_attendance['joinDateTime'])
    if participant_attendance['leaveDateTime'] is not None:
        participant_attendance['leaveDateTime'] = str(
            participant_attendance['leaveDateTime'])

    if (participant_attendance['score'] >= 80):
        participant_attendance['status'] = 'ATTENDED'
        participant_attendance['recordedName'] = participant_attendance['name']
    else:
        participant_attendance['status'] = 'MISSED'
        participant_attendance['recordedName'] = None
    return pd.DataFrame(participant_attendance).transpose()

    # Other potential functions are fuzz.ratio() and fuzz.partial_ratio()
    # For testing purposes:
    # data = [[fuzz.token_sort_ratio(participant_full_name.lower(), name.lower()), name]
    #        for name in attendance_data['name']]
    # m = pd.DataFrame(data=data, columns={'score', 'name'})
    # mlist = list(m.iloc[m['score'].idxmax()])
