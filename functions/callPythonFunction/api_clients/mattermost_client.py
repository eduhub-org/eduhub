import os


class MattermostClient:
    def __init__(self):
        self.url = os.getenv('MATTERMOST_URL')
