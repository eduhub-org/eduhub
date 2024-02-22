import os
import sys
# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import io
import unittest
from unittest.mock import patch, MagicMock
from create_certificates import CertificateCreator

class TestPDFGeneration(unittest.TestCase):
    def setUp(self):
        # Setup code here (if any)
        self.arguments = {
            "input": {
                "certificateType": "achievement",
                "userIds": [1, 2, 3],
                "courseId": 101,
            }
        }
        self.certificate_creator = CertificateCreator(self.arguments)

    @patch("requests.get")
    @patch("google.cloud.storage.Client")
    def test_generate_and_save_certificate_to_gcs(self, mock_storage_client, mock_requests_get):
        # Mock the image fetching
        mock_response = MagicMock()
        mock_response.content = b'Fake Image Content'
        mock_requests_get.return_value = mock_response

        # Mock storage client and blob
        mock_bucket = MagicMock()
        mock_blob = MagicMock()
        mock_storage_client().bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob

        # Assuming your method needs a bucket name, template image URL, and template text
        bucket_name = "test-bucket"
        template_image_url = "http://example.com/image.png"
        template_text = "<html><body>{{html_content}}</body></html>"
        mock_enrollment = {
            "id": 123,
            "User": {
                "id": 1,
                "firstName": "John",
                "lastName": "Doe"
            },
            "Course": {
                "id": 101,
                "title": "Test Course",
                "Program": {
                    "title": "Test Program",
                    "achievementCertificateTemplateURL": "http://example.com/achievement_template.png",
                    "achievementCertificateTemplateTextId": "achievement_text_id",
                    "attendanceCertificateTemplateURL": "http://example.com/attendance_template.png",
                    "attendanceCertifiateTemplateTextId": "attendance_text_id"
                }
            }
        }

        # Call the method under test
        pdf_url = self.certificate_creator.generate_and_save_certificate_to_gcs(mock_enrollment, template_image_url, template_text, bucket_name)

        # Assertions
        mock_requests_get.assert_called_with(template_image_url)
        mock_storage_client().bucket.assert_called_with(bucket_name)
        mock_bucket.blob.assert_called()
        mock_blob.upload_from_file.assert_called()
        
        # Since the actual PDF content is generated and uploaded, we focus on asserting the call was made
        # You might want to check the content-type or any other property set during the upload
        self.assertTrue(mock_blob.upload_from_file.called, "PDF was not uploaded.")

        # If the public URL is generated correctly
        self.assertIsNotNone(pdf_url, "The generated PDF URL should not be None")

if __name__ == "__main__":
    unittest.main()
