import logging
import os

logging.basicConfig(level=logging.DEBUG)
# os.chdir("/home/steffen/00_code/eduhub/functions/callPythonFunction/")
from api_clients import EduHubClient, MattermostClient


def add_confirmed_user_to_mm(payload):
    logging.info("########## Add Confirmed User to Mattermost Function ##########")
    eduhub_client = EduHubClient()
    mattermost_client = MattermostClient()


    if is_new_status_confirmed(payload):
        user_id = extract_user_id
        course_id = extract_course_id
        user_details = eduhub_client.get_user_details_from_id(user_id)
        chatlink = eduhub_client.get_channellinks_from_confirmed_users(course_id)
        team_id = mattermost_client.get_team_id("opencampus.sh")
        user_email = user_details["email"]

        if mattermost_client.check_user_by_email(user_email) is False: 
            new_user_password = mattermost_client.create_user(user_email)
            new_user_id = mattermost_client.get_user_id(user_email)
            logging.info(
                "User created in Mattermost. Email: %s, User ID: %s",
                user_email,
                new_user_id,
            )
        else: 
            mattermost_client.add_user_to_team(user_id, team_id)
            mattermost_client.add_user_to_channel(user_id, chatlink)
            logging.info(
                "User added to team and channel in Mattermost. User ID: %s", user_id
            )


####Frage Event Sendmail: Müsste es dann nich schon im Tabelleneintrag eine Information geben, die sich ändert, sodass das EVent getriggert wird



##############################################################
#Helper Functions 

def is_new_status_confirmed(payload):
    try:
        # Extrahiere den Status aus der Payload
        status = payload["payload"]["event"]["data"]["new"]["status"]
        
        # Überprüfe, ob der Status "CONFIRMED" ist
        if status == "CONFIRMED":
            return True
        else:
            return False
    except KeyError:
        # Wenn ein erforderliches Feld in der Payload nicht vorhanden ist, gib False zurück
        return False
    

def extract_user_id(payload):
    try:
        # Extrahiere die UserID aus der Payload
        user_id = payload["payload"]["event"]["data"]["new"]["userId"]
        return user_id
    except KeyError:
        # Wenn die UserID nicht in der Payload gefunden wird, gib None zurück oder handle den Fehler entsprechend
        return None
    
def extract_course_id(payload):
    try:
        # Extrahiere die Course ID aus der Payload
        course_id = payload["payload"]["event"]["data"]["new"]["courseId"]
        return course_id
    except KeyError:
        # Wenn die Course ID nicht in der Payload gefunden wird, gib None zurück oder handle den Fehler entsprechend
        return None

