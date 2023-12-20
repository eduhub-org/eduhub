import os
import logging
import pandas as pd
from fuzzywuzzy import fuzz
from datetime import datetime
from utils import is_admin

# os.chdir("/home/steffen/00_code/eduhub/functions/callPythonFunction/")
from api_clients import EduHubClient, StorageClient


def load_participation_data(hasura_secret, arguments):
    """Function to load participation data from the csv file and update the attendance data in the database
    Args:
        hasura_secret (str): Secret to authenticate the user
        arguments (dict): Payload containing the function parameters
    Returns:
        string: Returns a link to the file including the participation data
    """
    logging.info("########## Load Participation Data Function ##########")

    if not is_admin(hasura_secret, arguments):
        return "error: user is not admin!"

    # Instantiate the EduHubClient
    eduhub_client = EduHubClient()
    logging.debug(f"eduhub_client.url:  {eduhub_client.url}")

    # Get the parameters from the payload
    logging.debug(f"arguments:  {arguments}")
    program_id = arguments["input"]["programId"]

    # program_id = 4

    # Get the program details
    participant_data = eduhub_client.get_participants_from_program(program_id)
    logging.debug("CSV with participation data for program %s retrieved", program_id)

    # Instantiate the StorageClient
    storage_client = StorageClient()
    logging.debug(f"storage_client.bucket_name:  {storage_client.bucket_name}")

    # Upload the CSV to Google Cloud Storage
    url = storage_client.upload_csv_from_dataframe(
        "temp", generate_filename(program_id), participant_data
    )

    logging.info(
        "CSV with participation data for program %s saved under %s",
        program_id,
        url,
    )

    return {"link": url}


#############################################################################################
# Helper functions


def generate_filename(program_id):
    # Format the current date and time to a string (e.g., "220823_123456" for August 23, 2022, at 12:34:56 PM)
    date_time_str = datetime.now().strftime("%y%m%d_%H%M%S")

    # Construct the filename using the given structure
    filename = f"report_program_{program_id}_{date_time_str}.csv"

    return filename
