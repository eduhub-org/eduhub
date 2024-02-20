import logging
import os
import io

from typing import Optional
from datetime import timedelta

from google import auth
from google.auth.transport import requests
from google.cloud.storage import Client




class StorageClient:
    BUCKET_NAME = os.getenv(
        "BUCKET_NAME",  # Bucket name for cloud storage
        "emulated-bucket",  # Default value for testing outside the container
    )
    BUCKET_DIRECTORY = os.getenv(
        "LOCAL_BUCKET_DIRECTORY",  # Base directory for local storage
        "",  # Default value for testing outside the container
    )
    STORAGE_PORT = os.getenv(
        "LOCAL_STORAGE_PORT",  # Base directory for local storage
        "4001",  # Default value for testing outside the container
    )

    def __init__(self):
        self.bucket_name = self.BUCKET_NAME
        self.env = os.environ.get("ENVIRONMENT", "development")
        if self.env == "development":
            self.storage_client = None
        else:
            self.storage_client = Client()

    def get_bucket(self):
        if self.env == "development":
            return self.bucket_name  # In local mode, just return the bucket name
        else:
            return self.storage_client.bucket(self.bucket_name)

    def list_blobs(self):
        if self.env == "development":
            path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name)
            return [
                f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))
            ]
        else:
            blobs = self.storage_client.list_blobs(self.bucket_name)
            return blobs

    def get_blob(self, blob_name):
        if self.env == "development":
            blob_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            return blob_path
        else:
            return self.storage_client.bucket(self.bucket_name).blob(blob_name)

    def get_blob_metadata(self, blob_name):
        # For local environment, we won't have any cloud-based metadata.
        # Just returning file stats as an example.
        if self.env == "development":
            file_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            if os.path.exists(file_path):
                return os.stat(file_path)
            return {}
        else:
            blob = self.storage_client.bucket(self.bucket_name).blob(blob_name)
            return blob.metadata

    def delete_blob(self, blob_name):
        if self.env == "development":
            file_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            if os.path.exists(file_path):
                os.remove(file_path)
        else:
            blob = self.storage_client.bucket(self.bucket_name).blob(blob_name)
            blob.delete()

    def download_file(self, blob_name, file_path):
        if self.env == "development":
            src_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            os.replace(src_path, file_path)
        else:
            blob = self.storage_client.bucket(self.bucket_name).blob(blob_name)
            blob.download_to_filename(file_path)

    def upload_file(self, path, blob_name, buffer, content_type):
        if self.env == "development":
            local_container_path = os.path.join(
                "/home/node/www/", self.bucket_name, path, blob_name
            )
            os.makedirs(os.path.dirname(local_container_path), exist_ok=True)
            with open(local_container_path, "wb") as f:
                f.write(buffer.getvalue())
            return f"http://localhost:{self.STORAGE_PORT}/{self.bucket_name}/{path}/{blob_name}"
        else:
            full_blob_path = os.path.join(path, blob_name) if path else blob_name
            blob = self.storage_client.bucket(self.bucket_name).blob(full_blob_path)
            blob.upload_from_file(buffer, content_type=content_type)
            return self.make_signed_download_url(blob=blob, exp=timedelta(minutes=15))

    def make_signed_upload_url(
        self,
        bucket: str,
        blob: str,
        exp: Optional[timedelta] = None,
        content_type="application/octet-stream",
        min_size=1,
        max_size=int(1e6),
    ):
        """
        Compute a GCS signed upload URL without needing a private key file.
        Can only be called when a service account is used as the application
        default credentials, and when that service account has the proper IAM
        roles, like `roles/storage.objectCreator` for the bucket, and
        `roles/iam.serviceAccountTokenCreator`.
        Source: https://stackoverflow.com/a/64245028
        See also: https://medium.com/@evanpeterson17/how-to-generate-signed-urls-using-python-in-google-cloud-run-835ddad5366

        Parameters
        ----------
        bucket : str
            Name of the GCS bucket the signed URL will reference.
        blob : str
            Name of the GCS blob (in `bucket`) the signed URL will reference.
        exp : timedelta, optional
            Time from now when the signed url will expire.
        content_type : str, optional
            The required mime type of the data that is uploaded to the generated
            signed url.
        min_size : int, optional
            The minimum size the uploaded file can be, in bytes (inclusive).
            If the file is smaller than this, GCS will return a 400 code on upload.
        max_size : int, optional
            The maximum size the uploaded file can be, in bytes (inclusive).
            If the file is larger than this, GCS will return a 400 code on upload.
        """
        if exp is None:
            exp = timedelta(hours=1)
        credentials, project_id = auth.default()
        if credentials.token is None:
            # Perform a refresh request to populate the access token of the
            # current credentials.
            credentials.refresh(requests.Request())
        client = Client()
        bucket = client.get_bucket(bucket)
        blob = bucket.blob(blob)

        return blob.generate_signed_url(
            version="v4",
            expiration=exp,
            service_account_email=credentials.service_account_email,
            access_token=credentials.token,
            method="PUT",
            content_type=content_type,
            headers={
                "X-Goog-Content-Length-Range": f"{min_size},{max_size}",
            },
        )

    def make_signed_download_url(
        self,
        blob,
        exp: Optional[timedelta] = None,
    ):
        """
        Compute a GCS signed upload URL without needing a private key file.
        Can only be called when a service account is used as the application
        default credentials, and when that service account has the proper IAM
        roles, like `roles/storage.objectCreator` for the bucket, and
        `roles/iam.serviceAccountTokenCreator`.

        Parameters
        ----------
        blob
            Object including the uploaded blob
        exp : timedelta, optional
            Time from now when the signed url will expire.
        """
        if exp is None:
            exp = timedelta(hours=1)
        credentials, project_id = auth.default()
        if credentials.token is None:
            # Perform a refresh request to populate the access token of the
            # current credentials.
            credentials.refresh(requests.Request())

        return blob.generate_signed_url(
            version="v4",
            expiration=exp,
            service_account_email=credentials.service_account_email,
            access_token=credentials.token,
            method="GET",
            headers={},
        )

    def create_csv_from_dataframe(self, dataframe, **csv_args):
        # Set default values for separator, decimal, and encoding. If provided in csv_args, they will overwrite these.
        default_csv_args = {"sep": ";", "decimal": ",", "encoding": "utf-8-sig"}
        default_csv_args.update(csv_args)
        buffer = io.BytesIO()
        dataframe.to_csv(buffer, index=False, **default_csv_args)
        buffer.seek(0)
        return buffer

    def upload_csv_from_dataframe(self, path, blob_name, dataframe, **csv_args):
        buffer = self.create_csv_from_dataframe(dataframe, **csv_args)
        return self.upload_file(path, blob_name, buffer, "text/csv")
