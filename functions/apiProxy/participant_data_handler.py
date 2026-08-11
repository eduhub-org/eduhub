"""
Participant Data Handler for ELM-compliant third-party access
Provides participant enrollment and completion status for courses
"""

import os
import logging
import hashlib
import time
from datetime import datetime, UTC
import jwt
from jwt import InvalidTokenError, PyJWKClient
try:
    from api_clients.eduhub_client import EduHubClient
    from api_clients.numeric_utils import safe_float_convert
    from security_handler import security_handler, get_security_level_for_organization, validate_and_sanitize_input, SecurityLevel
    from course_id_utils import generate_course_hash_id
except ImportError:
    # Fallback for when module is loaded from different context
    import sys
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    from api_clients.eduhub_client import EduHubClient
    from api_clients.numeric_utils import safe_float_convert
    from security_handler import security_handler, get_security_level_for_organization, validate_and_sanitize_input, SecurityLevel
    from course_id_utils import generate_course_hash_id

logger = logging.getLogger(__name__)
_JWKS_CLIENT_CACHE = {}
_JWKS_CLIENT_TTL_SECONDS = 300


def _get_jwks_client(jwks_uri):
    """
    Return a cached PyJWKClient for the given URI.
    """
    current_time = time.time()
    cached = _JWKS_CLIENT_CACHE.get(jwks_uri)
    if cached and (current_time - cached["created_at"] < _JWKS_CLIENT_TTL_SECONDS):
        return cached["client"]

    try:
        client = PyJWKClient(jwks_uri, lifespan=_JWKS_CLIENT_TTL_SECONDS)
    except TypeError:
        # Compatibility fallback for PyJWT versions without `lifespan`.
        client = PyJWKClient(jwks_uri)

    _JWKS_CLIENT_CACHE[jwks_uri] = {
        "client": client,
        "created_at": current_time,
    }
    return client


def select_priority_location(course_locations):
    """
    Select the priority location from a list of course locations.
    Priority order: ONLINE > KIEL > HEIDE > (any other location)
    
    Args:
        course_locations: List of location dictionaries with 'id' and 'locationOption' keys
        
    Returns:
        Selected location dictionary or None if no locations exist
    """
    if not course_locations:
        return None
    
    # Priority order: ONLINE > KIEL > HEIDE > others
    priority_order = ['ONLINE', 'KIEL', 'HEIDE']
    
    # First, try to find locations in priority order
    for priority in priority_order:
        for location in course_locations:
            if location.get('locationOption') == priority:
                return location
    
    # If no priority location found, return the first available location
    return course_locations[0]


def resolve_course_id_from_url(course_id_param, org_courses):
    """
    Resolve course ID from URL parameter.
    Accepts both internal course IDs (integers) and hash IDs (UUIDs).
    Returns course information including internal ID, location info, and hash ID.
    
    Args:
        course_id_param: Course ID from URL (can be integer or UUID string)
        org_courses: List of courses with hashId, _internalId, selectedLocation, and locationOption fields
        
    Returns:
        Dictionary with keys: course_id, location_id, location_option, hash_id
        Returns None if course not found
    """
    # Try to parse as integer (internal ID)
    try:
        internal_id = int(course_id_param)
        # Verify it exists in org_courses and return first match with location info
        for course in org_courses:
            course_id = course.get("_internalId") or course.get("id")
            if course_id == internal_id:
                selected_location = course.get("selectedLocation")
                location_id = selected_location.get("id") if selected_location else None
                location_option = selected_location.get("locationOption") if selected_location else None
                hash_id = course.get("hashId")
                # If no hash_id, generate one (backward compatibility)
                if not hash_id and location_id:
                    hash_id = generate_course_hash_id(course_id, location_id)
                elif not hash_id:
                    hash_id = generate_course_hash_id(course_id)
                return {
                    "course_id": course_id,
                    "location_id": location_id,
                    "location_option": location_option,
                    "hash_id": hash_id
                }
        return None
    except (ValueError, TypeError):
        # Not an integer, try as hash ID (UUID)
        # Look up hash ID in org_courses
        for course in org_courses:
            if not isinstance(course, dict):
                continue
            if course.get("hashId") == course_id_param:
                course_id = course.get("_internalId") or course.get("id")
                if not course_id:
                    logging.warning(f"Course found by hash ID but missing course_id: {course_id_param}")
                    continue
                selected_location = course.get("selectedLocation")
                location_id = selected_location.get("id") if selected_location and isinstance(selected_location, dict) else None
                location_option = selected_location.get("locationOption") if selected_location and isinstance(selected_location, dict) else None
                return {
                    "course_id": course_id,
                    "location_id": location_id,
                    "location_option": location_option,
                    "hash_id": course_id_param  # Preserve the original hash ID from request
                }
        return None


def authenticate_organization_access(request):
    """
    Authenticate third-party organization access using API key or JWT
    Returns organization info and access permissions with security validation
    """
    # Get client IP for security tracking
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    if client_ip and ',' in client_ip:
        client_ip = client_ip.split(',')[0].strip()
    
    # Prepare request data for audit logging
    request_data = {
        'path': request.path,
        'query_string': request.query_string.decode('utf-8'),
        'headers': dict(request.headers),
        'method': request.method
    }
    
    # Validate request for security violations
    is_valid, violations = security_handler.validate_request(request)
    if not is_valid:
        security_handler.log_audit_event(
            'security_violation', 0, client_ip, request_data, False, 
            f"Request validation failed: {', '.join(violations)}"
        )
        raise ValueError(f"Security validation failed: {', '.join(violations)}")
    
    api_key = request.headers.get('X-API-Key')
    auth_header = request.headers.get('Authorization')
    
    try:
        if api_key and api_key.startswith('edh_'):
            # API Key authentication
            auth_result = authenticate_api_key(api_key)
            
            # Validate IP address for the organization
            ip_allowed, ip_reason = security_handler.validate_ip_address(client_ip, auth_result['organization_id'])
            if not ip_allowed:
                security_handler.log_audit_event(
                    'ip_restriction_violation', auth_result['organization_id'], client_ip, 
                    request_data, False, f"IP {client_ip} not allowed: {ip_reason}"
                )
                raise ValueError(f"IP address {client_ip} not allowed: {ip_reason}")
            
            # Log successful authentication
            security_handler.log_audit_event(
                'api_key_auth', auth_result['organization_id'], client_ip, 
                request_data, True, f"API key authentication successful. IP validation: {ip_reason}"
            )
            
            return auth_result
        elif auth_header and auth_header.startswith('Bearer '):
            # JWT authentication 
            auth_result = authenticate_jwt(auth_header[7:])
            
            # Validate IP address for the organization
            ip_allowed, ip_reason = security_handler.validate_ip_address(client_ip, auth_result['organization_id'])
            if not ip_allowed:
                security_handler.log_audit_event(
                    'ip_restriction_violation', auth_result['organization_id'], client_ip, 
                    request_data, False, f"IP {client_ip} not allowed: {ip_reason}"
                )
                raise ValueError(f"IP address {client_ip} not allowed: {ip_reason}")
            
            # Log successful authentication
            security_handler.log_audit_event(
                'jwt_auth', auth_result['organization_id'], client_ip, 
                request_data, True, f"JWT authentication successful. IP validation: {ip_reason}"
            )
            
            return auth_result
        else:
            # Log failed authentication attempt
            security_handler.log_audit_event(
                'auth_failed', 0, client_ip, request_data, False, 
                "Missing authentication credentials"
            )
            raise ValueError("Missing authentication credentials")
            
    except Exception as e:
        # Log authentication failure
        security_handler.log_audit_event(
            'auth_failed', 0, client_ip, request_data, False, str(e)
        )
        raise


def authenticate_api_key(api_key):
    """
    Validate API key against database and return organization permissions with security level
    """
    # Validate API key format
    is_valid, sanitized_key = validate_and_sanitize_input(api_key, 'api_key')
    if not is_valid:
        raise ValueError("Invalid API key format")
    
    # API key format: edh_live_org123_sk_abcdef1234567890
    if not sanitized_key.startswith('edh_live_org'):
        raise ValueError("Invalid API key format")
    
    try:
        # Extract organization ID from API key
        parts = sanitized_key.split('_')
        org_part = parts[2]  # org123
        organization_id = int(org_part.replace('org', ''))
        
        # Initialize EduHub client for database access
        eduhub_client = EduHubClient()
        
        # Query organization and validate API key hash
        query = """
        query GetOrganizationWithApiKey($orgId: Int!, $apiKeyHash: String!) {
            Organization(where: {id: {_eq: $orgId}, apiKeyHash: {_eq: $apiKeyHash}}) {
                id
                name
                type
                description
            }
        }
        """
        
        # Generate hash of the provided API key
        api_key_hash = hashlib.sha256(sanitized_key.encode()).hexdigest()
        
        variables = {
            "orgId": organization_id,
            "apiKeyHash": api_key_hash
        }
        
        result = eduhub_client.send_query(query, variables)
        
        # Check for GraphQL errors
        if not isinstance(result, dict):
            logging.error(f"GraphQL query failed: {result}")
            raise ValueError("Database connection error")
        
        if "errors" in result:
            logging.error(f"GraphQL errors: {result['errors']}")
            raise ValueError("Database query error")
        
        if "data" not in result:
            logging.error(f"GraphQL response missing data: {result}")
            raise ValueError("Database response error")
        
        organizations = result["data"]["Organization"]
        
        if not organizations:
            raise ValueError("Invalid API key or organization not found")
        
        organization = organizations[0]
        
        # Determine security level based on organization type
        security_level = get_security_level_for_organization(organization.get("type", "unknown"))
        
        # Return organization info and permissions with security level
        return {
            'organization_id': organization["id"],
            'organization_name': organization["name"],
            'organization_type': organization.get("type", "unknown"),
            'security_level': security_level,
            'access_level': 'basic',  # basic, detailed, full - can be extended based on organization type
            'can_access_pii': security_level.value in ['premium', 'enterprise'],  # Enhanced PII access for higher security levels
            'can_access_grades': security_level.value == 'enterprise',  # Only enterprise can access grades
            'course_access': []  # Empty means access to all funded courses
        }
        
    except (IndexError, ValueError) as e:
        if "Database" in str(e):
            raise
        raise ValueError("Invalid API key format")
    except Exception as e:
        logging.error(f"API key authentication error: {str(e)}")
        raise ValueError("Authentication failed") from e


def authenticate_jwt(token):
    """
    Validate JWT token and extract organization permissions.
    Enforces signature and standard claim validation.
    """
    jwt_issuer = os.getenv("JWT_ISSUER")
    jwt_audience = os.getenv("JWT_AUDIENCE")
    jwks_uri = os.getenv("JWT_JWKS_URI") or os.getenv("JWKS_URI")
    jwt_public_key = os.getenv("JWT_PUBLIC_KEY")

    if not jwt_issuer:
        raise ValueError("JWT issuer is not configured")

    if not jwt_audience:
        raise ValueError("JWT audience is not configured")

    if not jwks_uri and not jwt_public_key:
        raise ValueError("JWT verification key is not configured")

    def _build_verification_key():
        if jwks_uri:
            return _get_jwks_client(jwks_uri).get_signing_key_from_jwt(token).key
        # Allow escaped newlines for env-var injected PEM values.
        return jwt_public_key.replace("\\n", "\n")

    def _normalize_organization_id(raw_org_id):
        try:
            org_id = int(raw_org_id)
            if org_id <= 0:
                raise ValueError("organization_id must be positive")
            return org_id
        except (TypeError, ValueError) as err:
            raise ValueError("Invalid organization_id claim") from err

    def _fetch_organization(eduhub_client, organization_id):
        query = """
        query GetOrganizationForJwt($orgId: Int!) {
            Organization(where: {id: {_eq: $orgId}}) {
                id
                name
                type
            }
        }
        """
        result = eduhub_client.send_query(query, {"orgId": organization_id})
        if not isinstance(result, dict) or "errors" in result:
            raise ValueError("Database query error during JWT validation")

        organizations = result.get("data", {}).get("Organization", [])
        if not organizations:
            raise ValueError("Organization from JWT claim not found")

        return organizations[0]

    try:
        verification_key = _build_verification_key()
        decode_kwargs = {
            "key": verification_key,
            "algorithms": ["RS256"],
            "issuer": jwt_issuer,
            "audience": jwt_audience,
            "options": {
                "require": ["exp", "iat", "iss"],
                "verify_aud": True,
            },
            "leeway": 30,
        }

        claims = jwt.decode(token, **decode_kwargs)
        organization_id = _normalize_organization_id(claims.get("organization_id"))

        eduhub_client = EduHubClient()
        organization = _fetch_organization(eduhub_client, organization_id)

        security_level = get_security_level_for_organization(organization.get("type", "unknown"))
        access_level = str(claims.get("access_level", "basic")).lower()
        if access_level not in {"basic", "detailed", "full"}:
            access_level = "basic"

        raw_course_access = claims.get("course_access", [])
        course_access = []
        if isinstance(raw_course_access, list):
            for course_id in raw_course_access:
                try:
                    parsed_id = int(course_id)
                    if parsed_id > 0:
                        course_access.append(parsed_id)
                except (TypeError, ValueError):
                    continue

        return {
            'organization_id': organization["id"],
            'organization_name': organization["name"],
            'organization_type': organization.get("type", "unknown"),
            'access_level': access_level,
            'can_access_pii': security_level.value in ['premium', 'enterprise'],
            'can_access_grades': security_level.value == 'enterprise',
            'course_access': course_access,
            'security_level': security_level
        }
    except InvalidTokenError as err:
        logger.debug("JWT validation failed (%s): %s", err.__class__.__name__, str(err))
        raise ValueError("Invalid JWT token") from err
    except Exception as err:
        logger.debug("JWT processing failed (%s): %s", err.__class__.__name__, str(err))
        raise ValueError("Invalid JWT token") from err


def get_organization_funded_courses(organization_id, eduhub_client):
    """
    Get list of courses funded by the organization
    """
    variables = {"orgId": organization_id}
    
    # Primary approach: read from junction table and follow object relationship to Course
    primary_query = """
    query GetOrganizationCoursesPrimary($orgId: Int!) {
        CourseFundingOrganization(where: {organizationId: {_eq: $orgId}}) {
            Course {
                id
                title
                tagline
                ects
                language
                applicationEnd
                programId
                achievementCertificatePossible
                attendanceCertificatePossible
                CourseLocations {
                    id
                    locationOption
                }
                Sessions {
                    id
                    startDateTime
                    endDateTime
                }
                Program {
                    id
                    title
                    shortTitle
                }
            }
        }
    }
    """
    
    result = eduhub_client.send_query(primary_query, variables)
    courses: list = []
    
    def _valid_result(res: dict) -> bool:
        return isinstance(res, dict) and ("data" in res) and ("errors" not in res)
    
    if _valid_result(result):
        try:
            for funding_relation in result["data"].get("CourseFundingOrganization", []):
                course = funding_relation.get("Course")
                if course:
                    course_locations = course.get("CourseLocations", [])
                    course_id = course["id"]
                    
                    # Create one entry per location (matching MOOCHub API behavior)
                    if course_locations:
                        for location in course_locations:
                            # Create a copy of course data for this location
                            course_entry = course.copy()
                            location_id = location["id"]
                            location_option = location.get("locationOption")
                            hash_id = generate_course_hash_id(course_id, location_id)
                            
                            # Store location-specific info
                            course_entry["hashId"] = hash_id
                            course_entry["selectedLocation"] = location
                            course_entry["_internalId"] = course_id
                            course_entry["locationOption"] = location_option
                            
                            courses.append(course_entry)
                    else:
                        # Fallback: use course ID only if no locations exist
                        # Create a copy to avoid mutating the original GraphQL response object
                        course_entry = course.copy()
                        hash_id = generate_course_hash_id(course_id)
                        course_entry["hashId"] = hash_id
                        course_entry["selectedLocation"] = None
                        course_entry["_internalId"] = course_id
                        course_entry["locationOption"] = None
                        courses.append(course_entry)
        except Exception as e:
            logging.warning(f"Primary course funding query parsing failed: {str(e)}")
    else:
        logging.warning(f"Primary course funding query failed or returned errors: {result}")
    
    # Fallback approach: query Course and filter using array relationship CourseFundingOrganizations
    if not courses:
        fallback_query = """
        query GetOrganizationCoursesFallback($orgId: Int!) {
            Course(where: {CourseFundingOrganizations: {organizationId: {_eq: $orgId}}}) {
                id
                title
                tagline
                ects
                language
                applicationEnd
                programId
                achievementCertificatePossible
                attendanceCertificatePossible
                CourseLocations {
                    id
                    locationOption
                }
                Sessions {
                    id
                    startDateTime
                    endDateTime
                }
                Program {
                    id
                    title
                    shortTitle
                }
            }
        }
        """
        fb_result = eduhub_client.send_query(fallback_query, variables)
        if _valid_result(fb_result):
            try:
                raw_courses = fb_result["data"].get("Course", [])
                courses = []
                # Process locations and generate hash IDs - one entry per location
                for course in raw_courses:
                    course_locations = course.get("CourseLocations", [])
                    course_id = course["id"]
                    
                    # Create one entry per location (matching MOOCHub API behavior)
                    if course_locations:
                        for location in course_locations:
                            # Create a copy of course data for this location
                            course_entry = course.copy()
                            location_id = location["id"]
                            location_option = location.get("locationOption")
                            hash_id = generate_course_hash_id(course_id, location_id)
                            
                            # Store location-specific info
                            course_entry["hashId"] = hash_id
                            course_entry["selectedLocation"] = location
                            course_entry["_internalId"] = course_id
                            course_entry["locationOption"] = location_option
                            
                            courses.append(course_entry)
                    else:
                        # Fallback: use course ID only if no locations exist
                        # Create a copy to avoid mutating the original GraphQL response object
                        course_entry = course.copy()
                        hash_id = generate_course_hash_id(course_id)
                        course_entry["hashId"] = hash_id
                        course_entry["selectedLocation"] = None
                        course_entry["_internalId"] = course_id
                        course_entry["locationOption"] = None
                        courses.append(course_entry)
            except Exception as e:
                logging.error(f"Fallback course funding query parsing failed: {str(e)}")
                courses = []
        else:
            logging.error(f"Fallback course funding query failed or returned errors: {fb_result}")
            courses = []
    
    return courses


def _should_include_null_enrollment(enrollment_location, requested_location_option, course_locations):
    """
    Determine if a NULL enrollment should be included based on fallback priority.
    Priority: ONLINE -> KIEL -> HEIDE -> (any other location)
    
    Args:
        enrollment_location: The enrollment's location (should be None)
        requested_location_option: The requested location option (e.g., "ONLINE", "KIEL")
        course_locations: List of course locations with locationOption
        
    Returns:
        True if enrollment should be included, False otherwise
    """
    if enrollment_location is not None:
        # Enrollment has a location, so it's handled by direct matching
        return False
    
    if not requested_location_option:
        # No location requested, include all NULL enrollments
        return True
    
    # Get available location options for this course
    available_options = [loc.get("locationOption") for loc in course_locations if loc.get("locationOption")]
    
    if not available_options:
        # No locations available, include NULL enrollment
        return True
    
    # Priority order: ONLINE > KIEL > HEIDE > others
    priority_order = ['ONLINE', 'KIEL', 'HEIDE']
    
    # Find the highest priority location that exists for this course
    highest_priority = None
    for priority in priority_order:
        if priority in available_options:
            highest_priority = priority
            break
    
    # If no priority location found, use first available
    if highest_priority is None:
        highest_priority = available_options[0]
    
    # Include NULL enrollment only if requested location matches highest priority
    return requested_location_option == highest_priority


def get_course_participants(course_id, auth_info, eduhub_client, location_id=None, location_option=None, hash_id=None):
    """
    Get participants for a specific course with their enrollment and completion status.
    Optionally filters by location.
    
    Args:
        course_id: Internal course ID
        auth_info: Authentication information
        eduhub_client: EduHub GraphQL client
        location_id: Optional location ID for filtering
        location_option: Optional location option value (ONLINE, KIEL, HEIDE, etc.)
        hash_id: Optional hash ID to use (instead of generating)
    """
    query = """
    query GetCourseParticipants($courseId: Int!) {
        CourseEnrollment(where: {courseId: {_eq: $courseId}}) {
            id
            status
            created_at
            achievementCertificateURL
            attendanceCertificateURL
            location
            User {
                id
                occupation
            }
        }
        Course_by_pk(id: $courseId) {
            id
            title
            tagline
            ects
            language
            maxMissedSessions
            CourseLocations {
                id
                locationOption
            }
            Sessions {
                id
                startDateTime
                endDateTime
            }
            Program {
                id
                title
                shortTitle
            }
        }
    }
    """
    
    variables = {"courseId": course_id}
    result = eduhub_client.send_query(query, variables)
    
    # Check for GraphQL errors
    if "errors" in result:
        error_messages = [err.get("message", str(err)) for err in result["errors"]]
        logging.error(f"GraphQL query error in get_course_participants: {error_messages}")
        # Check if error is about missing 'location' field (migration not run)
        if any("location" in str(err).lower() or "field" in str(err).lower() for err in result["errors"]):
            logging.error("The 'location' field may not exist in the database schema. Please run the migration to add the location column to CourseEnrollment.")
        raise ValueError(f"GraphQL query failed: {', '.join(error_messages)}")
    
    if "data" not in result:
        logging.error(f"GraphQL response missing data: {result}")
        raise ValueError("GraphQL response missing data")
    
    enrollments = result["data"].get("CourseEnrollment", [])
    course_info = result["data"].get("Course_by_pk")
    
    if not course_info:
        return None, None
    
    # Get attendance data for completion status
    attendance_query = """
    query GetAttendanceData($courseId: Int!) {
        Attendance(where: {Session: {courseId: {_eq: $courseId}}}) {
            userId
            status
            Session {
                id
                startDateTime
            }
        }
    }
    """
    
    attendance_result = eduhub_client.send_query(attendance_query, variables)
    attendance_data = attendance_result["data"]["Attendance"]
    
    course_locations = course_info.get("CourseLocations", [])
    course_id_from_db = course_info["id"]
    
    # Use provided location_id and hash_id, or generate/select if not provided
    if location_id is not None:
        # Find the location object from course_locations
        selected_location = None
        for loc in course_locations:
            if loc.get("id") == location_id:
                selected_location = loc
                break
    else:
        # Fallback: select priority location (backward compatibility)
        selected_location = select_priority_location(course_locations)
        if selected_location:
            location_id = selected_location["id"]
    
    # Use provided hash_id or generate one
    if hash_id is None:
        if location_id is not None:
            hash_id = generate_course_hash_id(course_id_from_db, location_id)
        else:
            hash_id = generate_course_hash_id(course_id_from_db)
    
    # Store hash ID and location info
    course_info["hashId"] = hash_id
    course_info["selectedLocation"] = selected_location
    course_info["_internalId"] = course_id_from_db
    
    # Filter participants by location if location_option is provided
    if location_option:
        filtered_enrollments = []
        for enrollment in enrollments:
            enrollment_location = enrollment.get("location")
            
            # Include if location matches OR if NULL and matches fallback priority
            if enrollment_location == location_option:
                filtered_enrollments.append(enrollment)
            elif enrollment_location is None:
                # Check if this NULL enrollment should be included based on fallback priority
                if _should_include_null_enrollment(enrollment_location, location_option, course_locations):
                    filtered_enrollments.append(enrollment)
        
        enrollments = filtered_enrollments
    
    # Process participants
    participants = []
    for enrollment in enrollments:
        user = enrollment["User"]
        participant = process_participant_data(
            enrollment, 
            user, 
            attendance_data, 
            course_info,
            auth_info
        )
        participants.append(participant)
    
    return course_info, participants


def process_participant_data(enrollment, user, attendance_data, course_info, auth_info):
    """
    Process participant data based on access permissions.
    
    Note: course_info contains selectedLocation field for future participant location tracking.
    TODO: Add participantLocation field to participant object to indicate which location
    the participant is enrolled in. The selectedLocation from course_info can be used
    as a default, but individual participant locations may differ.
    """
    
    # Determine completion status
    has_achievement_cert = bool(enrollment.get("achievementCertificateURL"))
    has_attendance_cert = bool(enrollment.get("attendanceCertificateURL"))
    
    # Base participant data
    # TODO: Future enhancement - add participantLocation field to indicate which location
    # the participant is enrolled in. Use course_info["selectedLocation"] as reference.
    # Example: "participantLocation": {"id": location_id, "locationOption": "ONLINE"}
    participant = {
        "id": hash_user_id(user["id"]),
        "enrollmentStatus": enrollment["status"],
        "enrollmentDate": enrollment["created_at"],
        "completionStatus": {
            "hasAchievementCertificate": has_achievement_cert,
            "hasAttendanceCertificate": has_attendance_cert
        }
    }
    
    # Add occupation status instead of organization/PII
    if user.get("occupation"):
        participant["occupationStatus"] = user["occupation"]
    
    # Add learning achievements
    achievements = []
    if has_attendance_cert:
        achievements.append({
            "id": f"urn:achievement:attendance:{enrollment['id']}",
            "title": f"Attendance Certificate - {course_info['title']}",
            "type": "attendance"
        })
    
    if has_achievement_cert:
        achievements.append({
            "id": f"urn:achievement:completion:{enrollment['id']}",
            "title": f"Achievement Certificate - {course_info['title']}",
            "type": "achievement"
        })
    
    if achievements:
        participant["learningAchievements"] = achievements
    
    return participant


def hash_user_id(user_id):
    """
    Create a consistent hash of user ID for privacy protection
    """
    return f"urn:hash:{hashlib.sha256(str(user_id).encode()).hexdigest()[:16]}"


def handle_participants_request(request):
    """
    Main handler for participant data requests with comprehensive security
    """
    try:
        logging.debug("Starting participant data request")
        
        # Get client IP for security tracking
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if client_ip and ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        
        # Prepare request data for audit logging
        request_data = {
            'path': request.path,
            'query_string': request.query_string.decode('utf-8'),
            'headers': dict(request.headers),
            'method': request.method
        }
        
        # Authenticate and get organization permissions
        auth_info = authenticate_organization_access(request)
        logging.debug("Authentication successful for org %s", auth_info['organization_id'])
        
        # Check rate limiting based on security level
        rate_allowed, rate_info = security_handler.check_rate_limit(
            auth_info['organization_id'], 
            auth_info['security_level'], 
            client_ip
        )
        
        if not rate_allowed:
            security_handler.log_audit_event(
                'rate_limit_exceeded', auth_info['organization_id'], client_ip, 
                request_data, False, f"Rate limit exceeded: {rate_info}"
            )
            return {
                'error': 'Rate limit exceeded',
                'details': f'Too many requests. Limit: {rate_info.get("limit", "unknown")}',
                'retry_after': int(rate_info.get('reset_time', 0) - time.time())
            }, 429
        
        # Detect anomalies
        anomalies = security_handler.detect_anomalies(
            auth_info['organization_id'], client_ip, request_data
        )
        
        if anomalies:
            security_handler.log_audit_event(
                'anomaly_detected', auth_info['organization_id'], client_ip, 
                request_data, False, f"Anomalies detected: {', '.join(anomalies)}"
            )
            # Log anomalies but don't block the request (monitoring only)
            logging.debug("Anomalies detected: %s", anomalies)
        
        # Initialize EduHub client - handle missing environment gracefully
        try:
            eduhub_client = EduHubClient()
        except ValueError as e:
            if "HASURA_ENDPOINT" in str(e) or "HASURA_ADMIN_SECRET" in str(e):
                return {
                    'error': 'Service temporarily unavailable - database connection not configured',
                    'details': 'This API requires access to the EduHub database. Please ensure the service is properly configured.',
                    'code': 'HASURA_CONFIG_MISSING'
                }, 503
            else:
                raise e
        except Exception as e:
            logging.error(f"EduHub client initialization error: {str(e)}")
            return {
                'error': 'Database connection error',
                'details': f'Failed to connect to EduHub database: {str(e)}',
                'code': 'DB_CONNECTION_ERROR'
            }, 503
        
        # Fetch organization's funded courses early (needed for hash ID resolution)
        org_courses = get_organization_funded_courses(auth_info['organization_id'], eduhub_client)

        # Enforce JWT course_access restriction when present (empty = all funded courses)
        allowed_course_ids = set(auth_info.get("course_access") or [])
        if allowed_course_ids:
            org_courses = [
                c for c in org_courses
                if (c.get("_internalId") or c.get("id")) in allowed_course_ids
            ]

        # Get course ID from path or query params with validation
        path_parts = request.path.strip('/').split('/')
        resolved_info = None
        
        if len(path_parts) > 1:
            # Path: /participants/courses/{course_id_or_hash}
            if path_parts[1] == 'courses' and len(path_parts) > 2:
                try:
                    resolved_info = resolve_course_id_from_url(path_parts[2], org_courses)
                except Exception as e:
                    logging.error(f"Error resolving course ID from URL: {str(e)}")
                    import traceback
                    logging.error(f"Traceback: {traceback.format_exc()}")
                    security_handler.log_audit_event(
                        'invalid_input', auth_info['organization_id'], client_ip, 
                        request_data, False, f"Error resolving course ID in path: {path_parts[2]}: {str(e)}"
                    )
                    return {'error': 'Invalid course ID'}, 400
                if resolved_info is None:
                    security_handler.log_audit_event(
                        'invalid_input', auth_info['organization_id'], client_ip, 
                        request_data, False, f"Invalid course ID in path: {path_parts[2]}"
                    )
                    return {'error': 'Invalid course ID'}, 400
        
        # Alternative: course_id in query params
        if not resolved_info:
            course_id_param = request.args.get('course_id')
            if course_id_param:
                try:
                    resolved_info = resolve_course_id_from_url(course_id_param, org_courses)
                except Exception as e:
                    logging.error(f"Error resolving course ID from query param: {str(e)}")
                    import traceback
                    logging.error(f"Traceback: {traceback.format_exc()}")
                    security_handler.log_audit_event(
                        'invalid_input', auth_info['organization_id'], client_ip, 
                        request_data, False, f"Error resolving course ID in query: {course_id_param}: {str(e)}"
                    )
                    return {'error': 'Invalid course ID parameter'}, 400
                if resolved_info is None:
                    security_handler.log_audit_event(
                        'invalid_input', auth_info['organization_id'], client_ip, 
                        request_data, False, f"Invalid course ID in query: {course_id_param}"
                    )
                    return {'error': 'Invalid course ID parameter'}, 400
        
        # Log successful request processing
        if resolved_info:
            security_handler.log_audit_event(
                'request_processed', auth_info['organization_id'], client_ip, 
                request_data, True, f"Request processed successfully. Course ID: {resolved_info['course_id']}, Hash ID: {resolved_info.get('hash_id', 'N/A')}"
            )
        else:
            security_handler.log_audit_event(
                'request_processed', auth_info['organization_id'], client_ip, 
                request_data, True, "Request processed successfully. Listing all courses."
            )
        
        if resolved_info:
            # Get participants for specific course
            return handle_course_participants(
                resolved_info['course_id'], 
                auth_info, 
                eduhub_client, 
                client_ip, 
                request_data,
                location_id=resolved_info.get('location_id'),
                location_option=resolved_info.get('location_option'),
                hash_id=resolved_info.get('hash_id'),
                org_courses=org_courses
            )
        else:
            # List organization's funded courses
            return handle_organization_courses(auth_info, eduhub_client, client_ip, request_data, org_courses=org_courses)
            
    except ValueError as e:
        logging.warning("Authentication error: %s", str(e))
        return {'error': str(e)}, 401
    except Exception as e:
        import traceback
        logging.error(f"Participant data request error: {str(e)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        return {'error': 'Internal server error'}, 500


def handle_course_participants(course_id, auth_info, eduhub_client, client_ip, request_data, location_id=None, location_option=None, hash_id=None, org_courses=None):
    """
    Handle request for participants of a specific course with security enhancements
    """
    # Verify organization has access to this course
    if org_courses is None:
        org_courses = get_organization_funded_courses(auth_info['organization_id'], eduhub_client)
    # Use _internalId if available (from our processing), otherwise use 'id' (from GraphQL)
    course_ids = [course.get('_internalId') or course.get('id') for course in org_courses]
    
    if course_id not in course_ids:
        security_handler.log_audit_event(
            'access_denied', auth_info['organization_id'], client_ip, 
            request_data, False, f"Attempted to access course {course_id} not funded by organization {auth_info['organization_id']}"
        )
        return {'error': 'Access denied: course not funded by your organization'}, 403
    
    # Get course and participant data
    course_info, participants = get_course_participants(
        course_id, 
        auth_info, 
        eduhub_client,
        location_id=location_id,
        location_option=location_option,
        hash_id=hash_id
    )
    
    if not course_info:
        security_handler.log_audit_event(
            'course_not_found', auth_info['organization_id'], client_ip, 
            request_data, False, f"Course with ID {course_id} not found"
        )
        return {'error': 'Course not found'}, 404
    
    # Use provided hash_id or get from course_info (backward compatibility)
    if not hash_id:
        hash_id = course_info.get("hashId")
    if not hash_id:
        # Fallback if hash ID wasn't generated (shouldn't happen, but safety check)
        hash_id = generate_course_hash_id(course_id)
    
    # Build response using hash ID instead of internal course ID
    response = {
        "type": "ParticipantDataReport",
        "id": f"urn:report:course:{hash_id}:{datetime.now(UTC).isoformat()}",
        "provider": {
            "id": "did:web:edu.opencampus.sh",
            "name": "opencampus.sh",
            "type": "Nonprofit",
            "legalName": "Campus Business Box e.V.",
            "websiteUrl": "https://edu.opencampus.sh",
            "contactEmail": "edu@opencampus.sh",
            "address": {
                "streetAddress": "Wissenschaftszentrum Kiel, Fraunhoferstr. 13",
                "postalCode": "24118",
                "locality": "Kiel",
                "country": "DE"
            }
        },
        "learningOpportunity": {
            "id": f"urn:course:{hash_id}",
            "title": course_info["title"],
            "summary": course_info.get("tagline"),
            "type": "Course",
            "language": [course_info.get("language", "en")],
            "fundingOrganization": {
                "id": auth_info["organization_id"],
                "name": auth_info["organization_name"]
            }
        },
        "participants": participants,
        "generatedAt": datetime.now(UTC).isoformat()
    }
    
    # Add ECTS credits if available and valid
    ects_value = safe_float_convert(course_info.get("ects"))
    if ects_value is not None:
        response["learningOpportunity"]["creditPoints"] = [{
            "framework": "ECTS",
            "point": ects_value
        }]
    
    # No eqfLevel field in Program; omit
    
    # Sanitize response data based on security level
    sanitized_response = security_handler.sanitize_response_data(response, auth_info["security_level"])
    
    # Generate security headers
    security_headers = security_handler.generate_security_headers({
        'remaining': 'unlimited',  # This would come from rate limiting
        'reset_time': datetime.now(UTC).timestamp() + 3600
    })
    security_headers.update({
        'X-Access-Level': auth_info.get('access_level', 'basic'),
        'X-Data-Retention': '24h'
    })
    
    # Log successful data access
    security_handler.log_audit_event(
        'data_accessed', auth_info['organization_id'], client_ip, 
        request_data, True, f"Successfully accessed participant data for course {course_id}. Participants: {len(participants)}"
    )
    
    return sanitized_response, 200, security_headers


def handle_organization_courses(auth_info, eduhub_client, client_ip, request_data, org_courses=None):
    """
    Handle request for list of organization's funded courses with security enhancements
    """
    if org_courses is None:
        org_courses = get_organization_funded_courses(auth_info['organization_id'], eduhub_client)
    
    course_list = []
    for course in org_courses:
        # Use hash ID instead of internal course ID
        hash_id = course.get("hashId")
        if not hash_id:
            # Fallback if hash ID wasn't generated (shouldn't happen, but safety check)
            course_id = course.get("_internalId") or course.get("id")
            hash_id = generate_course_hash_id(course_id)
        
        course_summary = {
            "id": hash_id,
            "title": course["title"],
            "description": course.get("description"),
            "startDate": course.get("startDate"),
            "endDate": course.get("endDate"),
            "participantDataEndpoint": f"/participants/courses/{hash_id}"
        }
        
        # Only add creditPoints if ECTS value is valid and convertible
        ects_value = safe_float_convert(course.get("ects"))
        if ects_value is not None:
            course_summary["creditPoints"] = [{
                "framework": "ECTS", 
                "point": ects_value
            }]
            
        course_list.append(course_summary)
    
    response = {
        "type": "CourseListReport",
        "id": f"urn:report:org:{auth_info['organization_id']}:{datetime.now(UTC).isoformat()}",
        "provider": {
            "id": "did:web:edu.opencampus.sh",
            "name": "opencampus.sh",
            "type": "Nonprofit",
            "legalName": "Campus Business Box e.V.",
            "websiteUrl": "https://edu.opencampus.sh",
            "contactEmail": "edu@opencampus.sh",
            "address": {
                "streetAddress": "Wissenschaftszentrum Kiel, Fraunhoferstr. 13",
                "postalCode": "24118",
                "locality": "Kiel",
                "country": "DE"
            }
        },
        "fundingOrganization": {
            "id": auth_info["organization_id"],
            "name": auth_info["organization_name"]
        },
        "courses": course_list,
        "generatedAt": datetime.now(UTC).isoformat()
    }
    
    # Sanitize response data based on security level
    sanitized_response = security_handler.sanitize_response_data(response, auth_info["security_level"])
    
    # Generate security headers
    security_headers = security_handler.generate_security_headers({
        'remaining': 'unlimited',  # This would come from rate limiting
        'reset_time': datetime.now(UTC).timestamp() + 3600
    })
    security_headers.update({
        'X-Access-Level': auth_info.get('access_level', 'basic'),
        'X-Data-Retention': '24h'
    })
    
    # Log successful data access
    security_handler.log_audit_event(
        'data_accessed', auth_info['organization_id'], client_ip, 
        request_data, True, f"Successfully accessed course list. Courses: {len(course_list)}"
    )
    
    return sanitized_response, 200, security_headers


def handle_participants_schema():
    """
    Return the JSON schema for participant data
    """
    # Debug info about environment
    hasura_endpoint = os.getenv("HASURA_ENDPOINT", "NOT_SET")
    hasura_secret = "SET" if os.getenv("HASURA_ADMIN_SECRET") else "NOT_SET"
    
    schema = {
        "$schema": "https://json-schema.org/draft/2019-09/schema",
        "$id": "https://api-edu.opencampus.sh/schemas/participant-data-v1.0.0.json",
        "title": "EduHub ELM-Compliant Participant Data API",
        "description": "RESTful API providing secure, privacy-preserving access to participant enrollment and completion data for courses funded by partner organizations. Implements European Learning Model (ELM) standards with privacy-first design - no PII is exposed, participant identities are cryptographically hashed.",
        "version": "1.0.0",
        "type": "object",
        "api": {
            "authentication": {
                "type": "API Key",
                "header": "X-API-Key",
                "format": "edh_live_org{organization_id}_sk_{secret}",
                "required_headers": ["User-Agent"],
                "optional_headers": {
                    "Accept-Version": "3.0.1 (default if omitted)"
                }
            },
            "base_url": "Function endpoint varies by deployment",
            "endpoints": {
                "list_courses": {
                    "method": "GET",
                    "path": "/participants",
                    "description": "List all courses funded by the authenticated organization. Returns one course entry per location (matching MOOCHub API behavior). Each course-location combination has a unique hash ID (UUID).",
                    "response_type": "CourseListReport"
                },
                "get_participants": {
                    "method": "GET", 
                    "path": "/participants/courses/{course_id}",
                    "description": "Get participant enrollment and completion data for a specific funded course-location combination. Accepts hash ID (UUID) as primary format, or internal course ID (integer) for backward compatibility. When hash ID is used, participants are filtered by the specific location. Returns hash ID (UUID) in response.",
                    "response_type": "ParticipantDataReport"
                },
                "get_schema": {
                    "method": "GET",
                    "path": "/participants/schema", 
                    "description": "This schema definition for the Participant Data API",
                    "response_type": "Schema"
                }
            },
            "recommended_endpoints": {
                "health_check": {
                    "method": "GET",
                    "path": "/health",
                    "description": "Dedicated health check endpoint"
                }
            }
        },
        "data_model": {
            "privacy_policy": "No personally identifiable information (PII) is returned. Participant IDs are stable cryptographic hashes. Only enrollment status, completion certificates, and occupation category are provided.",
            "participant_data": {
                "id": "urn:hash:{first_16_chars_of_sha256} - Privacy-preserving stable identifier",
                "enrollmentStatus": "Enum: ABORTED, APPLIED, CANCELLED, COMPLETED, CONFIRMED, INVITED, REGISTERED, REJECTED",
                "enrollmentDate": "ISO 8601 timestamp of enrollment",
                "occupationStatus": "Optional occupation category (STUDENT, EMPLOYEE, etc.)",
                "completionStatus": {
                    "hasAchievementCertificate": "Boolean - indicates completion certificate was issued",
                    "hasAttendanceCertificate": "Boolean - indicates attendance certificate was issued"
                },
                "learningAchievements": "Optional array of certificate records with URNs and types"
            },
            "course_data": {
                "id": "UUID v5 hash identifier (format: urn:course:{uuid}) - matches MOOCHub API format. Generated from course_id-location_id combination. Each course-location combination has a unique hash ID. One course entry is returned per location.",
                "title": "Course title",
                "summary": "Course description/tagline", 
                "language": "Array of ISO language codes",
                "creditPoints": "Optional ECTS credit points",
                "fundingOrganization": "Organization that funds this course"
            }
        },
        "security": {
            "rate_limiting": "Enforced per organization and security level",
            "ip_restrictions": "Optional IP allowlisting per organization", 
            "audit_logging": "All access attempts logged with client IP and request details",
            "data_retention": "Response data should not be cached longer than 24 hours",
            "security_headers": "Includes CSP, HSTS, X-Frame-Options, etc."
        },
        "errors": {
            "401": "Invalid or missing API key", 
            "403": "Access denied - course not funded by your organization",
            "404": "Course not found",
            "429": "Rate limit exceeded", 
            "503": "Service unavailable - database connection issues"
        },
        "schema_url": "/schemas/participant-data-v1.0.0.json",
        "schema_latest_url": "/schemas/participant-data/latest.json"
    }
    
    return schema, 200


def generate_api_key(organization_id, eduhub_client):
    """
    Generate a new API key for an organization and store the hash in the database
    Returns the generated API key (should be shown only once to the user)
    """
    import secrets
    
    # Generate a secure random secret
    secret = secrets.token_hex(16)  # 32 character hex string
    api_key = f"edh_live_org{organization_id}_sk_{secret}"
    
    # Generate hash for database storage
    api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # Store the hash in the database
    mutation = """
    mutation UpdateOrganizationApiKey($orgId: Int!, $apiKeyHash: String!) {
        update_Organization_by_pk(
            pk_columns: {id: $orgId}, 
            _set: {apiKeyHash: $apiKeyHash}
        ) {
            id
            name
            apiKeyHash
        }
    }
    """
    
    variables = {
        "orgId": organization_id,
        "apiKeyHash": api_key_hash
    }
    
    result = eduhub_client.send_query(mutation, variables)
    
    if not isinstance(result, dict) or "errors" in result:
        logging.error(f"Failed to store API key hash: {result}")
        raise ValueError("Failed to store API key in database")
    
    return api_key


def revoke_api_key(organization_id, eduhub_client):
    """
    Revoke an organization's API key by removing the hash from the database
    """
    mutation = """
    mutation RevokeOrganizationApiKey($orgId: Int!) {
        update_Organization_by_pk(
            pk_columns: {id: $orgId}, 
            _set: {apiKeyHash: null}
        ) {
            id
            name
            apiKeyHash
        }
    }
    """
    
    variables = {"orgId": organization_id}
    result = eduhub_client.send_query(mutation, variables)
    
    if not isinstance(result, dict) or "errors" in result:
        logging.error(f"Failed to revoke API key: {result}")
        raise ValueError("Failed to revoke API key from database")
    
    return True


def get_organization_api_key_status(organization_id, eduhub_client):
    """
    Check if an organization has an active API key
    Returns True if API key exists, False otherwise
    """
    query = """
    query GetOrganizationApiKeyStatus($orgId: Int!) {
        Organization_by_pk(id: $orgId) {
            id
            name
            apiKeyHash
        }
    }
    """
    
    variables = {"orgId": organization_id}
    result = eduhub_client.send_query(query, variables)
    
    if not isinstance(result, dict) or "errors" in result:
        logging.error(f"Failed to get organization API key status: {result}")
        return False
    
    organization = result["data"]["Organization_by_pk"]
    return organization and organization.get("apiKeyHash") is not None