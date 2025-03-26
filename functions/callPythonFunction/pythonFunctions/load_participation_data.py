import logging
from datetime import datetime

# os.chdir("/home/steffen/00_code/eduhub/functions/callPythonFunction/")
from api_clients import EduHubClient, StorageClient


def load_participation_data(arguments):
    """Function to load participation data and generate a CSV file with attendance information.
    
    Args:
        hasura_secret (str): Secret for authentication with Hasura
        arguments (dict): Contains input parameters, specifically:
            - programId (int): ID of the program to generate data for
            
    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - link (str, optional): URL to download the generated CSV
            - error (str, optional): Error message if operation failed
    """
    logging.info("########## Load Participation Data Function ##########")
    logging.debug(f"arguments: {arguments}")

    try:
        # Get the parameters from the payload
        program_id = arguments["input"]["programId"]
        logging.info(f"Loading participation data for program {program_id}")

        # Instantiate the EduHubClient
        eduhub_client = EduHubClient()
        logging.debug(f"eduhub_client.url: {eduhub_client.url}")

        # Get the program details
        participant_data = eduhub_client.get_participants_from_program(program_id)
        logging.debug("CSV with participation data for program %s retrieved", program_id)

        # Instantiate the StorageClient
        storage_client = StorageClient()
        logging.debug(f"storage_client.bucket_name: {storage_client.bucket_name}")

        # Upload the CSV to Google Cloud Storage
        url = storage_client.upload_csv_from_dataframe(
            "temp", 
            generate_filename(program_id), 
            participant_data
        )

        logging.info(
            "CSV with participation data for program %s saved under %s",
            program_id,
            url,
        )
        
        return {
            "success": True,
            "link": url,
            "messageKey": "SUCCESS"
        }

    except Exception as e:
        logging.error(f"Error loading participation data: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "messageKey": "FAILURE"
        }


#############################################################################################
# Helper functions


def generate_filename(program_id):
    # Format the current date and time to a string (e.g., "220823_123456" for August 23, 2022, at 12:34:56 PM)
    date_time_str = datetime.now().strftime("%y%m%d_%H%M%S")

    # Construct the filename using the given structure
    filename = f"report_program_{program_id}_{date_time_str}.csv"

    return filename
