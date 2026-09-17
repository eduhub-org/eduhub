import logging

from api_clients import EduHubClient, MattermostClient


def add_confirmed_user_to_mm(payload):
    """Adds a user to the appropriate Mattermost channel when their status changes to CONFIRMED.
    
    Args:
        payload (dict): Contains the database event data with:
            - event.data.new.status: New status of the user
            - event.data.new.userId: User ID
            - event.data.new.courseId: Course ID
            
    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - action (str): Type of action taken ('skipped' or 'added')
            - reason (str, optional): Reason for skipping
            - userId (str, optional): Mattermost user ID if added
            - teamId (str, optional): Mattermost team ID if added
            - channelId (str, optional): Mattermost channel ID if added
            - email (str): User's email address
            - error (str, optional): Error message if operation failed
            - messageKey (str): Translation key for the message
    """
    logging.info("########## Add Confirmed User to Mattermost Function ##########")
    logging.debug(f"Payload: {payload}")

    try:
        if is_test_enrollment(payload):
            # A preview enrollment is an instructor looking at their own course,
            # not a participation - they must not be pulled into the course chat.
            logging.info("Preview enrollment, no action needed")
            return {
                "success": True,
                "action": "skipped",
                "reason": "Preview enrollment",
                "messageKey": "ENROLLMENT_IS_TEST"
            }

        if not is_new_status_confirmed(payload):
            logging.info("User status is not CONFIRMED, no action needed")
            return {
                "success": True,
                "action": "skipped",
                "reason": "User status is not CONFIRMED",
                "messageKey": "USER_STATUS_NOT_CONFIRMED"
            }

        user_id = extract_user_id(payload)
        course_id = extract_course_id(payload)

        if not user_id or not course_id:
            return {
                "success": False,
                "error": "Missing user_id or course_id in payload",
                "messageKey": "MISSING_REQUIRED_FIELDS"
            }

        eduhub_client = EduHubClient()
        mattermost_client = MattermostClient()

        # Get necessary information
        user_details = eduhub_client.get_user_details_from_id(user_id)
        chatlink = eduhub_client.get_channellinks_from_confirmed_users(course_id)
        logging.info(f"The chatlink is: {chatlink}")
        
        team_id = mattermost_client.get_team_id("opencampus")
        user_email = extract_email(user_details)

        if not mattermost_client.check_user_by_email(user_email):
            logging.info("No Mattermost user with this email exists yet")
            return {
                "success": True,
                "action": "skipped",
                "reason": "User not registered in Mattermost",
                "email": user_email,
                "messageKey": "USER_NOT_IN_MATTERMOST"
            }

        # Add user to team and channel
        mm_user_id = mattermost_client.get_user_id(user_email)
        mattermost_client.add_user_to_team(mm_user_id, team_id)
        channel_id = mattermost_client.get_channel_id(team_id, chatlink)
        mattermost_client.add_user_to_channel(mm_user_id, channel_id)

        return {
            "success": True,
            "action": "added",
            "userId": mm_user_id,
            "teamId": team_id,
            "channelId": channel_id,
            "email": user_email,
            "messageKey": "USER_ADDED_TO_MATTERMOST"
        }

    except Exception as e:
        logging.error(f"Error adding confirmed user to Mattermost: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "messageKey": "MATTERMOST_ADD_USER_FAILED"
        }


def is_test_enrollment(payload):
    """Check whether the enrollment is a preview enrollment (CourseEnrollment.isTest).

    Args:
        payload (dict): The event payload from Hasura

    Returns:
        bool: True when the row is a preview enrollment
    """
    try:
        return bool(payload["event"]["data"]["new"]["isTest"])
    except KeyError:
        logging.info("isTest key not found in payload")
        return False


def is_new_status_confirmed(payload):
    """Check if the new status in the payload is CONFIRMED.
    
    Args:
        payload (dict): The event payload from Hasura
        
    Returns:
        bool: True if status is CONFIRMED, False otherwise
    """
    try:
        status = payload["event"]["data"]["new"]["status"]
        return status == "CONFIRMED"
    except KeyError:
        logging.info("Status key not found in payload")
        return False

def extract_user_id(payload):
    """Extract the user ID from the payload.
    
    Args:
        payload (dict): The event payload from Hasura
        
    Returns:
        int: User ID if found, None otherwise
    """
    try:
        return payload["event"]["data"]["new"]["userId"]
    except KeyError:
        logging.error("User ID not found in payload")
        return None

def extract_course_id(payload):
    """Extract the course ID from the payload.
    
    Args:
        payload (dict): The event payload from Hasura
        
    Returns:
        int: Course ID if found, None otherwise
    """
    try:
        return payload["event"]["data"]["new"]["courseId"]
    except KeyError:
        logging.error("Course ID not found in payload")
        return None

def extract_email(user_details):
    """Extract email from user details DataFrame.
    
    Args:
        user_details (pandas.DataFrame): DataFrame containing user information
        
    Returns:
        str: User's email address
    """
    return user_details["email"].iloc[0]

