from urllib.request import urlopen
import logging
import os
import requests
from api_clients import EduHubClient, StorageClient
import io 
import requests
from io import BytesIO
from jinja2 import Environment, DictLoader

class CertificateCreator:
    pass