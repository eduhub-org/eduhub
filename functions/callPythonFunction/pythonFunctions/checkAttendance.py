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


def checkAttendance():
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
    edu = api.EduHub()
    sessions = edu.get_sessions_without_attendance_check()

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

        # Get course participants
        course_participants = edu.get_participants_from_session(
            session_id=session['id'])

        # Matching each course participant with the names in the attendance data
        # and storing the partipant's attendance in the Attendance table
        for participant in course_participants:
            participant_attendance = get_participant_attendance(
                participant, attendance_data)
            edu.mutate_attendance(participant_attendance)

        # Storing JSON of complete attendance_data in Session table
        edu.mutate_session_attendanceData(session['id'], attendance_data)

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
        # Format time variable
        survey_answers['joinDateTime'] = lms.to_datetime(
            survey_answers['joinDateTime'])
        # Filter to only those answers who registered during the correct time
        session_attendances = survey_answers.iloc[(survey_answers['joinDateTime'] >= (session['startDateTime'] - pd.Timedelta(hours=1))) & (
            survey_answers['joinDateTime'] <= (session['endDateTime'] + pd.Timedelta(hours=1)))]

        # TODO If offline address is provided in the session filter the attendances
        # additionally according to the given location

        return session_attendances


def get_participant_attendance(participant, attendance_data):
    """lorem  ipsum"""
    participant_attendance = []
    return participant_attendance
