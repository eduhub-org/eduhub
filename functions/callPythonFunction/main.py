import hmac
import logging
import os
from flask import jsonify
from typing import Dict, Callable

# Import functions explicitly
from pythonFunctions.add_confirmed_user_to_mm import add_confirmed_user_to_mm
from pythonFunctions.anonymize_guest_data import anonymize_guest_data
from pythonFunctions.check_attendance import check_attendance
from pythonFunctions.check_course_continuation import check_course_continuation
from pythonFunctions.create_certificates import create_certificates
from pythonFunctions.create_instructor_certificates import create_instructor_certificates
from pythonFunctions.expire_invitations import expire_invitations
from pythonFunctions.generate_instructor_invoice import generate_instructor_invoice
from pythonFunctions.expire_job_postings import expire_job_postings
from pythonFunctions.load_participation_data import load_participation_data
from pythonFunctions.send_job_alerts import send_job_alerts
from pythonFunctions.send_project_deadline_reminders import send_project_deadline_reminders
from pythonFunctions.sync_mail_delivery_status import sync_mail_delivery_status
from pythonFunctions.update_enrollment_locations import update_enrollment_locations

# Initialize the logger level
if os.environ.get("ENVIRONMENT") == "production":
    logging.basicConfig(level=logging.INFO)
else:
    logging.basicConfig(level=logging.DEBUG)

# Create an explicit function map
PYTHON_FUNCTIONS: Dict[str, Callable] = {
    "add_confirmed_user_to_mm": add_confirmed_user_to_mm,
    "anonymize_guest_data": anonymize_guest_data,
    "check_attendance": check_attendance,
    "check_course_continuation": check_course_continuation,
    "create_certificates": create_certificates,
    "create_instructor_certificates": create_instructor_certificates,
    "expire_invitations": expire_invitations,
    "expire_job_postings": expire_job_postings,
    "generate_instructor_invoice": generate_instructor_invoice,
    "load_participation_data": load_participation_data,
    "send_job_alerts": send_job_alerts,
    "send_project_deadline_reminders": send_project_deadline_reminders,
    "sync_mail_delivery_status": sync_mail_delivery_status,
    "update_enrollment_locations": update_enrollment_locations,
}

def call_python_function(request):
    """Call the Python function indicated in the request and return the result.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        dict: A standardized response containing success status and result/error
    """
    # Bound before the try so the except block can always log it.
    function_name = None
    try:
        arguments = request.get_json()
        logging.info("########## Calling Python Function ##########")
        logging.debug(f"Request: {arguments}")

        expected_secret = os.environ.get("HASURA_CLOUD_FUNCTION_SECRET")
        if not expected_secret or not expected_secret.strip():
            logging.error("HASURA_CLOUD_FUNCTION_SECRET is not configured")
            return jsonify({
                "success": False,
                "error": "Server secret is not configured.",
                "messageKey": "SERVER_MISCONFIGURED"
            }), 500

        hasura_secret = request.headers.get("Hasura-Secret")

        if hasura_secret is None:
            logging.error("No Hasura secret provided")
            return jsonify({
                "success": False,
                "error": "Missing Hasura secret",
                "messageKey": "MISSING_SECRET"
            }), 401

        # Bytes, so a non-ASCII header cannot make compare_digest raise.
        if not hmac.compare_digest(hasura_secret.encode("utf-8"), expected_secret.encode("utf-8")):
            logging.error("Invalid Hasura secret provided")
            return jsonify({
                "success": False,
                "error": "Invalid secret",
                "messageKey": "INVALID_SECRET"
            }), 401

        function_name = request.headers.get("Function-Name")
        if function_name is None and arguments.get('action', {}).get('name'):
            function_name = arguments['action']['name']
            logging.info(f"Using action name as function name: {function_name}")
        else:
            logging.info(f"Function name: {function_name}")

        if function_name not in PYTHON_FUNCTIONS:
            logging.error(f"Function not found: {function_name}")
            return jsonify({
                "success": False,
                "error": "Function not found",
                "messageKey": "FUNCTION_NOT_FOUND"
            }), 404

        result = PYTHON_FUNCTIONS[function_name](arguments)
        
        # If result is already a dict with success/error info, return it directly.
        # 503 makes Hasura retry an event or cron delivery; handlers set
        # `retryable` only for failures worth retrying (see
        # docs/SERVERLESS_FUNCTIONS.md, "Request contract").
        if isinstance(result, dict) and ("success" in result or "error" in result):
            # A cron request carries `scheduled_time` instead of `event`;
            # actions read the body, so they always get 200.
            is_trigger = isinstance(arguments, dict) and (
                "event" in arguments or "scheduled_time" in arguments
            )
            status_code = 503 if is_trigger and result.get("retryable") else 200
            return jsonify(result), status_code
            
        # Otherwise, wrap the result in a success response
        return jsonify({
            "success": True,
            "result": result
        }), 200

    except Exception as error:
        logging.error(f"Error in {function_name}: {str(error)}")
        return jsonify({
            "success": False,
            "error": str(error),
            "messageKey": "INTERNAL_SERVER_ERROR",
        }), 200
