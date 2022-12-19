#!/bin/bash

# How to call this:
# sudo bash regenerate-apollo.sh <your_local_username>
# The containers must be up for this!

# Use this script to regenerate the apollo code 
# and fix permissions for your host system so git does not get in trouble

if [[ $(/usr/bin/id -u) -ne 0 ]]; then
    echo "You need to sudo this script to fix the rights messed up by docker"
    exit 1
fi

if [[ $# -eq 0 ]] ; then
    echo 'You need to provide the name of your normal working user as the first parameter!'
    exit 1
fi

# Run the codegen inside the container
docker exec -ti edu-hub_frontend_1 /usr/local/bin/yarn apollo:codegen

# Now the files are created as root, so need to make sure all the files in frontend are owned by the correct user again
chown $1:$1 -R .