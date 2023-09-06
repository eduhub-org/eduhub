import datetime
import logging
import os
from google.cloud import storage
from grpc import compute_engine_channel_credentials


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
            self.storage_client = storage.Client()

    def get_bucket(self):
        if self.env == "development":
            return self.bucket_name  # In local mode, just return the bucket name
        else:
            return self.storage_client.bucket(self.bucket_name)

    def get_blob(self, blob_name):
        if self.env == "development":
            blob_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            return blob_path
        else:
            return self.storage_client.bucket(self.bucket_name).blob(blob_name)

    def upload_file(self, blob_name, file_path):
        if self.env == "development":
            dest_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            os.replace(file_path, dest_path)
        else:
            blob = self.storage_client.bucket(self.bucket_name).blob(blob_name)
            blob.upload_from_filename(file_path)

    def download_file(self, blob_name, file_path):
        if self.env == "development":
            src_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            os.replace(src_path, file_path)
        else:
            blob = self.storage_client.bucket(self.bucket_name).blob(blob_name)
            blob.download_to_filename(file_path)

    def list_blobs(self):
        if self.env == "development":
            path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name)
            return [
                f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))
            ]
        else:
            blobs = self.storage_client.list_blobs(self.bucket_name)
            return blobs

    def delete_blob(self, blob_name):
        if self.env == "development":
            file_path = os.path.join(self.BUCKET_DIRECTORY, self.bucket_name, blob_name)
            if os.path.exists(file_path):
                os.remove(file_path)
        else:
            blob = self.storage_client.bucket(self.bucket_name).blob(blob_name)
            blob.delete()

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

    def upload_csv_from_dataframe(self, path, blob_name, dataframe, **csv_args):
        """
        Uploads a pandas DataFrame as a CSV file to the specified bucket, path, and blob_name.
        Returns a link to the uploaded blob.

        Args:
            bucket_name (str): The bucket's name where the CSV will be stored.
            path (str): The path inside the bucket.
            blob_name (str): The desired name for the CSV file.
            dataframe (pd.DataFrame): The pandas DataFrame to be uploaded.
            csv_args: Additional arguments to pass to pandas' to_csv function.
        """

        full_blob_path = os.path.join(path, blob_name) if path else blob_name

        # Set default values for separator and decimal. If provided in csv_args, they will overwrite these.
        default_csv_args = {"sep": ";", "decimal": ","}
        default_csv_args.update(
            csv_args
        )  # merge default args with any provided csv_args

        if self.env == "development":
            local_container_path = os.path.join(
                "/home/node/www/", self.bucket_name, full_blob_path
            )

            logging.debug(f"local container path:  {local_container_path}")
            logging.debug(f"blob path:  {full_blob_path}")
            os.makedirs(os.path.dirname(local_container_path), exist_ok=True)
            dataframe.to_csv(local_container_path, **default_csv_args)
            return f"http://localhost:{self.STORAGE_PORT}/{self.bucket_name}/{full_blob_path}"
        else:
            # If it's not development, use GCS
            blob = self.storage_client.bucket(self.bucket_name).blob(full_blob_path)

            # Convert dataframe to CSV string and upload
            csv_string = dataframe.to_csv(index=False, **default_csv_args)
            blob.upload_from_string(csv_string)

            # Generate signed URL with access token
            credentials = compute_engine_channel_credentials.Credentials()
            url = blob.generate_signed_url(
                version="v4",
                expiration=datetime.timedelta(minutes=15),
                credentials=credentials,
            )

            return url
