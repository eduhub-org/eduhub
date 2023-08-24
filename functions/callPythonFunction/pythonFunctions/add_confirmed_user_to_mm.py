'''import logging
import os 
from api_clients import EduHubClient, MattermostClient


def addConfirmedToMM(payload):
    eduhub_client = EduHubClient()
    mm_client = MattermostClient()
    emails = eduhub_client.get_email_from_confirmed_users(###payload? ID?)
    chatlinks = eduhub_client.get_channellinks_from_confirmed_users()
    
    # test if emails is null
    #if len(emails) == 0:
        #logging.info("No new confirmed Users")
        #return "No new confirmed Users found"
    #else:
        #logging.info("########## Newly confirmed Users:\n%s",
                     sessions)

    for email in emails: 
        user_id = mm_client.check_user_by_email(email)
        if user_id == False: 
            password = mm_client.create_user(email)
            ###passwort muss verschickt werden 
            user_id = mm_client.check_user_by_email(email)
        else:
            mm_client.add_user_to_team(user_id, team_id)
            mm_client.add_user_to_channel(user_id, channel_id) #General Channel
            mm_client.add_user_to_channel(user_id, channel_id) #23 Q&A Channel
            mm_client.add_user_to_channel(user_id, channel_id) #chatlink Channel 
            
        
    '''