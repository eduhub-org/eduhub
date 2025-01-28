import logging
import os
from flask import request, jsonify
from typing import Dict, Any, Callable
import traceback

# Import functions explicitly
from pythonFunctions.add_confirmed_user_to_mm import add_confirmed_user_to_mm
from pythonFunctions.check_attendance import check_attendance
from pythonFunctions.create_certificates import create_certificates
from pythonFunctions.load_participation_data import load_participation_data
from pythonFunctions.provide_moochub_data import provide_moochub_data

# Initialize the logger level
if os.environ.get("ENVIRONMENT") == "production":
    logging.basicConfig(level=logging.INFO)
else:
    logging.basicConfig(level=logging.DEBUG)

# Create an explicit function map
PYTHON_FUNCTIONS: Dict[str, Callable] = {
    "add_confirmed_user_to_mm": add_confirmed_user_to_mm,
    "check_attendance": check_attendance,
    "create_certificates": create_certificates,
    "load_participation_data": load_participation_data,
    "provide_moochub_data": provide_moochub_data,
}

def format_response(result: dict) -> dict:
    """
    Standardizes the response format.
    
    Args:
        result: The function result
        
    Returns:
        dict: Standardized response with required fields
    """
    # If result already has success and messageKey, return it directly
    if isinstance(result, dict) and 'success' in result and 'messageKey' in result:
        return result
        
    # Add standard fields for normal responses
    return {
        "success": True,
        "messageKey": "OPERATION_SUCCESS",
        "result": result
    }

def call_python_function(request):
    """Call the Python function indicated in the request and return the result.
    Args:
        request (flask.Request): HTTP request object.
    Returns:
        dict: A standardized response containing success status and result/error
    """
    try:
        arguments = request.get_json()
        logging.info("########## Calling Python Function ##########")
        logging.debug(f"Request: {arguments}")

        function_name = request.headers.get("Function-Name")
        hasura_secret = request.headers.get("Hasura-Secret")
        
        if not hasura_secret == os.environ.get("HASURA_CLOUD_FUNCTION_SECRET"):
            return jsonify({
                "success": False,
                "error": "Invalid secret provided",
                "messageKey": "INVALID_SECRET"
            }), 200

        if function_name not in PYTHON_FUNCTIONS:
            return jsonify({
                "success": False,
                "error": "Function not found",
                "messageKey": "FUNCTION_NOT_FOUND"
            }), 200

        result = PYTHON_FUNCTIONS[function_name](arguments)
        
        return format_response(result)

    except Exception as error:
        logging.error(f"Error in {function_name}: {str(error)}")
        return jsonify({
            "success": False,
            "error": str(error),
            "messageKey": "INTERNAL_SERVER_ERROR",
            "details": traceback.format_exc()
        }), 200
