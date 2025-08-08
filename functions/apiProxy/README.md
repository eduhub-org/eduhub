### EduHub API Proxy (Participants API and MOOCHub Feed)

- Unified HTTP entrypoint for external integrations exposed by the `apiProxy` function
- Provides: MOOCHub course feed, and organization-scoped participant data
- Design goals: privacy-first (no PII), simple auth (API key), stable JSON responses

#### Endpoints
- Participants API
  - GET `/participants` — list courses funded for the authenticated organization
  - GET `/participants/courses/{course_id}` — participant data for a funded course
  - GET `/participants/schema` — brief schema/info and environment diagnostics
  - GET `/participants/test` — simple health check for the participants router
- MOOCHub feed
  - GET `/moochub` — MOOCHub course feed
    - Query: `page` (default 1), `per_page` (default 25, max 100)
  - GET `/moochub/schema` — MOOCHub schema with local extensions

#### Authentication
- Header: `X-API-Key: edh_live_org{orgId}_sk_{secret}`
- Header: `User-Agent` required
 - Optional: `Accept-Version: 3.0.1` (default if omitted)

#### Headers sent by API
- `Cache-Control: no-store`
- `X-Access-Level: basic`
- `X-Data-Retention: 24h`
- Security headers (CSP, HSTS, X-Frame-Options, etc.)

#### PII and data policy
- PII is not returned. Participant `id` is a stable hash.
- `occupationStatus` is included when available.
- Completion data only signals presence of certificates (no dates or rates).

#### Response examples
- List funded courses
```json
{
  "type": "CourseListReport",
  "id": "urn:report:org:353:2025-08-08T10:30:00Z",
  "provider": {
    "id": "did:web:edu.opencampus.sh",
    "name": "opencampus.sh",
    "type": "Nonprofit",
    "legalName": "Campus Business Box e.V.",
    "websiteUrl": "https://edu.opencampus.sh",
    "contactEmail": "team@opencampus.sh",
    "address": {
      "streetAddress": "Wissenschaftszentrum Kiel, Fraunhoferstr. 13",
      "postalCode": "24118",
      "locality": "Kiel",
      "country": "DE"
    }
  },
  "fundingOrganization": { "id": 353, "name": "…" },
  "courses": [
    { "id": 302, "title": "…", "participantDataEndpoint": "/participants/courses/302" }
  ],
  "generatedAt": "2025-08-08T10:30:00Z"
}
```

- Participants for a funded course
```json
{
  "type": "ParticipantDataReport",
  "id": "urn:report:course:302:2025-08-08T10:30:00Z",
  "provider": {
    "id": "did:web:edu.opencampus.sh",
    "name": "opencampus.sh",
    "type": "Nonprofit",
    "legalName": "Campus Business Box e.V.",
    "websiteUrl": "https://edu.opencampus.sh",
    "contactEmail": "team@opencampus.sh",
    "address": {
      "streetAddress": "Wissenschaftszentrum Kiel, Fraunhoferstr. 13",
      "postalCode": "24118",
      "locality": "Kiel",
      "country": "DE"
    }
  },
  "learningOpportunity": {
    "id": "urn:course:302",
    "title": "…",
    "summary": "…",
    "language": ["de"],
    "fundingOrganization": { "id": 353, "name": "…" }
  },
  "participants": [
    {
      "id": "urn:hash:…",
      "enrollmentStatus": "ENROLLED",
      "enrollmentDate": "2025-05-01T12:34:56Z",
      "occupationStatus": "STUDENT",
      "completionStatus": {
        "hasAchievementCertificate": false,
        "hasAttendanceCertificate": true
      }
    }
  ],
  "generatedAt": "2025-08-08T10:30:00Z"
}
```

#### Error responses
- 401 invalid/missing API key
- 403 course not funded by your organization
- 404 course not found
- 429 rate limit exceeded
- 503 DB/config unavailable

#### Example request
```bash
curl -s \
  -H "X-API-Key: edh_live_org353_sk_***" \
  -H "User-Agent: PartnerClient/1.0" \
  http://localhost:42026/participants/courses/302
```


