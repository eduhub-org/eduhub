#!/bin/sh

# reverse of up.sh
# include -v to get rid of db_hasura_data
# this clears basically all data from your local system and on up.sh you will have the clean slate empty eduhub again

docker-compose down -v