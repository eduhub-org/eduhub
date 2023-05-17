import logging
import os
import re
from flask import Flask, request, jsonify

# Initialize the logger level
logging.basicConfig(level=logging.INFO)


# Execution of all Python files in the folder `pythonFunctions` to make these available
# to the function `call_python_function()`
files = os.listdir('./pythonFunctions')
python_files = [file for file in files if re.search(r'.py$', file)]
for file in python_files:
    exec(open('./pythonFunctions/'+file).read())


# Generic function to call the requested Python function
def call_python_function(request):
    """Call the Python function indicated in the request and return the result.
    Args:
        request (flask.Request): HTTP request object.
        It must contain a field "name", with the name of a Python function given otherwise the request will not be handled.
    Returns:
        the report for the participants from the Zoom API,
        containing name and information about the participants.
    """

    arguments_json = request.get_json()
    logging.debug(f"Request: {arguments_json}")

    # Access the headers using request.headers
    headers = request.headers

    # Get the value of the "secret" key from the headers and check if it is correct
    secret_value = headers.get('secret')
    hasura_cloud_function_secret = os.getenv('HASURA_CLOUD_FUNCTION_SECRET')

    # Print the values of the secrets for debugging purposes
    logging.debug(f"Secret value from headers: {secret_value}")
    logging.debug(
        f"Secret value from environment: {hasura_cloud_function_secret}")

    if secret_value != hasura_cloud_function_secret:
        return('error: cloud function secret is not correct!')

    # Get the value of the "name" key from the headers (the name of the function to be called)
    name_value = headers.get('name')

    # Checking if an existing function name is provided and calling function
    if globals().get(name_value) is None:
        return 'error: function with the given name not exist!'
    else:
        python_function = globals()[name_value]
        logging.info(f"Calling python function: {name_value}...")
        logging.debug(f"Payload: {arguments_json['payload']}")
        return python_function(arguments_json['payload'])


# Test request for the server
# curl -X POST http://localhost:42025/ \
# -H 'Content-Type: application/json' \
# -H 'name: checkAttendance' \
# -H "secret: test1234" \
# -H "User-Agent: hasura-graphql-engine/v2.19.0" \
# -d '{
#   "comment": "regularly checks zoom and questionaire attendance",
#   "id": "d4212a35-0e98-495b-a19d-7cd80ea66223",
#   "name": "check_attendance",
#   "payload": {},
#   "scheduled_time": "2023-04-06T10:00:00Z"
# }'
