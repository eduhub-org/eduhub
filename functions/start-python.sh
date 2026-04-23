#!/bin/sh
# Used by docker-compose python_functions only (local dev). Production uses Terraform/Secret Manager.
exec python dev.py
