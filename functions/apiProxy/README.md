### EduHub API Proxy (Participants API and MOOCHub Feed)

- Unified HTTP entrypoint for external integrations exposed by the `apiProxy` function
- Provides: MOOCHub course feed, and organization-scoped participant data
- Design goals: privacy-first (no PII), simple auth (API key), stable JSON responses

#### Endpoints
- Participants API
  - GET `/participants` — list courses funded for the authenticated organization (returns one course entry per location, each with a unique hash ID UUID)
  - GET `/participants/courses/{course_id}` — participant data for a funded course-location combination. Accepts hash ID (UUID) as primary format, or integer course ID for backward compatibility. When hash ID is used, participants are filtered by the specific location.
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

#### Course identification and location-based filtering
- **Hash IDs (UUIDs)** are the primary course identifier format, matching MOOCHub API
- Each course-location combination has a unique hash ID (UUID v5)
- Course listing returns **one entry per location** (not one per course)
- When requesting participants using a hash ID, results are filtered to the specific location
- Integer course IDs are accepted for backward compatibility but will use the first available location
- Hash IDs are generated from `course_id-location_id` combination

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
    "contactEmail": "edu@opencampus.sh",
    "address": {
      "streetAddress": "Wissenschaftszentrum Kiel, Fraunhoferstr. 13",
      "postalCode": "24118",
      "locality": "Kiel",
      "country": "DE"
    }
  },
  "fundingOrganization": { "id": 353, "name": "…" },
  "courses": [
    { "id": "39aa0df1-4936-5686-80a5-35d196a03520", "title": "…", "participantDataEndpoint": "/participants/courses/39aa0df1-4936-5686-80a5-35d196a03520" }
  ],
  "generatedAt": "2025-08-08T10:30:00Z"
}
```

- Participants for a funded course
```json
{
  "type": "ParticipantDataReport",
  "id": "urn:report:course:39aa0df1-4936-5686-80a5-35d196a03520:2025-08-08T10:30:00Z",
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
    "id": "urn:course:39aa0df1-4936-5686-80a5-35d196a03520",
    "title": "…",
    "summary": "…",
    "language": ["de"],
    "fundingOrganization": { "id": 353, "name": "…" }
  },
  "participants": [
    {
      "id": "urn:hash:…",
      "enrollmentStatus": "REGISTERED",
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
  http://localhost:42026/participants/courses/39aa0df1-4936-5686-80a5-35d196a03520
```

#### Development and Testing

The proxy listens on **`http://localhost:42026`** in development (see `functions/dev.py`). Pytest uses **`http://127.0.0.1:42026`** on purpose: on many Linux setups `localhost` resolves to IPv6 (`::1`) first while Docker publishes **42026** on IPv4 only, so tests would otherwise skip even when the container is up. Tests **skip** if nothing responds on **127.0.0.1:42026** (no failure, but nothing is exercised).

For the full local stack (PostgreSQL, Hasura, seed data), see [`docs/DEVELOPMENT_GUIDE.md`](../../docs/DEVELOPMENT_GUIDE.md). MOOCHub feed–specific examples live in [`docs/MOOCHUB_FEED_DOCUMENTATION.md`](../../docs/MOOCHUB_FEED_DOCUMENTATION.md).

##### 1. Start the Python functions stack

**Option A — Docker (recommended)**  
From the repository root, bring up services (including `python_functions`). The container installs both Python requirement files and runs `start-python.sh`, which starts `dev.py` (ports **42025** and **42026** mapped to the host):

```bash
docker compose up -d python_functions
```

Wait until the container is healthy, then open `http://localhost:42026/health`.

**Option B — Python on the host**  
`dev.py` loads `callPythonFunction` before starting the apiProxy app, so you need dependencies for **both** trees:

```bash
cd functions
python3 -m pip install -r callPythonFunction/requirements.txt -r apiProxy/requirements.txt
# On PEP 668–managed Python (e.g. many Linux distros), use a venv instead, or pass --break-system-packages if you accept the risk.
# Secrets (Zoom, LimeSurvey, …) live in the repo-root .env — copy from .env.example if needed
python3 dev.py
```

Leave this running in a terminal; you should see Flask serving **42025** (callPythonFunction) and **42026** (apiProxy).

##### 2. Automated tests (pytest)

Tests live in `functions/apiProxy/__tests__` and hit the live server (mainly **`GET /participants/schema`**). Install the apiProxy test/runtime deps if you have not already, then run pytest from the **apiProxy** directory:

```bash
cd functions/apiProxy
python3 -m pip install -r requirements.txt   # or use the same venv as above
python3 -m pytest -v
```

With the server up, you should see **13 passed**. If the server is down, all tests are **skipped**.

If everything is **skipped** but Docker is running, verify the port from the same machine: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:42026/health` (expect `200`). Use **`127.0.0.1`** here; `localhost` can fail while the service is still up (IPv4/IPv6 mismatch).

##### 3. Manual requests (curl)

Use the development API key for local calls:

**Development API Key:** `edh_live_org160_sk_056afe290cadf18e2b2d7482c5f4e5a5`

This key is configured in the development database seed data and is safe to use for local testing.

**Example development request:**
```bash
curl -X GET "http://localhost:42026/participants" \
  -H "X-API-Key: edh_live_org160_sk_056afe290cadf18e2b2d7482c5f4e5a5" \
  -H "User-Agent: EduHub-Client/1.0" \
  -H "Accept-Version: 3.0.1"
```

**Note:** The development API key only works against environments that use the dev seed data (typically local Docker or a dev database). For production access, contact the EduHub team to obtain a production API key.


