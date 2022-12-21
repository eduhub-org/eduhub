#!/bin/bash

# How to call this:
# sudo bash regenerate-apollo.sh $USER
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

# Run the codegen inside the container(s)
# old edu
docker exec -ti edu-hub_frontend_1 /usr/local/bin/yarn apollo:codegen
# nx edu
docker exec -ti edu-hub_edu-nx_1 npx nx run edu-hub:apollo
# nx rent-a-scientist
#docker exec -ti edu-hub_ras-nx_1 npx nx run edu-hub:apollo

# Now the files are created as root, so need to make sure all the files in frontend are owned by the correct user again
chown $1:$1 -R .