import os
from typing import Optional, Dict, Union, Any
from authlib.jose import jwt
import json
import yaml
import logging
#import api
import pandas as pd
from flask import escape
from flask import jsonify


edu = EduHub()
res = edu.get_participants_from_session(21)


def get_zoom_attendances(arguments_json):
    logging.info(f"Getting online attendances from Zoom")
    zz = api.Zoom()
    meeting_id = get_meeting_id(arguments_json['meeting_url'])
    # gets the particpations for the last occuring meeting under the given url
    zoom_session = zz.get_last_meeting_session(meeting_id)
    if zoom_session.status_code != 200:
        return f"Error: Zoom API answered with {zoom_session} \n\nFull Text: {zoom_session.text}"
    logging.info(f"Zoom API response: {zoom_session}")
    logging.info(f"Zoom API response text: {zoom_session.text}")
    zoom_session = json.loads(zoom_session.text)
    if zoom_session.get('participants') is None:
        return f"Report has no participants. Are you sure the meeting id is correct?\nReport:\n{zoom_session.text}"
    zoom_attendances = format_zoom_attendances(zoom_session['participants'])
    logging.info("participants:", zoom_attendances)
    return zoom_attendances


def get_offline_attendances(arguments_json):
    if (arguments_json.get('start_datetime') is None or arguments_json.get('end_datetime') is None):
        return "Error: Attendances cannot be checked since start or end time of the meeting was not provided"
    else:
        print("Getting offline participations via LimeSurvey")
        lms = api.OC_limesurvey(sid=os.getenv("LMS_ATTENDANCE_SURVEY_ID"))
        # lms.set_survey_id()
        lms.set_key(lms.get_session_key())
        survey_answers = lms.get_answers()
        offline_attendances = lms.clean_responses(survey_answers)
        offline_attendances = lms.filter_attendances_by_time(
            offline_attendances, arguments_json['start_datetime'], arguments_json['end_datetime'])
        offline_attendances = pd.DataFrame(
            offline_attendances, columns=['firstName', 'lastName', 'joinDateTime', 'location'])

        return offline_attendances


def oc_get_participants_hybrid(arguments_json):
    """Get the participations from Zoom and Limesurvey and return a list.
    Args:
        A json of the following structure:
        {'meeting_url': 'https://opencampus.zoom.us/j/99999999999?from=addon',
         'start_time': '2022-11-2T16:00:00Z',
         'end_time': '2022-11-2T18:00:00Z'
        }
    Returns:
        A list of participations report for a meeting including
        participation entries provided via LimeSurvey in a given time window
        the repport from the Zoom API,
        containing information about meeting (date and time, name) and
        about the participants (name, time, mail).
    """

    # Get offline participations from LimeSurvey
    offline_participations = get_offline_attendances(arguments_json)
    # Get online participations from Zoom if `meeting_url' is provided
    if (arguments_json.get('meeting_url') is not None):
        participation_report = get_zoom_attendances(arguments_json)
    # Merging data for online and offline participation
    return merge(participation_report, offline_participations)


def read_yaml(yaml_path):
    """Read the configuration parameters and secrets from the YAML file"""
    with open(yaml_path) as file:
        yaml_config = yaml.load(file, Loader=yaml.FullLoader)
    return yaml_config


def get_meeting_id(meeting_url):
    """It removes the http part at the beginning and password or addon part in the end of the meeting_id"""
    if meeting_url[:4] == 'http' or meeting_url.find('/j/') > 0:
        meeting_url = meeting_url.split('/j/')[1]
    if meeting_url.find('?') > 0:
        meeting_url = meeting_url[:meeting_url.index('?')]
    return meeting_url


def merge(online_participants, offline_participants):

    all_participants = []
    for part in online_participants:
        h_part = {'name': part['name'],
                  'email': part['user_email'],
                  'join_time': part['join_time'],
                  'leave_time': part['leave_time'],
                  'duration': part['duration'],
                  'type': "online",
                  'place': "zoom"
                  }
        all_participants.append(h_part)

    for part in offline_participants:
        join_time = part['datestamp'][:10] + "T" + part['datestamp'][11:] + "Z"
        h_part = {'name': part['name'] + " " + part['surname'],
                  'email': "",
                  'join_time': join_time,
                  'leave_time': "",
                  'duration': "",
                  'type': "offline",
                  'place': part['place']
                  }
        all_participants.append(h_part)

    return all_participants


def format_zoom_attendances(session_participants):
    attendances = pd.DataFrame(
        session_participants, columns=['name', 'email', 'join_time', 'leave_time', 'duration'])
    attendances['duration'] = attendances.groupby(
        ['name']).transform('sum')['duration']
    attendances['interruptionCount'] = attendances.groupby(
        ['name']).transform('count')['duration']
    attendances = attendances.drop_duplicates('name')
    return attendances
