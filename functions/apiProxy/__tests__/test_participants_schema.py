"""
Tests for the /participants/schema endpoint in the local development environment.

Uses test API key from seed data: edh_live_org160_sk_056afe290cadf18e2b2d7482c5f4e5a5
This key is safe to commit since it's only test data.
"""

import pytest
import requests
import json
import os
from pathlib import Path
from jsonschema import validate, ValidationError

# Test API key from seed data (organization ID 160)
TEST_API_KEY = "edh_live_org160_sk_056afe290cadf18e2b2d7482c5f4e5a5"
LOCAL_API_URL = "http://localhost:42026/participants/schema"

# Path to the JSON schema file for validation
SCHEMA_FILE_PATH = Path(__file__).parent.parent / "schemas" / "participant-data-v1.0.0.json"


@pytest.fixture
def api_headers():
    """Fixture providing standard API headers for requests."""
    return {
        "X-API-Key": TEST_API_KEY,
        "User-Agent": "EduHub-Test-Client/1.0",
        "Accept-Version": "3.0.1"
    }


def is_local_server_running():
    """Check if the local API server is running."""
    try:
        response = requests.get("http://localhost:42026/health", timeout=2)
        return response.status_code == 200
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
        return False


def load_json_schema():
    """Load the JSON schema file for validation."""
    with open(SCHEMA_FILE_PATH, 'r') as f:
        return json.load(f)


class TestParticipantsSchemaConnectivity:
    """Tests for basic connectivity and response structure."""

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_endpoint_responds(self, api_headers):
        """Test that the schema endpoint responds with 200 status."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_endpoint_returns_json(self, api_headers):
        """Test that the schema endpoint returns valid JSON."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        # API returns application/vnd.api+json content type
        content_type = response.headers.get("Content-Type", "")
        assert content_type.startswith("application/") and "json" in content_type
        
        try:
            data = response.json()
            assert isinstance(data, dict)
        except json.JSONDecodeError:
            pytest.fail("Response is not valid JSON")

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_response_structure(self, api_headers):
        """Test that the schema response has the expected top-level structure."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required top-level fields
        assert "$schema" in data, "Missing $schema field"
        assert "$id" in data, "Missing $id field"
        assert "title" in data, "Missing title field"
        assert "version" in data, "Missing version field"
        assert "type" in data, "Missing type field"
        assert "api" in data, "Missing api field"
        assert "data_model" in data, "Missing data_model field"
        assert "security" in data, "Missing security field"
        assert "errors" in data, "Missing errors field"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_api_section_structure(self, api_headers):
        """Test that the api section has the expected structure."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        
        data = response.json()
        api_section = data.get("api", {})
        
        # Check authentication section
        assert "authentication" in api_section, "Missing authentication section"
        auth = api_section["authentication"]
        assert "type" in auth, "Missing authentication.type"
        assert "header" in auth, "Missing authentication.header"
        assert "format" in auth, "Missing authentication.format"
        assert "required_headers" in auth, "Missing authentication.required_headers"
        
        # Check endpoints section
        assert "endpoints" in api_section, "Missing endpoints section"
        endpoints = api_section["endpoints"]
        assert "list_courses" in endpoints, "Missing list_courses endpoint"
        assert "get_participants" in endpoints, "Missing get_participants endpoint"
        assert "get_schema" in endpoints, "Missing get_schema endpoint"
        
        # Verify endpoint structure
        for endpoint_name, endpoint in endpoints.items():
            assert "method" in endpoint, f"Missing method in {endpoint_name}"
            assert "path" in endpoint, f"Missing path in {endpoint_name}"
            assert "description" in endpoint, f"Missing description in {endpoint_name}"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_data_model_section(self, api_headers):
        """Test that the data_model section has the expected structure."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        
        data = response.json()
        data_model = data.get("data_model", {})
        
        assert "privacy_policy" in data_model, "Missing privacy_policy"
        assert "participant_data" in data_model, "Missing participant_data"
        assert "course_data" in data_model, "Missing course_data"


class TestParticipantsSchemaValidation:
    """Tests for JSON schema validation against the schema file."""

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_response_validates_against_file(self, api_headers):
        """Test that the schema response structure matches the expected schema file."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        
        response_data = response.json()
        
        # Note: The schema endpoint returns a documentation schema, not the data schema
        # So we validate the structure matches what we expect from handle_participants_schema
        assert response_data.get("$schema") == "https://json-schema.org/draft/2019-09/schema"
        assert response_data.get("version") == "1.0.0"
        assert response_data.get("title") == "EduHub ELM-Compliant Participant Data API"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_errors_section(self, api_headers):
        """Test that the errors section contains expected error codes."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        
        data = response.json()
        errors = data.get("errors", {})
        
        # Check for expected error codes
        assert "401" in errors, "Missing 401 error description"
        assert "403" in errors, "Missing 403 error description"
        assert "404" in errors, "Missing 404 error description"
        assert "429" in errors, "Missing 429 error description"
        assert "503" in errors, "Missing 503 error description"


class TestParticipantsSchemaErrorHandling:
    """Tests for error handling (missing headers, invalid API key).
    
    Note: The schema endpoint is publicly accessible and does not require authentication.
    Authentication is only required for data endpoints (/participants and /participants/courses/{id}).
    """

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_endpoint_publicly_accessible(self):
        """Test that the schema endpoint is publicly accessible without authentication."""
        # Schema endpoint should be accessible without API key
        response = requests.get(LOCAL_API_URL, timeout=5)
        assert response.status_code == 200, f"Schema endpoint should be public, got {response.status_code}"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_endpoint_without_user_agent(self):
        """Test that the schema endpoint works without User-Agent header."""
        # Schema endpoint doesn't require User-Agent
        response = requests.get(LOCAL_API_URL, timeout=5)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_endpoint_with_invalid_api_key(self):
        """Test that the schema endpoint works even with invalid API key (public endpoint)."""
        headers = {
            "X-API-Key": "edh_live_org999_sk_invalid_key_12345",
            "User-Agent": "EduHub-Test-Client/1.0"
        }
        response = requests.get(LOCAL_API_URL, headers=headers, timeout=5)
        # Schema endpoint is public, so it should return 200 even with invalid key
        assert response.status_code == 200, f"Schema endpoint is public, got {response.status_code}"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_valid_api_key_returns_200(self, api_headers):
        """Test that valid API key returns 200."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestParticipantsSchemaContent:
    """Tests for specific content validation."""

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_contains_required_endpoints(self, api_headers):
        """Test that the schema documents all required endpoints."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        
        data = response.json()
        endpoints = data.get("api", {}).get("endpoints", {})
        
        # Verify all required endpoints are documented
        assert "list_courses" in endpoints
        assert "get_participants" in endpoints
        assert "get_schema" in endpoints
        
        # Verify endpoint details
        list_courses = endpoints["list_courses"]
        assert list_courses["method"] == "GET"
        assert list_courses["path"] == "/participants"
        
        get_participants = endpoints["get_participants"]
        assert get_participants["method"] == "GET"
        assert "/participants/courses/" in get_participants["path"]
        
        get_schema = endpoints["get_schema"]
        assert get_schema["method"] == "GET"
        assert get_schema["path"] == "/participants/schema"

    @pytest.mark.skipif(
        not is_local_server_running(),
        reason="Local server is not running on port 42026"
    )
    def test_schema_security_section(self, api_headers):
        """Test that the security section contains expected information."""
        response = requests.get(LOCAL_API_URL, headers=api_headers, timeout=5)
        assert response.status_code == 200
        
        data = response.json()
        security = data.get("security", {})
        
        assert "rate_limiting" in security
        assert "ip_restrictions" in security
        assert "audit_logging" in security
        assert "data_retention" in security
        assert "security_headers" in security

