import logging
import os
import re


# Execution of all Python files in the folder `pythonFunctions` to make these available
# to the function `call_python_function()`
files = os.listdir('pythonFunctions')
python_files = [file for file in files if re.search(r'.py$', file)]
for file in python_files:
    exec(open('pythonFunctions/'+file).read())


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
    logging.info(f"json request: {arguments_json}")

    if arguments_json and 'name' in arguments_json:
        if globals().get(arguments_json['name']) is None:
            return 'Error: Provided function name does not exist!'
        else:
            python_function = globals()[arguments_json['name']]
            #del arguments_json['name']
            return python_function(arguments_json)
    else:
        return 'Error: No function name provided!'
