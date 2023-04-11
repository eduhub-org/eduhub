import logging
import os
import re
from flask import Flask, request, jsonify

# Initialize the logger level
logging.basicConfig(level=logging.INFO)


# Execution of all Python files in the folder `pythonFunctions` to make these available
# to the function `call_python_function()`
files = os.listdir('callPythonFunction/pythonFunctions')
python_files = [file for file in files if re.search(r'.py$', file)]
for file in python_files:
    exec(open('callPythonFunction/pythonFunctions/'+file).read())


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
    logging.info(f"Request: {arguments_json}")
    # Transform the "headers" list into a dictionary
    headers_dict = {header['name']: header['value']
                    if 'value' in header else header['value_from_env'] for header in arguments_json['headers']}

    # Get the value of the "secret" key from the dictionary and check if it is correct
    secret_value = headers_dict.get('secret')
    hasura_cloud_function_secret = os.getenv('HASURA_CLOUD_FUNCTION_SECRET')

    # Print the values of the secrets for debugging purposes
    logging.debug(f"Secret value from headers: {secret_value}")
    logging.debug(
        f"Secret value from environment: {hasura_cloud_function_secret}")

    if secret_value != hasura_cloud_function_secret:
        return('error: cloud function secret is not correct!')

    # Get the value of the "name" key from the dictionary (the name of the function to be called)
    name_value = headers_dict.get('name')

    # Checking if an existing function name is provided and calling function
    if globals().get(name_value) is None:
        return 'error: function with the given name not exist!'
    else:
        python_function = globals()[name_value]
        logging.info(f"Calling python function: {name_value}...")
        logging.info(f"Payload: {arguments_json['payload']['payload']}")
        return python_function(arguments_json['payload']['payload'])
