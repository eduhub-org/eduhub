import os
from flask import jsonify
import logging
from api_clients.eduhub_client import EduHubClient
import uuid
from datetime import datetime

# Rate limiting configuration - 100 requests per hour per IP
RATE_LIMIT = 60
RATE_WINDOW = 3600  # 1 hour in seconds
request_counts = {}  # In-memory storage for rate limiting

def check_rate_limit(ip_address):
    current_time = datetime.now().timestamp()
    if ip_address in request_counts:
        count, window_start = request_counts[ip_address]
        # Reset if window has expired
        if current_time - window_start > RATE_WINDOW:
            request_counts[ip_address] = (1, current_time)
            return True
        elif count >= RATE_LIMIT:
            return False
        else:
            request_counts[ip_address] = (count + 1, window_start)
            return True
    else:
        request_counts[ip_address] = (1, current_time)
        return True

def get_cors_headers():
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept-Version',
        'Access-Control-Max-Age': '3600',
        'Content-Type': 'application/vnd.api+json',
        'X-API-Version': '3.0.1',
        'X-Rate-Limit-Limit': str(RATE_LIMIT),
        'X-Rate-Limit-Window': str(RATE_WINDOW)
    }
    return headers

def generate_uuid_from_id(id_str):
    """Generate a consistent UUID from a string ID by using it as a namespace."""
    # Use a fixed namespace UUID (version 5, SHA-1)
    # This is a randomly generated UUID that we'll use as our namespace
    NAMESPACE_UUID = uuid.UUID('fb7eec39-2d36-4c2f-a6b7-87568c8976b2')
    # Generate a UUID using the course ID string
    return str(uuid.uuid5(NAMESPACE_UUID, str(id_str)))

def handle_moochub_data(page=1, per_page=25):
    try:
        # Use the existing EduHubClient
        eduhub_client = EduHubClient()
        
        # Get environment and storage configuration
        env = os.getenv('ENVIRONMENT', 'development')
        bucket_name = os.getenv('BUCKET_NAME', 'emulated-bucket')
        storage_port = os.getenv('LOCAL_STORAGE_PORT', '4001')
        
        # Use environment variable for base URL and ensure it's a complete IRI
        api_base_url = os.getenv('API_BASE_URL', 'https://localhost')
        base_url = f"https://api-{api_base_url.replace('https://', '')}/moochub"
        
        query = """query {
            Course(where: {_and: {published: {_eq: true}, Program: {published: {_eq: true}}}}) {
                id
                title
                tagline
                coverImage
                language
                ects
                weekDay
                startTime
                endTime
                applicationEnd
                learningGoals
                headingDescriptionField1
                contentDescriptionField1
                headingDescriptionField2
                contentDescriptionField2
                Program {
                    id
                    shortTitle
                }
                CourseLocations {
                    id
                    locationOption
                }
            }
        }"""

        # Query using existing client
        courses = eduhub_client.send_query(query, variables=None)
        
        if not isinstance(courses, dict) or "data" not in courses:
            return {'error': 'Failed to fetch data from EduHub'}, 500

        # Filter courses
        courses["data"]["Course"] = [
            course for course in courses["data"]["Course"]
            if course["Program"]["shortTitle"] not in ["EVENTS", "DEGREES"]
        ]

        # Transform to MOOCHub schema
        transformed_data = []
        for course in courses["data"]["Course"]:
            # Determine courseMode - "online" if ONLINE exists, otherwise "onsite"
            course_mode = ["online"] if any(
                loc["locationOption"] == "ONLINE" 
                for loc in course["CourseLocations"]
            ) else ["onsite"]
            
            attributes = {
                "name": course["title"],
                "courseCode": str(course["id"]),
                "learningResourceType": {
                    "identifier": "https://w3id.org/kim/hcrt/course",
                    "type": "Concept",
                    "inScheme": "https://w3id.org/kim/hcrt/scheme"
                },
                "courseMode": course_mode,
                "inLanguage": [course["language"].lower()],
                "startDate": [f"{course['applicationEnd']}T00:00:00Z"] if course["applicationEnd"] else None,
                "url": f"{api_base_url}/course/{course['id']}",
                "description": "\n".join(filter(None, [
                    course["headingDescriptionField1"],
                    course["contentDescriptionField1"],
                    course["headingDescriptionField2"],
                    course["contentDescriptionField2"]
                ])),
                "publisher": {
                    "name": "opencampus.sh",
                    "type": "Organization",
                    "url": "https://edu.opencampus.sh"
                },
                "license": [{
                    "identifier": "CC-BY-NC-4.0",
                    "url": "https://creativecommons.org/licenses/by-nc/4.0/legalcode.en",
                    "contentUrl": None
                }],
                "creator": [{
                    "name": "opencampus.sh",
                    "type": "Organization",
                    "url": "https://edu.opencampus.sh"
                }]
            }
            
            if course["coverImage"]:
                # Construct URL based on environment
                image_url = (
                    f"http://localhost:{storage_port}/{bucket_name}/{course['coverImage']}"
                    if env == "development"
                    else f"https://storage.googleapis.com/{bucket_name}/{course['coverImage']}"
                )
                attributes["image"] = {
                    "description": "© Jan Konitzki / opencampus.sh",
                    "type": "ImageObject",
                    "contentUrl": image_url,
                    "license": [{
                        "identifier": "proprietary",
                        "url": None,
                        "contentUrl": None
                    }]
                }
            
            transformed_course = {
                "id": generate_uuid_from_id(course["id"]),
                "type": "Course",
                "attributes": attributes
            }
            
            # Convert learning goals to teaches array
            if course["learningGoals"]:
                goals = [goal.strip() for goal in course["learningGoals"].split('\n') if goal.strip()]
                transformed_course["attributes"]["teaches"] = [{
                    "name": [{
                        "inLanguage": course["language"].lower(),
                        "name": goal
                    }],
                    "educationalFramework": "GRETA",
                    "educationalFrameworkVersion": "1.0"
                } for goal in goals]
            
            transformed_data.append(transformed_course)

        # Implement pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_data = transformed_data[start_idx:end_idx]
        total_pages = (len(transformed_data) + per_page - 1) // per_page

        
        moochub_response = {
            "links": {
                "self": f"{base_url}?page={page}&per_page={per_page}",
                "first": f"{base_url}?page=1&per_page={per_page}",
                "last": f"{base_url}?page={total_pages}&per_page={per_page}",
            },
            "data": paginated_data,
            "meta": {
                "totalPages": total_pages,
                "totalItems": len(transformed_data)
            }
        }

        # Add next/prev links if applicable
        if page < total_pages:
            moochub_response["links"]["next"] = f"{base_url}?page={page + 1}&per_page={per_page}"
        if page > 1:
            moochub_response["links"]["prev"] = f"{base_url}?page={page - 1}&per_page={per_page}"
            
        return moochub_response
            
    except Exception as e:
        logging.error(f"Error in handle_moochub_data: {str(e)}")
        return {'error': str(e)}, 500

def validate_pagination(page, per_page):
    try:
        page = int(page)
        per_page = int(per_page)
        if page < 1 or per_page < 1 or per_page > 100:
            return False
        return True
    except (ValueError, TypeError):
        return False

def handle_request(request):
    # Get client IP
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return ('', 204, get_cors_headers())

    # Check rate limit
    if not check_rate_limit(client_ip):
        return (jsonify({
            'error': 'Rate limit exceeded',
            'details': f'Maximum {RATE_LIMIT} requests per hour'
        }), 429, get_cors_headers())

    # Basic request logging
    logging.info(f"Request from {client_ip}: {request.method} {request.path}")

    # Version handling
    requested_version = request.headers.get('Accept-Version', '3.0.1')
    if requested_version not in ['3.0.1', '3.0.0']:
        return (jsonify({'error': 'Unsupported API version'}), 406, get_cors_headers())

    path = request.path.strip('/').split('/')[0]
    
    if path == 'moochub':
        # Validate pagination parameters
        page = request.args.get('page', 1)
        per_page = request.args.get('per_page', 25)
        if not validate_pagination(page, per_page):
            return (jsonify({'error': 'Invalid pagination parameters'}), 400, get_cors_headers())
            
        result = handle_moochub_data(int(page), int(per_page))
        if isinstance(result, tuple):
            data, status = result
            return (jsonify(data), status, get_cors_headers())
        return (jsonify(result), 200, get_cors_headers())
    
    return (jsonify({'error': 'Not found'}), 404, get_cors_headers())
