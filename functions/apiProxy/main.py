import os
from flask import jsonify
import logging
from api_clients.eduhub_client import EduHubClient
from datetime import datetime
import markdown
from course_id_utils import generate_course_hash_id
try:
    from participant_data_handler import handle_participants_request, handle_participants_schema
except ImportError:
    # Fallback for when module is loaded from different context
    import sys
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    from participant_data_handler import handle_participants_request, handle_participants_schema
    from course_id_utils import generate_course_hash_id

# Rate limiting configuration - 100 requests per hour per IP
RATE_LIMIT = 60
RATE_WINDOW = 60  # 1 minute in seconds
request_counts = {}  # In-memory storage for rate limiting

# Hardcoded location address mapping
LOCATION_ADDRESS_MAPPING = {
    320: {
        "name": "Eventraum",
        "streetAddress": "Kuhnkestr. 6",
        "city": "Kiel",
        "description": "Starterkitchen by opencampus.sh"
    },
    321: {
        "name": "Konferenzraum",
        "streetAddress": "Kuhnkestr. 6",
        "city": "Kiel",
        "description": "Starterkitchen by opencampus.sh"
    },
    322: {
        "name": "Café",
        "streetAddress": "Legienstraße 40",
        "city": "Kiel",
        "description": "COBL by opencampus.sh"
    },
    323: {
        "name": "Loft",
        "streetAddress": "Legienstraße 40",
        "city": "Kiel",
        "description": "COBL by opencampus.sh"
    },
    324: {
        "name": "Club",
        "streetAddress": "Legienstraße 40",
        "city": "Kiel",
        "description": "COBL by opencampus.sh"
    },
    325: {
        "name": "FabLab",
        "streetAddress": "Fraunhoferstraße 2-4",
        "city": "Kiel",
        "description": "FabLab.SH by opencampus.sh"
    }
}

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
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'X-API-Version': '3.0.1',
        'X-Rate-Limit-Limit': str(RATE_LIMIT),
        'X-Rate-Limit-Window': str(RATE_WINDOW)
    }
    return headers

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
                    applicationStart
                }
                Sessions(order_by: { startDateTime: asc }) {
                    startDateTime
                    endDateTime
                }
                CourseLocations {
                    id
                    locationOption
                    defaultSessionAddressId
                    DefaultSessionAddress {
                        id
                        shortLabel
                        address
                        description
                    }
                }
                CourseGroups {
                    CourseGroupOption {
                        id
                        title
                        sliderGroup
                    }
                }
                CourseFundingOrganizations {
                    id
                    Organization {
                        id
                        name
                        description
                        type
                        logo
                        aliases
                    }
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

        # Transform to MOOCHub schema - one entry per course location
        transformed_data = []
        for course in courses["data"]["Course"]:
            # Collect metadata tags (sliderGroup = false)
            metadata_tags = []
            for group in course.get("CourseGroups", []):
                group_option = group.get("CourseGroupOption", {})
                if not group_option.get("sliderGroup"):
                    metadata_tags.append(group_option.get("title", ""))
            
            # Build HTML description
            description_parts = []
            if course["tagline"]:
                description_parts.append(f"<p>{course['tagline']}</p>")

            # Use English or German heading based on course language
            if course["learningGoals"]:
                learning_goals_heading = "Learning Goals:" if course["language"].lower() == "en" else "Lernziele:"
                description_parts.append(f"<h3>{learning_goals_heading}</h3>")
                
                # Split learning goals by newlines and create an HTML list
                goals = [goal.strip() for goal in course["learningGoals"].split('\n') if goal.strip()]
                if goals:
                    list_items = "".join([f"<li>{goal}</li>" for goal in goals])
                    description_parts.append(f"<ul>{list_items}</ul>")

            if course["headingDescriptionField1"]:
                description_parts.append(f"<h3>{course['headingDescriptionField1']}</h3>")
            if course["contentDescriptionField1"]:
                # Convert markdown to HTML
                html_content = markdown.markdown(course["contentDescriptionField1"])
                description_parts.append(html_content)

            if course["headingDescriptionField2"]:
                description_parts.append(f"<h3>{course['headingDescriptionField2']}</h3>")
            if course["contentDescriptionField2"]:
                # Convert markdown to HTML
                html_content = markdown.markdown(course["contentDescriptionField2"])
                description_parts.append(html_content)

            # Check for Digital Learning Campus funding organization to add keywords
            # Matches organization name or aliases that normalize to "DLC" or "DIGITAL LEARNING CAMPUS"
            has_dlc_funding = False
            for funding_org in course.get("CourseFundingOrganizations", []):
                organization = funding_org.get("Organization", {})
                
                # Normalize organization name
                org_name_normalized = organization.get("name", "").strip().upper()
                if org_name_normalized in ("DIGITAL LEARNING CAMPUS", "DLC"):
                    has_dlc_funding = True
                    break
                
                # Check aliases if present
                aliases = organization.get("aliases")
                if aliases and isinstance(aliases, list):
                    for alias in aliases:
                        alias_normalized = str(alias).strip().upper() if alias else ""
                        if alias_normalized in ("DIGITAL LEARNING CAMPUS", "DLC"):
                            has_dlc_funding = True
                            break
                    if has_dlc_funding:
                        break

            # Build start/end date arrays from all sessions (irregular series per MOOCHub schema)
            # Deduplicate by (start, end) pair - schema requires uniqueItems for startDate/endDate
            sessions = course.get("Sessions", [])
            seen_pairs = set()
            start_dates = []
            end_dates = []
            for s in sessions:
                pair = (s["startDateTime"], s["endDateTime"])
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    start_dates.append(s["startDateTime"])
                    end_dates.append(s["endDateTime"])
            start_dates = start_dates if start_dates else None
            end_dates = end_dates if end_dates else None

            # Format application dates for MOOCHub (date-only fields need time suffix)
            application_start = course.get("Program", {}).get("applicationStart")
            application_deadline = course.get("applicationEnd")
            application_start_date = (
                f"{application_start}T00:00:00Z" if application_start else None
            )
            application_deadline_str = (
                f"{application_deadline}T00:00:00Z" if application_deadline else None
            )

            # Create one entry per course location
            for location in course["CourseLocations"]:
                # Determine courseMode based on location
                course_mode = ["online"] if location["locationOption"] == "ONLINE" else ["onsite"]
                
                # Base attributes
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
                    "startDate": start_dates,
                    "endDate": end_dates,
                    "applicationStartDate": application_start_date,
                    "applicationDeadline": application_deadline_str,
                    "description": "".join(description_parts),
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
                
                # Add keywords for DLC Original courses (courses with Digital Learning Campus funding)
                if has_dlc_funding:
                    attributes["keywords"] = ["DLC-Original"]
                
                # Set URL based on location type with MOOCHub tracking parameters
                moochub_params = "source=moochub&provider=opencampus-sh&feed_version=3.0.1"
                attributes["url"] = f"{api_base_url}/course/{course['id']}?{moochub_params}"
                
                # Add contentLocation for onsite courses
                if location["locationOption"] != "ONLINE":
                    address_id = location.get("defaultSessionAddressId")
                    default_addr = location.get("DefaultSessionAddress") or {}
                    if address_id and address_id in LOCATION_ADDRESS_MAPPING:
                        location_data = LOCATION_ADDRESS_MAPPING[address_id]
                        attributes["contentLocation"] = {
                            "name": location_data["name"],
                            "address": {
                                "streetAddress": location_data["streetAddress"],
                                "city": location_data["city"],
                                "description": location_data["description"]
                            }
                        }
                    else:
                        safe_name = default_addr.get("shortLabel") or (
                            location.get("locationOption") or ""
                        ).title()
                        address_block = {
                            "city": (location.get("locationOption") or "").title()
                        }
                        if default_addr.get("address"):
                            address_block["streetAddress"] = default_addr["address"]
                        if default_addr.get("description"):
                            address_block["description"] = default_addr["description"]
                        if safe_name or address_block.get("streetAddress") or address_block.get(
                            "description"
                        ) or address_block.get("city"):
                            content_location = {"name": safe_name, "address": address_block}
                            attributes["contentLocation"] = content_location
                
                # Note: metadata_tags are collected but not included in the feed
                # They are used internally for determining funding and other custom attributes
                
                # Add funding information as custom attribute
                # This is a provider-specific extension to indicate course funding sources
                funding_organizations = []
                
                # Get funding organizations from CourseFundingOrganizations table
                for funding_org in course.get("CourseFundingOrganizations", []):
                    organization = funding_org.get("Organization", {})
                    if organization:
                        funding_org_data = {
                            "name": organization.get("name", ""),
                            "type": organization.get("type", "OTHER"),
                            "description": organization.get("description", "")
                        }
                        
                        # Add logo if available
                        if organization.get("logo"):
                            # Construct logo URL based on environment
                            logo_url = (
                                f"http://localhost:{storage_port}/{bucket_name}/{organization['logo']}"
                                if env == "development"
                                else f"https://storage.googleapis.com/{bucket_name}/{organization['logo']}"
                            )
                            funding_org_data["logo"] = {
                                "type": "ImageObject",
                                "contentUrl": logo_url
                            }
                        
                        funding_organizations.append(funding_org_data)
                
                # Add funding array if any organizations are found
                if funding_organizations:
                    attributes["funding"] = funding_organizations
                
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
                
                # Generate unique ID for this course-location combination
                transformed_course = {
                    "id": generate_course_hash_id(course['id'], location['id']),
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

def handle_moochub_schema():
    """Handle requests for MOOCHub schema documentation"""
    import json
    from pathlib import Path
    
    try:
        # Load the base MOOCHub schema from local copy
        schema_path = Path(__file__).parent / "moochub-schema.json"
        with open(schema_path, 'r') as f:
            base_schema = json.load(f)
        
        # Create a copy of the base schema to modify
        extended_schema = base_schema.copy()
        
        # Add our custom attributes to the course attributes properties
        if "properties" in extended_schema and "data" in extended_schema["properties"]:
            data_props = extended_schema["properties"]["data"]
            if "items" in data_props and "properties" in data_props["items"]:
                course_props = data_props["items"]["properties"]
                if "attributes" in course_props and "properties" in course_props["attributes"]:
                    # Add our custom attributes to the course attributes
                    course_props["attributes"]["properties"].update({
                        "funding": {
                            "type": "array",
                            "description": "Array of funding organizations supporting the course",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "description": "Name of the funding organization"
                                    },
                                    "type": {
                                        "type": "string",
                                        "description": "Organization type",
                                        "enum": ["UNIVERSITY", "RESEARCH_INSTITUTE", "PUBLIC_SECTOR", "NON_PROFIT_ORGANIZATION", "CORPORATION", "SCHOOL", "FREELANCER", "OTHER"]
                                    },
                                    "description": {
                                        "type": "string",
                                        "description": "Detailed description of the organization"
                                    },
                                    "logo": {
                                        "type": "object",
                                        "description": "Organization logo image",
                                        "properties": {
                                            "type": {
                                                "type": "string",
                                                "description": "Image object type"
                                            },
                                            "contentUrl": {
                                                "type": "string",
                                                "description": "URL to the logo image"
                                            }
                                        }
                                    }
                                },
                                "required": ["name", "type", "description"]
                            }
                        }
                    })
        
        # Create the response with integrated schema
        schema_response = {
            "provider": "opencampus.sh",
            "version": "1.0",
            "description": "Complete MOOCHub schema with opencampus.sh custom extensions integrated",
            "base_schema_url": "https://github.com/moochub/schema/releases/tag/v3.0.1",
            "schema_url": "/schemas/moochub-opencampus-extensions-v1.0.0.json",
            "schema_latest_url": "/schemas/moochub/latest.json",
            "custom_extensions": {
                "keywords": {
                    "type": "array",
                    "description": "Keywords array used to identify course characteristics. Courses with funding organization name or alias matching 'Digital Learning Campus' or 'DLC' (case-insensitive, normalized) are tagged with ['DLC-Original']. The stored keyword value is 'DLC-Original' regardless of whether the organization name uses the short form 'DLC' or the full form 'Digital Learning Campus'.",
                    "example": ["DLC-Original"]
                },
                "funding": {
                    "type": "array",
                    "description": "Array of funding organizations supporting the course",
                    "structure": {
                        "name": "string - Name of the funding organization",
                        "type": "string - One of: UNIVERSITY, RESEARCH_INSTITUTE, PUBLIC_SECTOR, NON_PROFIT_ORGANIZATION, CORPORATION, SCHOOL, FREELANCER, OTHER",
                        "description": "string - Detailed description of the organization",
                        "logo": "object - Organization logo with type and contentUrl (optional)"
                    },
                    "example": [
                        {
                            "name": "DLC",
                            "type": "PUBLIC_SECTOR",
                            "description": "Digital Learning Campus - A funding program for digital education initiatives",
                            "logo": {
                                "type": "ImageObject",
                                "contentUrl": "https://storage.googleapis.com/eduhub-bucket/organizations/dlc-logo.png"
                            }
                        }
                    ]
                }
            },
            "full_schema": extended_schema
        }
        
        return schema_response, 200
        
    except Exception as e:
        logging.error(f"Error loading schema: {str(e)}")
        return {'error': 'Failed to load schema documentation'}, 500

def validate_moochub_schema(feed_data):
    """
    Validate the MOOCHub feed data against the local schema
    """
    import json
    from jsonschema import validate, ValidationError
    from pathlib import Path
    
    try:
        # Load the local schema from local copy
        schema_path = Path(__file__).parent / "moochub-schema.json"
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        
        # Validate the feed data
        validate(instance=feed_data, schema=schema)
        print("✅ MOOCHub feed is valid according to schema v3.0.1")
        return True
        
    except ValidationError as e:
        print(f"❌ MOOCHub feed validation failed:")
        print(f"  - {e.message}")
        print(f"    Path: {' -> '.join(str(p) for p in e.path)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

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

    path_parts = request.path.strip('/').split('/')
    path = path_parts[0]
    
    # Top-level health endpoint (recommended standard)
    if path == 'health':
        db_status = 'unknown'
        hasura_config = 'missing'
        try:
            if os.getenv('HASURA_ENDPOINT') and os.getenv('HASURA_ADMIN_SECRET'):
                hasura_config = 'configured'
            # Try to initialize client (non-blocking check)
            try:
                _ = EduHubClient()
                db_status = 'connected'
            except ValueError as ve:
                # Likely missing config
                db_status = 'unconfigured' if 'HASURA' in str(ve) else 'error'
            except Exception:
                db_status = 'error'
        except Exception:
            db_status = 'error'

        health_payload = {
            'status': 'healthy' if db_status in ['connected', 'unconfigured'] else 'degraded',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'version': '3.0.1',
            'services': {
                'database': db_status,
                'hasura_config': hasura_config
            }
        }
        return (jsonify(health_payload), 200, get_cors_headers())

    # Serve static JSON schemas under /schemas
    if path == 'schemas':
        from pathlib import Path
        import json
        import re
        current_dir = os.path.dirname(os.path.abspath(__file__))
        schemas_dir = Path(current_dir) / 'schemas'
        filename = '/'.join(path_parts[1:])  # e.g., participant-data-v1.0.0.json or participant-data/latest.json

        # Index listing at /schemas: show all versioned schemas with metadata
        if not filename:
            try:
                candidates = list(schemas_dir.glob('*.json'))
                entries = []
                latest_map = {}
                # Compute latest per schema family (e.g., participant-data)
                family_versions = {}
                for p in candidates:
                    m = re.match(r'^(?P<family>.+)-v(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)\.json$', p.name)
                    if not m:
                        continue
                    family = m.group('family')
                    version = (int(m.group('major')), int(m.group('minor')), int(m.group('patch')))
                    family_versions.setdefault(family, []).append((version, p))
                # Determine latest per family
                for family, vers in family_versions.items():
                    latest_p = max(vers, key=lambda x: x[0])[1]
                    latest_map[family] = latest_p.name
                # Build entries with basic metadata
                for family, vers in family_versions.items():
                    for version, p in sorted(vers, key=lambda x: x[0], reverse=True):
                        try:
                            with open(p, 'r') as f:
                                data = json.load(f)
                            entries.append({
                                'name': p.name,
                                'family': family,
                                'version': f"{version[0]}.{version[1]}.{version[2]}",
                                'url': f"/schemas/{p.name}",
                                'id': data.get('$id'),
                                'latest': p.name == latest_map.get(family)
                            })
                        except Exception:
                            entries.append({
                                'name': p.name,
                                'family': family,
                                'version': f"{version[0]}.{version[1]}.{version[2]}",
                                'url': f"/schemas/{p.name}",
                                'id': None,
                                'latest': p.name == latest_map.get(family)
                            })
                payload = {
                    'schemas': entries,
                    'latest': { fam: f"/schemas/{fname}" for fam, fname in latest_map.items() }
                }
                return (jsonify(payload), 200, get_cors_headers())
            except Exception as e:
                logging.error(f"Failed to list schemas: {e}")
                return (jsonify({'error': 'Failed to list schemas'}), 500, get_cors_headers())

        # Handle latest pointer
        if filename in ['participant-data/latest.json', 'moochub/latest.json']:
            try:
                family = filename.split('/')[0]  # 'participant-data' or 'moochub'
                pattern = 'participant-data-v*.json' if family == 'participant-data' else 'moochub-*.json'
                candidates = list(schemas_dir.glob(pattern))
                versions = []
                for p in candidates:
                    if family == 'participant-data':
                        m = re.search(r'participant-data-v(\d+)\.(\d+)\.(\d+)\.json$', p.name)
                        if m:
                            versions.append(((int(m.group(1)), int(m.group(2)), int(m.group(3))), p.name))
                    else:
                        # Accept both moochub-vX.Y.Z.json and moochub-opencampus-extensions-vX.Y.Z.json
                        m = re.search(r'-v(\d+)\.(\d+)\.(\d+)\.json$', p.name)
                        if m:
                            versions.append(((int(m.group(1)), int(m.group(2)), int(m.group(3))), p.name))
                if not versions:
                    return (jsonify({'error': 'No schema versions available'}), 404, get_cors_headers())
                latest_name = max(versions, key=lambda x: x[0])[1]
                headers = get_cors_headers()
                headers['Location'] = f"/schemas/{latest_name}"
                return ('', 302, headers)
            except Exception as e:
                logging.error(f"Failed to resolve latest schema: {e}")
                return (jsonify({'error': 'Failed to resolve latest schema'}), 500, get_cors_headers())

        schema_path = schemas_dir / filename
        if schema_path.exists() and schema_path.is_file():
            try:
                with open(schema_path, 'r') as f:
                    data = json.load(f)
                headers = get_cors_headers()
                headers['Content-Type'] = 'application/schema+json; charset=utf-8'
                headers['Cache-Control'] = 'public, max-age=31536000, immutable'
                return (jsonify(data), 200, headers)
            except Exception as e:
                logging.error(f"Failed to load schema {schema_path}: {e}")
                return (jsonify({'error': 'Failed to load schema'}), 500, get_cors_headers())
        return (jsonify({'error': 'Schema not found'}), 404, get_cors_headers())

    if path == 'moochub':
        # Check if this is a schema request
        if len(path_parts) > 1 and path_parts[1] == 'schema':
            result = handle_moochub_schema()
            if isinstance(result, tuple):
                # Support (data, status) and (data, status, headers)
                if len(result) == 3:
                    data, status, extra_headers = result
                    headers = get_cors_headers()
                    headers.update(extra_headers)
                    return (jsonify(data), status, headers)
                else:
                    data, status = result
                    return (jsonify(data), status, get_cors_headers())
            return (jsonify(result), 200, get_cors_headers())
        
        # Regular feed request
        # Validate pagination parameters
        page = request.args.get('page', 1)
        per_page = request.args.get('per_page', 25)
        if not validate_pagination(page, per_page):
            return (jsonify({'error': 'Invalid pagination parameters'}), 400, get_cors_headers())
            
        result = handle_moochub_data(int(page), int(per_page))
        if isinstance(result, tuple):
            # Support (data, status) and (data, status, headers)
            if len(result) == 3:
                data, status, extra_headers = result
                headers = get_cors_headers()
                headers.update(extra_headers)
                return (jsonify(data), status, headers)
            else:
                data, status = result
                return (jsonify(data), status, get_cors_headers())
        return (jsonify(result), 200, get_cors_headers())
    
    elif path == 'participants':
        # Check if this is a schema request
        if len(path_parts) > 1 and path_parts[1] == 'schema':
            result = handle_participants_schema()
            if isinstance(result, tuple):
                # Support (data, status) and (data, status, headers)
                if len(result) == 3:
                    data, status, extra_headers = result
                    headers = get_cors_headers()
                    headers.update(extra_headers)
                    return (jsonify(data), status, headers)
                else:
                    data, status = result
                    return (jsonify(data), status, get_cors_headers())
            return (jsonify(result), 200, get_cors_headers())
        
        # Simple test endpoint first
        if len(path_parts) > 1 and path_parts[1] == 'test':
            return (jsonify({'status': 'participants endpoint working', 'path': request.path}), 200, get_cors_headers())
        
        # Handle participant data request
        try:
            result = handle_participants_request(request)
            if isinstance(result, tuple):
                # Support (data, status) and (data, status, headers)
                if len(result) == 3:
                    data, status, extra_headers = result
                    headers = get_cors_headers()
                    headers.update(extra_headers)
                    return (jsonify(data), status, headers)
                else:
                    data, status = result
                    return (jsonify(data), status, get_cors_headers())
            return (jsonify(result), 200, get_cors_headers())
        except Exception as e:
            print(f"DEBUG: Main handler error: {str(e)}")
            return (jsonify({'error': f'Handler error: {str(e)}'}), 500, get_cors_headers())
    
    return (jsonify({'error': 'Not found'}), 404, get_cors_headers())
