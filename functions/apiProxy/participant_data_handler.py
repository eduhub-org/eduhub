"""
Participant Data Handler for ELM-compliant third-party access
Provides participant enrollment and completion status for courses
"""

import os
import logging
import hashlib
from datetime import datetime, timedelta
from flask import jsonify
try:
    from api_clients.eduhub_client import EduHubClient
    from security_handler import security_handler, get_security_level_for_organization, validate_and_sanitize_input
except ImportError:
    # Fallback for when module is loaded from different context
    import sys
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    from api_clients.eduhub_client import EduHubClient
    from security_handler import security_handler, get_security_level_for_organization, validate_and_sanitize_input


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
        raise e


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
        import hashlib
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
            raise e
        raise ValueError("Invalid API key format")
    except Exception as e:
        logging.error(f"API key authentication error: {str(e)}")
        raise ValueError("Authentication failed")


def authenticate_jwt(token):
    """
    Validate JWT token and extract organization permissions
    In production, this would verify the token signature
    """
    # Mock implementation - in production, verify JWT signature
    import base64
    import json
    
    try:
        # Decode JWT payload (without verification for demo)
        parts = token.split('.')
        payload = base64.urlsafe_b64decode(parts[1] + '==')
        claims = json.loads(payload)
        
        return {
            'organization_id': claims.get('organization_id'),
            'organization_name': claims.get('organization_name'),
            'access_level': claims.get('access_level', 'basic'),
            'can_access_pii': claims.get('pii_access', False),
            'can_access_grades': claims.get('grade_access', False),
            'course_access': claims.get('course_access', [])
        }
    except Exception:
        raise ValueError("Invalid JWT token")


def get_organization_funded_courses(organization_id, eduhub_client):
    """
    Get list of courses funded by the organization
    """
    query = """
    query GetOrganizationCourses($orgId: Int!) {
        CourseFundingOrganization(where: {organizationId: {_eq: $orgId}}) {
            Course {
                id
                title
                description
                ects
                language
                startDate
                endDate
                programId
                achievementCertificatePossible
                attendanceCertificatePossible
                Program {
                    id
                    title
                    shortTitle
                    eqfLevel
                }
            }
        }
    }
    """
    
    variables = {"orgId": organization_id}
    result = eduhub_client.send_query(query, variables)
    
    # Check for GraphQL errors
    if not isinstance(result, dict):
        logging.error(f"GraphQL query failed: {result}")
        return []
    
    if "errors" in result:
        logging.error(f"GraphQL errors: {result['errors']}")
        return []
    
    if "data" not in result:
        logging.error(f"GraphQL response missing data: {result}")
        return []
    
    courses = []
    for funding_relation in result["data"]["CourseFundingOrganization"]:
        course = funding_relation["Course"]
        courses.append(course)
    
    return courses


def get_course_participants(course_id, auth_info, eduhub_client):
    """
    Get participants for a specific course with their enrollment and completion status
    """
    query = """
    query GetCourseParticipants($courseId: Int!) {
        CourseEnrollment(where: {courseId: {_eq: $courseId}}) {
            id
            status
            created_at
            achievementCertificateURL
            attendanceCertificateURL
            User {
                id
                firstName
                lastName
                email
                matriculationNumber
                Organization {
                    id
                    name
                }
            }
        }
        Course_by_pk(id: $courseId) {
            id
            title
            description
            ects
            language
            startDate
            endDate
            maxMissedSessions
            Sessions {
                id
                startDateTime
                endDateTime
            }
            Program {
                id
                title
                shortTitle
                eqfLevel
            }
        }
    }
    """
    
    variables = {"courseId": course_id}
    result = eduhub_client.send_query(query, variables)
    
    enrollments = result["data"]["CourseEnrollment"]
    course_info = result["data"]["Course_by_pk"]
    
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
    Process participant data based on access permissions
    """
    # Calculate attendance rate
    user_attendance = [a for a in attendance_data if a["userId"] == user["id"]]
    total_sessions = len(course_info.get("Sessions", []))
    attended_sessions = len([a for a in user_attendance if a["status"] == "ATTENDED"])
    attendance_rate = attended_sessions / total_sessions if total_sessions > 0 else 0
    
    # Determine completion status
    has_achievement_cert = bool(enrollment.get("achievementCertificateURL"))
    has_attendance_cert = bool(enrollment.get("attendanceCertificateURL"))
    
    # Base participant data
    participant = {
        "id": hash_user_id(user["id"]) if not auth_info["can_access_pii"] else user["id"],
        "enrollmentStatus": enrollment["status"],
        "enrollmentDate": enrollment["created_at"],
        "completionStatus": {
            "hasAttended": attendance_rate >= 0.8,  # 80% attendance requirement
            "attendanceRate": round(attendance_rate, 2),
            "hasAchievementCertificate": has_achievement_cert,
            "hasAttendanceCertificate": has_attendance_cert
        }
    }
    
    # Add PII data if permitted
    if auth_info["can_access_pii"]:
        participant.update({
            "fullName": f"{user['firstName']} {user['lastName']}",
            "givenName": user["firstName"],
            "familyName": user["lastName"],
            "email": user["email"]
        })
        
        if user.get("matriculationNumber"):
            participant["identifier"] = [{
                "type": "matriculationNumber",
                "value": user["matriculationNumber"]
            }]
    
    # Add organization info
    if user.get("Organization"):
        participant["organization"] = {
            "id": user["Organization"]["id"],
            "name": user["Organization"]["name"]
        }
    
    # Add completion date if certificates exist
    if has_achievement_cert or has_attendance_cert:
        # Use enrollment updated date as proxy for completion
        participant["completionStatus"]["completionDate"] = enrollment.get("updated_at")
        participant["completionStatus"]["certificateIssuedDate"] = enrollment.get("updated_at")
    
    # Add learning achievements
    achievements = []
    if has_attendance_cert:
        achievements.append({
            "id": f"urn:achievement:attendance:{enrollment['id']}",
            "title": f"Attendance Certificate - {course_info['title']}",
            "type": "attendance",
            "issuanceDate": enrollment.get("updated_at")
        })
    
    if has_achievement_cert:
        achievements.append({
            "id": f"urn:achievement:completion:{enrollment['id']}",
            "title": f"Achievement Certificate - {course_info['title']}",
            "type": "achievement", 
            "issuanceDate": enrollment.get("updated_at")
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
        print("DEBUG: Starting participant data request")  # Debug output
        
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
        print(f"DEBUG: Authentication successful for org {auth_info['organization_id']}")  # Debug output
        
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
            print(f"DEBUG: Anomalies detected: {anomalies}")
        
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
            print(f"DEBUG: EduHub client error: {str(e)}")  # Debug output
            logging.error(f"EduHub client initialization error: {str(e)}")
            return {
                'error': 'Database connection error',
                'details': f'Failed to connect to EduHub database: {str(e)}',
                'code': 'DB_CONNECTION_ERROR'
            }, 503
        
        # Get course ID from path or query params with validation
        path_parts = request.path.strip('/').split('/')
        course_id = None
        
        if len(path_parts) > 1:
            # Path: /participants/courses/123
            if path_parts[1] == 'courses' and len(path_parts) > 2:
                is_valid, validated_id = validate_and_sanitize_input(path_parts[2], 'course_id')
                if is_valid:
                    course_id = validated_id
                else:
                    security_handler.log_audit_event(
                        'invalid_input', auth_info['organization_id'], client_ip, 
                        request_data, False, f"Invalid course ID in path: {path_parts[2]}"
                    )
                    return {'error': 'Invalid course ID'}, 400
        
        # Alternative: course_id in query params
        if not course_id:
            course_id_param = request.args.get('course_id')
            if course_id_param:
                is_valid, validated_id = validate_and_sanitize_input(course_id_param, 'course_id')
                if is_valid:
                    course_id = validated_id
                else:
                    security_handler.log_audit_event(
                        'invalid_input', auth_info['organization_id'], client_ip, 
                        request_data, False, f"Invalid course ID in query: {course_id_param}"
                    )
                    return {'error': 'Invalid course ID parameter'}, 400
        
        # Log successful request processing
        security_handler.log_audit_event(
            'request_processed', auth_info['organization_id'], client_ip, 
            request_data, True, f"Request processed successfully. Course ID: {course_id}"
        )
        
        if course_id:
            # Get participants for specific course
            return handle_course_participants(course_id, auth_info, eduhub_client, client_ip, request_data)
        else:
            # List organization's funded courses
            return handle_organization_courses(auth_info, eduhub_client, client_ip, request_data)
            
    except ValueError as e:
        print(f"DEBUG: Authentication error: {str(e)}")  # Debug output
        return {'error': str(e)}, 401
    except Exception as e:
        print(f"DEBUG: Unexpected error: {str(e)}")  # Debug output
        logging.error(f"Participant data request error: {str(e)}")
        return {'error': 'Internal server error'}, 500


def handle_course_participants(course_id, auth_info, eduhub_client, client_ip, request_data):
    """
    Handle request for participants of a specific course with security enhancements
    """
    # Verify organization has access to this course
    org_courses = get_organization_funded_courses(auth_info['organization_id'], eduhub_client)
    course_ids = [course['id'] for course in org_courses]
    
    if course_id not in course_ids:
        security_handler.log_audit_event(
            'access_denied', auth_info['organization_id'], client_ip, 
            request_data, False, f"Attempted to access course {course_id} not funded by organization {auth_info['organization_id']}"
        )
        return {'error': 'Access denied: course not funded by your organization'}, 403
    
    # Get course and participant data
    course_info, participants = get_course_participants(course_id, auth_info, eduhub_client)
    
    if not course_info:
        security_handler.log_audit_event(
            'course_not_found', auth_info['organization_id'], client_ip, 
            request_data, False, f"Course with ID {course_id} not found"
        )
        return {'error': 'Course not found'}, 404
    
    # Build ELM-compliant response
    response = {
        "@context": [
            "https://europa.eu/europass/elm/context/v3",
            "https://eduhub.org/context/participant-data/v1"
        ],
        "type": "ParticipantDataReport",
        "id": f"urn:report:course:{course_id}:{datetime.utcnow().isoformat()}",
        "provider": {
            "id": "did:web:eduhub.org",
            "name": "EduHub Learning Platform", 
            "type": "EducationalOrganization",
            "location": {
                "address": "TU Berlin, Berlin, Germany",
                "country": "DE"
            }
        },
        "learningOpportunity": {
            "id": f"urn:course:{course_id}",
            "title": course_info["title"],
            "description": course_info.get("description"),
            "type": "Course",
            "startDate": course_info.get("startDate"),
            "endDate": course_info.get("endDate"), 
            "language": [course_info.get("language", "en")],
            "fundingOrganization": {
                "id": auth_info["organization_id"],
                "name": auth_info["organization_name"]
            }
        },
        "participants": participants,
        "generatedAt": datetime.utcnow().isoformat(),
        "validUntil": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "accessPermissions": {
            "organizationId": auth_info["organization_id"],
            "dataLevel": auth_info["access_level"],
            "includePII": auth_info["can_access_pii"],
            "securityLevel": auth_info["security_level"].value
        }
    }
    
    # Add ECTS credits if available
    if course_info.get("ects"):
        response["learningOpportunity"]["creditPoints"] = [{
            "framework": "ECTS",
            "point": float(course_info["ects"])
        }]
    
    # Add EQF level if available
    if course_info.get("Program") and course_info["Program"].get("eqfLevel"):
        response["learningOpportunity"]["eqfLevel"] = course_info["Program"]["eqfLevel"]
    
    # Sanitize response data based on security level
    sanitized_response = security_handler.sanitize_response_data(response, auth_info["security_level"])
    
    # Generate security headers
    security_headers = security_handler.generate_security_headers({
        'remaining': 'unlimited',  # This would come from rate limiting
        'reset_time': datetime.utcnow().timestamp() + 3600
    })
    
    # Log successful data access
    security_handler.log_audit_event(
        'data_accessed', auth_info['organization_id'], client_ip, 
        request_data, True, f"Successfully accessed participant data for course {course_id}. Participants: {len(participants)}"
    )
    
    return sanitized_response, 200, security_headers


def handle_organization_courses(auth_info, eduhub_client, client_ip, request_data):
    """
    Handle request for list of organization's funded courses with security enhancements
    """
    org_courses = get_organization_funded_courses(auth_info['organization_id'], eduhub_client)
    
    course_list = []
    for course in org_courses:
        course_summary = {
            "id": course["id"],
            "title": course["title"],
            "description": course.get("description"),
            "startDate": course.get("startDate"),
            "endDate": course.get("endDate"),
            "participantDataEndpoint": f"/participants/courses/{course['id']}"
        }
        
        if course.get("ects"):
            course_summary["creditPoints"] = [{
                "framework": "ECTS", 
                "point": float(course["ects"])
            }]
            
        course_list.append(course_summary)
    
    response = {
        "@context": [
            "https://europa.eu/europass/elm/context/v3",
            "https://eduhub.org/context/participant-data/v1"
        ],
        "type": "CourseListReport",
        "id": f"urn:report:org:{auth_info['organization_id']}:{datetime.utcnow().isoformat()}",
        "provider": {
            "id": "did:web:eduhub.org",
            "name": "EduHub Learning Platform",
            "type": "EducationalOrganization"
        },
        "fundingOrganization": {
            "id": auth_info["organization_id"],
            "name": auth_info["organization_name"]
        },
        "courses": course_list,
        "generatedAt": datetime.utcnow().isoformat(),
        "accessPermissions": {
            "organizationId": auth_info["organization_id"],
            "dataLevel": auth_info["access_level"],
            "securityLevel": auth_info["security_level"].value
        }
    }
    
    # Sanitize response data based on security level
    sanitized_response = security_handler.sanitize_response_data(response, auth_info["security_level"])
    
    # Generate security headers
    security_headers = security_handler.generate_security_headers({
        'remaining': 'unlimited',  # This would come from rate limiting
        'reset_time': datetime.utcnow().timestamp() + 3600
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
        "$id": "https://eduhub.org/schemas/elm-participant-data/v1.0.0",
        "title": "ELM Participant Data Schema",
        "description": "JSON Schema for European Learning Model (ELM) compliant participant data",
        "version": "1.0.0",
        "type": "object",
        "endpoints": {
            "courses": "/participants - List organization's funded courses",
            "participants": "/participants/courses/{course_id} - Get course participants",
            "schema": "/participants/schema - This schema definition"
        },
        "environment_status": {
            "hasura_endpoint": hasura_endpoint,
            "hasura_admin_secret": hasura_secret,
            "note": "For Docker development, use 'hasura:8080'. For local development, use 'localhost:8080'"
        }
    }
    
    return schema, 200


def generate_api_key(organization_id, eduhub_client):
    """
    Generate a new API key for an organization and store the hash in the database
    Returns the generated API key (should be shown only once to the user)
    """
    import secrets
    import hashlib
    
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