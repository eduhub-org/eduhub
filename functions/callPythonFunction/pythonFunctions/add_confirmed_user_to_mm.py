
import os
import requests
import logging

from api_clients import EduHubClient, MattermostClient


def add_confirmed_user_to_mm(payload):
    eduhub_client = EduHubClient()
    mattermost_client = MattermostClient()

    if is_new_status_confirmed(payload):
        
        
        user_id = extract_user_id(payload)
        course_id = extract_course_id(payload)

    
        #Hasura Queries to get all necessary information
        user_details = eduhub_client.get_user_details_from_id(user_id)
        chatlink = eduhub_client.get_channellinks_from_confirmed_users(course_id)

        team_id = mattermost_client.get_team_id("opencampus")
        user_email = extract_email(user_details)
            
        if mattermost_client.check_user_by_email(user_email) is False: 
            logging.info("########## Theres no Mattermost User with this email yet ###############")
        else:
            mm_user_id=mattermost_client.get_user_id(user_email)
            mattermost_client.add_user_to_team(mm_user_id, team_id)
            channel_id = mattermost_client.get_channel_id(team_id, chatlink)
            mattermost_client.add_user_to_channel(mm_user_id, channel_id)
    else:
        #Der Status wurde getriggert, aber nicht auf confirmed, sondern z. B. auf applied geändert 
        logging.info("########## User isn't confirmed ##########")


##############################################################
#Helper Functions 

def is_new_status_confirmed(payload):
    try:
        # Extract the Status from the payload
        status = payload["event"]["data"]["new"]["status"]
        if status == "CONFIRMED":
            return True
        else:
            return False
    except KeyError:
        logging.info(
            "########## Key error"
        )
        # If something is missing in the payload, simply return False
        return False
    

def extract_user_id(payload):
    try:
        # Extract the User id from the Payload
        user_id = payload["event"]["data"]["new"]["userId"]
        return user_id
    except KeyError:
        # If something is missing, return None
        return None
    
def extract_course_id(payload):
    try:
        # Extrahiere die Course ID aus der Payload
        course_id = payload["event"]["data"]["new"]["courseId"]
        return course_id
    except KeyError:
        # Wenn die Course ID nicht in der Payload gefunden wird, gib None zurück oder handle den Fehler entsprechend
        return None
    
def extract_email(user_details):
    return user_details["email"].iloc[0]

