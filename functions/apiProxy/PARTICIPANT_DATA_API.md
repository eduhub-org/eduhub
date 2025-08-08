# EduHub Participant Data API

## Overview

The EduHub Participant Data API provides third-party platforms with **participant enrollment and completion data** for courses funded by their organizations. This API follows the **European Learning Model (ELM) v3** specification for interoperability and supports secure, organization-scoped access to participant information.

This API is hosted as part of the existing `apiProxy` serverless function on Google Cloud Functions, alongside the MOOCHub feed.

## 🎯 Purpose

- **Participant Lists**: Get enrolled participants for courses
- **Completion Status**: Check who received attendance vs achievement certificates  
- **Organization Scoped**: Access only courses funded by your organization
- **ELM Compliant**: European Learning Model v3 data structure
- **Privacy Focused**: PII protection with configurable access levels

## 🔗 Endpoints

### Base URL
```
https://api-{your-domain}/participants
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/participants` | List organization's funded courses |
| `GET` | `/participants/courses/{course_id}` | Get participants for specific course |
| `GET` | `/participants/schema` | API schema documentation |

## 🔐 Authentication

### Option 1: API Key (Recommended for automation)
```bash
curl -X GET "https://api-eduhub.org/participants" \
  -H "X-API-Key: edh_live_org123_sk_abcdef1234567890"
```

### Option 2: JWT Bearer Token
```bash
curl -X GET "https://api-eduhub.org/participants" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Data Structure

### Organization Courses List

```bash
GET /participants
```

**Response Example:**
```json
{
  "@context": [
    "https://europa.eu/europass/elm/context/v3",
    "https://eduhub.org/context/participant-data/v1"
  ],
  "type": "CourseListReport",
  "id": "urn:report:org:123:2024-01-15T10:30:00Z",
  "provider": {
    "id": "did:web:eduhub.org",
    "name": "EduHub Learning Platform",
    "type": "EducationalOrganization"
  },
  "fundingOrganization": {
    "id": 123,
    "name": "Technology Foundation"
  },
  "courses": [
    {
      "id": 456,
      "title": "Advanced React Development",
      "description": "Comprehensive React.js course for developers",
      "startDate": "2024-02-01T09:00:00Z",
      "endDate": "2024-03-15T17:00:00Z",
      "creditPoints": [{"framework": "ECTS", "point": 6}],
      "participantDataEndpoint": "/participants/courses/456"
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z",
  "accessPermissions": {
    "organizationId": 123,
    "dataLevel": "basic"
  }
}
```

### Course Participants Data

```bash
GET /participants/courses/456
```

**Response Example:**
```json
{
  "@context": [
    "https://europa.eu/europass/elm/context/v3", 
    "https://eduhub.org/context/participant-data/v1"
  ],
  "type": "ParticipantDataReport",
  "id": "urn:report:course:456:2024-01-15T10:30:00Z",
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
    "id": "urn:course:456",
    "title": "Advanced React Development", 
    "description": "Comprehensive React.js course for developers",
    "type": "Course",
    "startDate": "2024-02-01T09:00:00Z",
    "endDate": "2024-03-15T17:00:00Z",
    "language": ["en"],
    "creditPoints": [{"framework": "ECTS", "point": 6}],
    "eqfLevel": 6,
    "fundingOrganization": {
      "id": 123,
      "name": "Technology Foundation"
    }
  },
  "participants": [
    {
      "id": "urn:hash:a1b2c3d4e5f6g7h8",
      "enrollmentStatus": "CONFIRMED",
      "enrollmentDate": "2024-01-10T14:30:00Z",
      "organization": {
        "id": 789,
        "name": "Tech Corp"
      },
      "completionStatus": {
        "hasAttended": true,
        "attendanceRate": 0.95,
        "hasAchievementCertificate": true,
        "hasAttendanceCertificate": true,
        "completionDate": "2024-03-15T16:00:00Z",
        "certificateIssuedDate": "2024-03-16T10:00:00Z"
      },
      "learningAchievements": [
        {
          "id": "urn:achievement:attendance:12345",
          "title": "Attendance Certificate - Advanced React Development",
          "type": "attendance",
          "issuanceDate": "2024-03-16T10:00:00Z"
        },
        {
          "id": "urn:achievement:completion:12345", 
          "title": "Achievement Certificate - Advanced React Development",
          "type": "achievement",
          "issuanceDate": "2024-03-16T10:00:00Z"
        }
      ]
    },
    {
      "id": "urn:hash:x9y8z7w6v5u4t3s2",
      "enrollmentStatus": "CONFIRMED", 
      "enrollmentDate": "2024-01-12T09:15:00Z",
      "organization": {
        "id": 790,
        "name": "Startup Inc"
      },
      "completionStatus": {
        "hasAttended": true,
        "attendanceRate": 0.85,
        "hasAchievementCertificate": false,
        "hasAttendanceCertificate": true,
        "completionDate": "2024-03-15T16:00:00Z",
        "certificateIssuedDate": "2024-03-16T10:00:00Z"
      },
      "learningAchievements": [
        {
          "id": "urn:achievement:attendance:12346",
          "title": "Attendance Certificate - Advanced React Development", 
          "type": "attendance",
          "issuanceDate": "2024-03-16T10:00:00Z"
        }
      ]
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z",
  "validUntil": "2024-01-16T10:30:00Z",
  "accessPermissions": {
    "organizationId": 123,
    "dataLevel": "basic",
    "includePII": false
  }
}
```

## 🛡️ Access Control

### Organization-Scoped Access
- Each API client can **only access courses funded by their organization**
- Funding relationships are managed through `CourseFundingOrganization` table
- No access to courses funded by other organizations

### Data Access Levels

| Level | Description | PII Access | Grade Access |
|-------|-------------|------------|--------------|
| **basic** | Enrollment status, certificates issued | ❌ | ❌ |
| **detailed** | Basic + participant names | ✅ | ❌ |
| **full** | Detailed + grades and assessments | ✅ | ✅ |

### Privacy Protection

**Basic Access** (Default):
```json
{
  "id": "urn:hash:a1b2c3d4e5f6g7h8",  // Hashed user ID
  "enrollmentStatus": "CONFIRMED",
  "completionStatus": {
    "hasAchievementCertificate": true,
    "hasAttendanceCertificate": true
  }
}
```

**Detailed Access** (PII permitted):
```json
{
  "id": "user-uuid-12345",
  "fullName": "Maria Schmidt",
  "email": "maria.schmidt@example.com",
  "enrollmentStatus": "CONFIRMED",
  "completionStatus": {
    "hasAchievementCertificate": true,
    "hasAttendanceCertificate": true
  }
}
```

## 🔧 Integration Examples

### Python Integration

```python
import requests

class EduHubParticipantAPI:
    def __init__(self, api_key, base_url="https://api-eduhub.org"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"X-API-Key": api_key}
    
    def get_funded_courses(self):
        """Get list of courses funded by your organization"""
        response = requests.get(
            f"{self.base_url}/participants",
            headers=self.headers
        )
        return response.json()
    
    def get_course_participants(self, course_id):
        """Get participants for a specific course"""
        response = requests.get(
            f"{self.base_url}/participants/courses/{course_id}",
            headers=self.headers
        )
        return response.json()
    
    def get_completion_summary(self, course_id):
        """Get summary of completion rates"""
        data = self.get_course_participants(course_id)
        participants = data.get('participants', [])
        
        total = len(participants)
        with_achievement = len([p for p in participants 
                              if p['completionStatus']['hasAchievementCertificate']])
        with_attendance = len([p for p in participants 
                             if p['completionStatus']['hasAttendanceCertificate']])
        
        return {
            'total_participants': total,
            'achievement_certificates': with_achievement,
            'attendance_certificates': with_attendance,
            'achievement_rate': with_achievement / total if total > 0 else 0,
            'attendance_rate': with_attendance / total if total > 0 else 0
        }

# Usage
api = EduHubParticipantAPI("edh_live_org123_sk_abcdef1234567890")

# Get your organization's courses
courses = api.get_funded_courses()
print(f"Found {len(courses['courses'])} funded courses")

# Get participants for a specific course
course_id = 456
participants = api.get_course_participants(course_id)
print(f"Course has {len(participants['participants'])} participants")

# Get completion summary
summary = api.get_completion_summary(course_id)
print(f"Achievement rate: {summary['achievement_rate']:.1%}")
```

### JavaScript/Node.js Integration

```javascript
class EduHubParticipantAPI {
  constructor(apiKey, baseUrl = 'https://api-eduhub.org') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-API-Key': this.apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getFundedCourses() {
    return this.request('/participants');
  }

  async getCourseParticipants(courseId) {
    return this.request(`/participants/courses/${courseId}`);
  }

  async getCompletionStats(courseId) {
    const data = await this.getCourseParticipants(courseId);
    const participants = data.participants || [];
    
    const stats = participants.reduce((acc, p) => {
      const status = p.completionStatus;
      if (status.hasAchievementCertificate) acc.achievement++;
      if (status.hasAttendanceCertificate) acc.attendance++;
      return acc;
    }, { achievement: 0, attendance: 0, total: participants.length });
    
    return {
      ...stats,
      achievementRate: stats.total > 0 ? stats.achievement / stats.total : 0,
      attendanceRate: stats.total > 0 ? stats.attendance / stats.total : 0
    };
  }
}

// Usage
const api = new EduHubParticipantAPI('edh_live_org123_sk_abcdef1234567890');

// Get completion statistics
api.getCompletionStats(456).then(stats => {
  console.log(`Achievement rate: ${(stats.achievementRate * 100).toFixed(1)}%`);
  console.log(`Attendance rate: ${(stats.attendanceRate * 100).toFixed(1)}%`);
});
```

## 🚀 Deployment

This API is integrated into the existing `apiProxy` Google Cloud Function:

### Function Structure
```
functions/apiProxy/
├── main.py                      # Main Cloud Function handler
├── participant_data_handler.py  # New participant data logic
├── api_clients/
│   └── eduhub_client.py        # Existing EduHub GraphQL client
└── requirements.txt
```

### Environment Variables

**For Docker Development (Recommended):**
```bash
# Already configured in docker-compose.yml
HASURA_ENDPOINT=http://hasura:8080/v1/graphql
HASURA_ADMIN_SECRET=myadminsecretkey
API_BASE_URL=http://localhost:42026
```

**For Local Development (Outside Docker):**
```bash
# Add to functions/start-python.env
export HASURA_ENDPOINT="http://localhost:8080/v1/graphql"
export HASURA_ADMIN_SECRET="myadminsecretkey"
export API_BASE_URL="http://localhost:42026"

# Rate limiting (shared with MOOCHub)
export RATE_LIMIT=60  # requests per hour
```

**For Production:**
```bash
HASURA_ENDPOINT=https://hasura.eduhub.org/v1/graphql
HASURA_ADMIN_SECRET=your-production-secret
API_BASE_URL=https://api-eduhub.org
```

### Deployment Command
```bash
# Deploy updated apiProxy function
gcloud functions deploy apiProxy \
  --runtime python39 \
  --trigger-http \
  --entry-point handle_request \
  --memory 512MB \
  --timeout 60s
```

## 📋 API Key Management

### API Key Format
```
edh_live_org{ORG_ID}_sk_{SECRET}
```

**Example:** `edh_live_org123_sk_abcdef1234567890`

### Database-Backed API Key Storage
API keys are now stored securely in the database:
- **Hash Storage**: Only SHA-256 hashes are stored, never plain text keys
- **Organization Scoped**: Each organization has one active API key
- **Secure Validation**: Keys are validated against database hashes
- **Revocation Support**: Keys can be revoked and regenerated

### API Key Generation (Admin Only)

#### Using the API Key Manager Script
```bash
# List all organizations and their API key status
python api_key_manager.py list

# Generate API key for organization ID 123
python api_key_manager.py generate --org-id 123

# Revoke API key for organization ID 123
python api_key_manager.py revoke --org-id 123
```

#### Programmatic Generation
```python
from participant_data_handler import generate_api_key
from api_clients.eduhub_client import EduHubClient

# Initialize client
eduhub_client = EduHubClient()

# Generate API key for organization
api_key = generate_api_key(organization_id=123, eduhub_client=eduhub_client)
print(f"Generated API key: {api_key}")
```

### API Key Security Features
- ✅ **Hash-based storage**: Plain text keys never stored in database
- ✅ **Organization isolation**: Each organization has unique key
- ✅ **Revocation capability**: Keys can be invalidated instantly
- ✅ **Audit trail**: All key operations are logged
- ✅ **Rate limiting**: Prevents abuse of API endpoints

## 🔍 Error Handling

### Common Error Responses

**Authentication Error:**
```json
{
  "error": "Missing authentication credentials",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Access Denied:**
```json
{
  "error": "Access denied: course not funded by your organization",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Course Not Found:**
```json
{
  "error": "Course not found",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Rate Limited:**
```json
{
  "error": "Rate limit exceeded",
  "details": "Maximum 60 requests per hour",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📈 Monitoring & Analytics

### Built-in Logging
- All API requests logged with client IP and organization
- Access patterns tracked for security monitoring
- Error rates monitored for system health

### Rate Limiting
- **60 requests per hour** per IP address (shared with MOOCHub)
- Configurable per organization if needed
- Graceful degradation with 429 responses

## 🔮 Future Enhancements

### Phase 1: Enhanced Authentication
- [ ] Database-backed API key validation
- [ ] JWT signature verification with Keycloak
- [ ] Granular permission management

### Phase 2: Advanced Features  
- [ ] Webhook notifications for completion status changes
- [ ] Batch export functionality
- [ ] Real-time participant status updates

### Phase 3: Full Certificate Integration
- [ ] Links to verifiable credential downloads
- [ ] Certificate verification endpoints
- [ ] EUDI Wallet integration

## 🤝 Support

- **Documentation**: [API Schema](https://api-eduhub.org/participants/schema)
- **Support Email**: api-support@eduhub.org
- **Status**: Monitoring available in Cloud Functions console

---

**Built for European education interoperability 🇪🇺**