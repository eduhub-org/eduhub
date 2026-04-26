# MOOCHub Feed Implementation Documentation

## Overview

This document provides comprehensive documentation for the MOOCHub feed implementation in EduHub. The MOOCHub feed allows EduHub courses to be discoverable and accessible through the MOOCHub.org platform, following the MOOCHub schema v3.0.1.

## Table of Contents

1. [Architecture](#architecture)
2. [API Endpoints](#api-endpoints)
3. [Data Structure](#data-structure)
4. [Configuration](#configuration)
5. [Database Schema](#database-schema)
6. [Feed Generation Logic](#feed-generation-logic)
7. [Custom Attributes](#custom-attributes)
8. [Tracking and Analytics](#tracking-and-analytics)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

## Architecture

### Components

- **API Proxy** (`functions/apiProxy/main.py`): Handles MOOCHub feed requests
- **Flask App** (`functions/dev.py`): Serves the API proxy on port 42026
- **Database**: PostgreSQL with Hasura GraphQL layer
- **Course Data**: Stored in EduHub database with location and group information

### Flow

1. MOOCHub requests feed from `/moochub` endpoint
2. API proxy queries EduHub database via GraphQL
3. Data is transformed to MOOCHub schema format
4. Response includes pagination and metadata
5. Each course location generates a separate feed entry

## API Endpoints

### Production Endpoints

```
https://api.edu.opencampus.sh/moochub
https://api-edu.opencampus.sh/moochub
https://api.edu.opencampus.sh/moochub/schema
https://api-edu.opencampus.sh/moochub/schema
```

### Development Endpoints

```
http://localhost:42026/moochub
http://localhost:42026/moochub/schema
```

### Query Parameters

- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 25, max: 100)

### Example Request

```bash
curl "https://api.edu.opencampus.sh/moochub?page=1&per_page=10"
```

## Data Structure

### Feed Response Format

```json
{
  "links": {
    "self": "https://api.edu.opencampus.sh/moochub?page=1&per_page=25",
    "first": "https://api.edu.opencampus.sh/moochub?page=1&per_page=25",
    "last": "https://api.edu.opencampus.sh/moochub?page=1&per_page=25",
    "next": "https://api.edu.opencampus.sh/moochub?page=2&per_page=25"
  },
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "Course",
      "attributes": {
        "name": "Course Title",
        "courseCode": "123",
        "learningResourceType": {
          "identifier": "https://w3id.org/kim/hcrt/course",
          "type": "Concept",
          "inScheme": "https://w3id.org/kim/hcrt/scheme"
        },
        "courseMode": ["online"],
        "inLanguage": ["en"],
        "startDate": ["2024-03-15T09:00:00Z"],
        "endDate": ["2024-06-20T17:00:00Z"],
        "applicationStartDate": "2024-01-15T00:00:00Z",
        "applicationDeadline": "2024-03-10T00:00:00Z",
        "url": "https://edu.opencampus.sh/course/123?source=moochub&provider=opencampus-sh&feed_version=3.0.1",
        "description": "<p>Course description in HTML</p>",
        "publisher": {
          "name": "opencampus.sh",
          "type": "Organization",
          "url": "https://edu.opencampus.sh"
        },
        "license": [{
          "identifier": "CC-BY-NC-4.0",
          "url": "https://creativecommons.org/licenses/by-nc/4.0/legalcode.en",
          "contentUrl": null
        }],
        "creator": [{
          "name": "opencampus.sh",
          "type": "Organization",
          "url": "https://edu.opencampus.sh"
        }],
        "tags": ["DLC"],
        "learning_region": "KIEL",
        "learning_location": "Starterkitchen",
        "learning_zone": "Eventraum"
      }
    }
  ],
  "meta": {
    "totalPages": 5,
    "totalItems": 125
  }
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment (development/production) | `development` |
| `API_BASE_URL` | Base URL for course links | `https://localhost` |
| `BUCKET_NAME` | Storage bucket name | `emulated-bucket` |
| `LOCAL_STORAGE_PORT` | Local storage port | `4001` |

### Development Setup

```bash
# Optional integration secrets: repo root .env (see .env.example, Python serverless section)
export API_BASE_URL="http://localhost:42026"
export ENVIRONMENT="development"
export BUCKET_NAME="emulated-bucket"
export LOCAL_STORAGE_PORT="4001"
```

## Database Schema

### CourseGroupOption Table

```sql
CREATE TABLE "public"."CourseGroupOption" (
  "id" serial NOT NULL,
  "title" text NOT NULL,
  "order" integer NOT NULL,
  "sliderGroup" boolean DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
```

### Key Fields

- `sliderGroup`: Distinguishes UI slider groups (true) from metadata tags (false)
- `title`: Group option name (e.g., "DLC", "Starterkitchen", "COBL")

### CourseLocation Table

```sql
CREATE TABLE "public"."CourseLocation" (
  "id" serial NOT NULL,
  "courseId" integer NOT NULL,
  "locationOption" text NOT NULL,
  "defaultSessionAddress" text,
  PRIMARY KEY ("id")
);
```

### Location Options

- `ONLINE`: Online courses
- `KIEL`: Physical location in Kiel
- `HEIDE`: Physical location in Heide
- Other location options as needed

## Feed Generation Logic

### One Entry Per Location

Each course location generates a separate feed entry:

```python
# Create one entry per course location
for location in course["CourseLocations"]:
    # Generate unique ID for this course-location combination
    location_id = f"{course['id']}-{location['id']}"
    transformed_course = {
        "id": generate_uuid_from_id(location_id),
        "type": "Course",
        "attributes": attributes
    }
```

### Course Mode Determination

```python
# Determine courseMode based on location
course_mode = ["online"] if location["locationOption"] == "ONLINE" else ["onsite"]
```

### Date Field Mapping

The feed maps EduHub date fields to MOOCHub schema v3.0.1 as follows:

| MOOCHub Field | Type | EduHub Source |
|---------------|------|---------------|
| `startDate` | DateTimeSeries (array) | First `Session.startDateTime` (sessions ordered by startDateTime asc) |
| `endDate` | DateTimeSeries (array) | Last `Session.endDateTime` (sessions ordered by startDateTime asc) |
| `applicationStartDate` | NullableDateTime (single) | `Program.applicationStart` |
| `applicationDeadline` | NullableDateTime (single) | `Course.applicationEnd` |

- **startDate** and **endDate**: Derived from the course's sessions. If a course has no sessions, both are `null`.
- **applicationStartDate**: When the application/enrollment period begins (from the course's program).
- **applicationDeadline**: When the application/enrollment period ends (last day applications are accepted).

### Metadata Tag Collection

```python
# Collect metadata tags (sliderGroup = false)
metadata_tags = []
for group in course.get("CourseGroups", []):
    group_option = group.get("CourseGroupOption", {})
    if group_option.get("sliderGroup") == False:
        metadata_tags.append(group_option.get("title", ""))

# Add tags to attributes
if metadata_tags:
    attributes["tags"] = metadata_tags
```

## Custom Attributes

### Physical Location Attributes

For onsite courses, additional attributes are added:

- `learning_region`: Set to the `locationOption` value
- `learning_location`: "Starterkitchen" or "COBL" based on group options
- `learning_zone`: Specific zone within the location

### Funding Information

For courses with funding organizations, a funding attribute is added as an array of funding organizations:

```json
"funding": [
  {
    "name": "DLC",
    "type": "PUBLIC_SECTOR",
    "description": "Digital Learning Campus - A funding program for digital education initiatives"
  }
]
```

This custom field supports multiple funding organizations and provides detailed information about each funding source including:
- `name`: The name of the funding organization
- `type`: The organization type using EduHub's standardized `OrganizationType` values (e.g., "PUBLIC_SECTOR", "NON_PROFIT_ORGANIZATION", "CORPORATION", "RESEARCH_INSTITUTE")
- `description`: A detailed description of the funding organization

The organization types are standardized across EduHub and include: UNIVERSITY, RESEARCH_INSTITUTE, PUBLIC_SECTOR, NON_PROFIT_ORGANIZATION, CORPORATION, SCHOOL, FREELANCER, and OTHER.

The structure allows for multiple funding sources per course and provides comprehensive information about each funding organization.

### Learning Location Logic

```python
# Check for Starterkitchen or COBL
if "Starterkitchen" in group_titles:
    custom_attrs["learning_location"] = "Starterkitchen"
    # Check for Eventraum or Konferenzraum
    if "Eventraum" in group_titles:
        custom_attrs["learning_zone"] = "Eventraum"
    elif "Konferenzraum" in group_titles:
        custom_attrs["learning_zone"] = "Konferenzraum"
elif "COBL" in group_titles:
    custom_attrs["learning_location"] = "COBL"
    # Check for Café, Loft, or Club
    if "Café" in group_titles:
        custom_attrs["learning_zone"] = "Café"
    elif "Loft" in group_titles:
        custom_attrs["learning_zone"] = "Loft"
    elif "Club" in group_titles:
        custom_attrs["learning_zone"] = "Club"
```

## Tracking and Analytics

### URL Parameters

All course URLs include tracking parameters:

```
?source=moochub&provider=opencampus-sh&feed_version=3.0.1
```

### Parameters

- `source=moochub`: Identifies traffic from MOOCHub
- `provider=opencampus-sh`: Identifies the provider (URL-safe version)
- `feed_version=3.0.1`: MOOCHub schema version

### Analytics Usage

```javascript
// Check if user came from MOOCHub
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('source');
if (source === 'moochub') {
    // Track MOOCHub traffic
    analytics.track('moochub_visit');
}
```

## Deployment

### Production

The API is deployed as part of the EduHub infrastructure:

- **Container**: `eduhub-python-functions`
- **Port**: 42026 (internal)
- **External URLs**: `https://api.edu.opencampus.sh`, `https://api-edu.opencampus.sh`

### Development

```bash
# Start the development environment
docker compose up

# Access the API
curl "http://localhost:42026/moochub"
```

## Testing

### Manual Testing

```bash
# Test basic endpoint
curl "http://localhost:42026/moochub"

# Test with pagination
curl "http://localhost:42026/moochub?page=1&per_page=5"

# Test with headers
curl -H "Accept-Version: 3.0.1" "http://localhost:42026/moochub"
```

### Schema Validation

The feed output is validated against the MOOCHub schema v3.0.1 using the online JSON Schema validator:

**Online Validator**: [https://www.jsonschemavalidator.net/](https://www.jsonschemavalidator.net/)

#### Validation Process

1. **Get Schema**: The MOOCHub schema is located at `functions/callPythonFunction/pythonFunctions/moochub-schema.json`
2. **Get Feed Output**: Fetch actual feed data from the API
3. **Validate Online**: Use the online validator to check compliance

#### Example Validation

```bash
# Get sample feed output
curl -s "http://localhost:42026/moochub?page=1&per_page=1" > feed_sample.json

# Copy the schema content from moochub-schema.json
# Paste both into the online validator
```

#### What to Validate

- ✅ Required fields present (`name`, `learningResourceType`, `publisher`, `url`, `license`, `creator`)
- ✅ Proper data types and formats (UUID, IRI, etc.)
- ✅ Custom attributes as provider extensions
- ✅ Pagination structure
- ✅ CORS and rate limiting compliance

### Expected Response

- **Status**: 200 OK
- **Content-Type**: `application/vnd.api+json`
- **Headers**: Include CORS and rate limiting headers

### Schema Documentation

Custom attributes documentation is available via a separate schema endpoint:

```bash
# Get schema documentation
curl "http://localhost:42026/moochub/schema"
```

The schema endpoint returns the complete MOOCHub schema with custom extensions **integrated directly into the schema structure**:

```json
{
  "provider": "opencampus.sh",
  "version": "1.0",
  "description": "Complete MOOCHub schema with opencampus.sh custom extensions integrated",
  "base_schema_url": "https://github.com/moochub/schema/releases/tag/v3.0.1",
  "custom_extensions": {
    "learning_region": {
      "type": "string",
      "description": "Physical location region where the course takes place (only for onsite courses)", 
      "example": "KIEL"
    },
    "learning_location": {
      "type": "string",
      "description": "Specific learning location within the region (only for onsite courses)",
      "example": "Starterkitchen"
    },
    "learning_zone": {
      "type": "string",
      "description": "Specific zone within the learning location (only for onsite courses)",
      "example": "Eventraum"
    },
    "funding": {
      "type": "array",
      "description": "Array of funding organizations supporting the course",
      "structure": {
        "name": "string - Name of the funding organization",
        "type": "string - One of: UNIVERSITY, RESEARCH_INSTITUTE, PUBLIC_SECTOR, NON_PROFIT_ORGANIZATION, CORPORATION, SCHOOL, FREELANCER, OTHER",
        "description": "string - Detailed description of the organization"
      }
    }
  },
  "full_schema": {
    // Complete MOOCHub schema v3.0.1 with custom attributes integrated
    // Custom fields are added directly to the course attributes properties
  }
}
```

This true hybrid approach provides:
- **Integrated validation**: Custom fields are part of the actual schema structure
- **Complete documentation**: Both base schema and custom extensions documented
- **Validation ready**: Can validate feeds including custom attributes
- **Self-contained**: No need to fetch external schema files

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch data from EduHub"

**Cause**: Database connection or GraphQL query issues
**Solution**: 
- Check database connectivity
- Verify GraphQL endpoint is accessible
- Check if course data exists
- Apply migrations and load seed data

#### 2. "Empty reply from server"

**Cause**: Flask app not running properly
**Solution**:
```bash
docker restart eduhub-python-functions
```

#### 3. 404 Errors

**Cause**: Route not properly configured
**Solution**: Check Flask app configuration in `dev.py`

#### 4. Schema Validation Errors

**Cause**: Feed output doesn't match MOOCHub schema
**Solution**:
- Use online validator to identify specific errors
- Check required fields and data types
- Verify custom attributes are properly formatted

### Logs

Check container logs:
```bash
docker logs eduhub-python-functions --tail 50
```

### Health Check

```bash
# Check if API is responding
curl "http://localhost:42026/moochub?page=1&per_page=1"
```

## Schema Compliance

### MOOCHub Schema v3.0.1

The implementation follows the MOOCHub schema requirements:

- ✅ Required fields present
- ✅ Proper data types
- ✅ UUID generation
- ✅ Pagination support
- ✅ CORS headers
- ✅ Rate limiting

### Custom Extensions

Provider-specific attributes are added as extensions:

- `learning_region`: Physical location region
- `learning_location`: Specific learning location
- `learning_zone`: Zone within the location
- `funding`: Course funding information (for DLC-funded courses)

**Note**: Metadata tags are collected internally for determining funding and other custom attributes but are not included in the feed output.

## Future Enhancements

### Potential Improvements

1. **Caching**: Implement response caching for better performance
2. **Filtering**: Add support for filtering by language, location, etc.
3. **Search**: Implement full-text search capabilities
4. **Analytics**: Enhanced tracking and reporting
5. **Real-time Updates**: Webhook support for course updates

### Monitoring

- Track API response times
- Monitor error rates
- Log MOOCHub traffic patterns
- Measure conversion rates from MOOCHub

---

**Last Updated**: August 2025
**Version**: 1.0
**Maintainer**: EduHub Development Team 