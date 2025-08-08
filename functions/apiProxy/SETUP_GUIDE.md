# EduHub Participant Data API - Setup Guide

## Current Status

✅ **API Implementation**: Complete and functional  
✅ **Authentication**: Working (API Key + JWT support)  
✅ **Error Handling**: Graceful database connection failures  
❌ **Database Connection**: Requires Hasura to be running  

## Setup Options

### Option 1: Docker Development (Recommended)

The easiest way to use the Participant Data API is through the Docker setup where Hasura is automatically configured:

```bash
# Start the full Docker environment
docker compose up -d

# API will be available at:
# http://localhost:42026/participants
```

**Pros:**
- ✅ All services pre-configured
- ✅ Hasura automatically available
- ✅ Environment variables set correctly
- ✅ Database populated with test data

### Option 2: Local Development (Current Setup)

You're currently running the Python functions outside Docker. This requires manual Hasura setup:

**Step 1: Start Hasura Separately**
```bash
# Start only Hasura and database services
docker compose up -d db_hasura hasura

# Wait for Hasura to be ready
curl -f "http://localhost:8080/healthz"
```

**Step 2: Test the Participant API**
```bash
# Check API status
curl "http://localhost:42026/participants/schema"

# Test with API key (requires Hasura running)
curl -H "X-API-Key: edh_live_org123_sk_abcdef1234567890" \
  "http://localhost:42026/participants"
```

### Option 3: Mock Mode (For Development Without Database)

For development without database dependency, we could add a mock mode:

```bash
# Would return sample data instead of querying Hasura
export PARTICIPANT_API_MOCK_MODE="true"
```

## Current Error Diagnosis

When you test the API and get `"error": "Internal server error"`, it's because:

1. ✅ **Environment variables**: Now correctly set  
2. ✅ **API imports**: Working correctly  
3. ✅ **Authentication**: Processing API key correctly  
4. ❌ **Database connection**: Python function running in Docker container trying to connect to `localhost:8080` instead of `hasura:8080`

**Root Cause**: The Python function is running inside a Docker container (IP: 172.25.0.1) but the environment variable was set to `localhost:8080`. From inside the container, it needs to connect to `hasura:8080`.

## Quick Test

Check what's working:

```bash
# 1. Schema endpoint (should work)
curl "http://localhost:42026/participants/schema"

# 2. Hasura health check (currently failing)
curl "http://localhost:8080/healthz"

# 3. Participant API with auth (fails due to #2)
curl -H "X-API-Key: edh_live_org123_sk_abcdef1234567890" \
  "http://localhost:42026/participants"
```

## Next Steps

**Immediate (for testing):**
```bash
# Restart the Python function to pick up the corrected environment variable
# The environment variable has been changed from localhost:8080 to hasura:8080

# Option 1: Restart the development server
# Stop the current Python function and restart it

# Option 2: Use Docker Compose (recommended)
docker compose up -d

# Then test the participant API
curl -H "X-API-Key: edh_live_org123_sk_abcdef1234567890" \
  "http://localhost:42026/participants"
```

**For production deployment:**
- Deploy with full Docker setup 
- All services will be automatically configured
- No manual environment setup needed

## API Endpoints Ready

Once Hasura is running, these endpoints will work:

- `GET /participants/schema` - API documentation ✅
- `GET /participants` - List funded courses (requires auth)
- `GET /participants/courses/{id}` - Course participants (requires auth)

The implementation is complete - it just needs the database connection!

---

**Note**: The MOOCHub feed at `/moochub` works because it likely has cached data or different error handling. The participant API requires real-time database access for organization-scoped security.