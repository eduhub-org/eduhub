#!/bin/bash

# Use gcsfuse to mount network share

echo "Mounting GCS Fuse."
gcsfuse --debug_gcs --debug_fuse edu-hub-production-keycloak-seeds /mnt/bucket
echo "Mounting completed."

/opt/keycloak/bin/kc.sh import --dir "/mnt/bucket"
