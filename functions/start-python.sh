#!/bin/sh

# # Check if the environment file exists
# if [ ! -f "start_python.env" ]; then
#   echo "Environment file not found. Creating it from the template."
#   cp start-python.env.example start-python.env
# fi

# # Load the environment variables
# export $(grep -v '^#' start-python.env | xargs)

# Run the python dev server
python dev.py