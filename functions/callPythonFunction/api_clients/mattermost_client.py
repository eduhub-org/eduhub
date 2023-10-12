import os
import requests
import random
import string
import logging

class MattermostClient:

    def __init__(self):
        self.url = os.environ.get('MM_URL')
        self.token = os.environ.get('MM_TOKEN')

# Getter

    def get_user_id(self, email):
        # URL für die Suche nach Benutzern anhand ihrer E-Mail-Adresse
        url = f"{self.url}/api/v4/users/email/{email}"
        
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            user_id = response.json().get("id")
            return user_id
        else:
            print(f"Failed to get User ID for email '{email}'. Response code: {response.status_code}")
            return None
        
    def get_team_id(self, team_name):
        logging.info(
                "MM URL: %s", self.url
            )
        url = f"{self.url}/api/v4/teams/name/{team_name}"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        response = requests.get(url, headers=headers)
        # If there is a MM Team that has the given name
        if response.status_code == 200:
            team_id = response.json().get("id")
            return team_id
        else:
            print(
                f"Failed to get Team ID for Team '{team_name}'. Response code: {response.status_code}")
            return None

    def get_channel_id(self, team_name, channel_name):
        # MM Channels are unique within the context of a specific team
        team_id = self.get_team_id(team_name)
        if team_id is None:
            return None
        url = f"{self.url}/api/v4/teams/{team_id}/channels/name/{channel_name}"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        response = requests.get(url, headers=headers)
        #add If there is a Channel that has the given name in this specific team
        if response.status_code == 200:
            channel_id = response.json().get("id")
            return channel_id
        else:
            print(
                f"Failed to get Channel ID for Channel '{channel_name}' in Team '{team_name}'. Response code: {response.status_code}")
            return None

    # This function checks if somebody has a MM Use via their email and returns their User ID if they do, else it returns False
    def check_user_by_email(self, email):
        url = f"{self.url}/api/v4/users/email/{email}"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            user_id = response.json().get("id")
            return user_id
        else:
            return False

    def get_all_teams(self):
        url = f"{self.url}/api/v4/teams"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            teams = response.json()
            return teams
        else:
            print(
                f"Failed to retrieve teams. Response code: {response.status_code}")
            return []

    def get_all_channels_of_team(self, team_id):
        url = f"{self.url}/api/v4/teams/{team_id}/channels"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            channels = response.json()
            return channels
        else:
            print(
                f"Failed to retrieve channels of team with ID '{team_id}'. Response code: {response.status_code}")
            return []

    def get_all_members_of_team(self, team_id):
        url = f"{self.url}/api/v4/teams/{team_id}/members"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            members = response.json()
            return members
        else:
            print(
                f"Failed to retrieve members of team with ID '{team_id}'. Response code: {response.status_code}")
            return []

    def get_all_members_of_channel(self, channel_id):
        url = f"{self.url}/api/v4/channels/{channel_id}/members"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            members = response.json()
            return members
        else:
            print(
                f"Failed to retrieve members of channel with ID '{channel_id}'. Response code: {response.status_code}")
            return []

# Migrations of Users and Channels

    def create_user(self, email):
        # Generate a random password with 8 digits
        password = ''.join(random.choices(
            string.ascii_letters + string.digits, k=8))

        url = f"{self.url}/api/v4/users"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {
            "email": email,
            "password": password
        }
        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 201:
            print(
                f"Successfully created Mattermost user with email '{email}'. Password: {password}")
            return password
        else:
            print(
                f"Failed to create Mattermost user with email '{email}'. Response code: {response.status_code}")
            return None

    def add_user_to_team(self, user_id, team_id):
        url = f"{self.url}/api/v4/teams/{team_id}/members"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {
            "team_id": team_id,
            "user_id": user_id
        }
        logging.info(
                "team_id: %s", team_id
            )
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 201:
            logging.info(
                "Successfully added user with ID"
            )
            print(
                f"Successfully added user with ID '{user_id}' to team with ID '{team_id}'")
            return True
        else:
            logging.info(
                "Failed to add user with ID"
            )
            print(
                f"Failed to add user with ID '{user_id}' to team with ID '{team_id}'. Response code: {response.status_code}")
            return False

    def add_user_to_channel(self, user_id, channel_id):
        url = f"{self.url}/api/v4/channels/{channel_id}/members"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {
            "user_id": user_id
        }

        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 201:
            print(
                f"Successfully added user with ID '{user_id}' to channel with ID '{channel_id}'")
            return True
        else:
            print(
                f"Failed to add user with ID '{user_id}' to channel with ID '{channel_id}'. Response code: {response.status_code}")
            return False

    def migrate_channel_to_team(self, channel_id, team_id):
        url = f"{self.url}/api/v4/channels/{channel_id}/move"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {
            "team_id": team_id
        }

        response = requests.put(url, headers=headers, json=data)
        if response.status_code == 200:
            print(
                f"Successfully migrated channel with ID '{channel_id}' to team with ID '{team_id}'")
            return True
        else:
            print(
                f"Failed to migrate channel with ID '{channel_id}' to team with ID '{team_id}'. Response code: {response.status_code}")
            return False
