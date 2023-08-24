import logging
import os
import pandas as pd

# os.chdir("/home/steffen/00_code/eduhub/functions/callPythonFunction/")
from api_clients import EduHubClient, MattermostClient


def add_confirmed_user_to_mm(payload):
    logging.info("########## Add Confirmed User to Mattermost Function ##########")

    eduhub_client = EduHubClient()
    user_info = eduhub_client.get_user_details_from_id(
        user_id="152f12c3-f7d2-4b73-8d29-603c164b0139"
    )
    logging.debug("########## User Info:\n%s", user_info)

    mm_client = MattermostClient()
    return user_info

    # chatlinks = eduhub_client.get_channellinks_from_confirmed_users()

    # # test if emails is null
    # #if len(emails) == 0:
    #     #logging.info("No new confirmed Users")
    #     #return "No new confirmed Users found"
    # #else:
    #     #logging.info("########## Newly confirmed Users:\n%s",

    # for email in emails:
    #     user_id = mm_client.check_user_by_email(email)
    #     if user_id == False:
    #         password = mm_client.create_user(email)
    #         ###passwort muss verschickt werden
    #         user_id = mm_client.check_user_by_email(email)
    #     else:
    #         mm_client.add_user_to_team(user_id, team_id)
    #         mm_client.add_user_to_channel(user_id, channel_id) #General Channel
    #         mm_client.add_user_to_channel(user_id, channel_id) #23 Q&A Channel
    #         mm_client.add_user_to_channel(user_id, channel_id) #chatlink Channel
