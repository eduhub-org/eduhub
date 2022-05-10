#!/bin/bash

# Use gcsfuse to mount network share

echo "Mounting GCS Fuse."
gcsfuse -o rw,allow_other -file-mode=777 -dir-mode=777 --debug_gcs --debug_fuse --debug_http --debug_fs --debug_mutex --implicit-dirs edu-hub-production-keycloak-seeds /mnt/bucket
echo "Mounting completed."

/opt/keycloak/bin/kc.sh import --dir "/mnt/bucket"
