# Formbricks Integration Documentation

## Overview

EduHub integrates with [Formbricks](https://formbricks.com) to provide customizable enrollment questionnaires for courses. Formbricks surveys replace traditional motivation letters, offering a more structured and user-friendly experience with advanced question types and real-time response viewing.

## Key Features

- **Embedded Surveys**: Formbricks surveys are embedded directly in the registration modal via iframe
- **Hidden Fields**: User ID, Course ID, and Enrollment ID are passed as hidden fields to correlate responses
- **Auto-submission**: Registration automatically completes when the survey is submitted
- **Program Defaults**: Programs can set a default enrollment survey URL that applies to all courses
- **Course Overrides**: Individual courses can override the program default with their own survey URL
- **Response Display**: Course managers can view survey responses in the Applications tab
- **Backward Compatible**: Courses without Formbricks surveys continue using the traditional motivation letter

## Architecture

### Frontend Components

#### 1. `FormbricksSurveyEmbed.tsx`
Embeds a Formbricks survey via iframe with hidden field passthrough.

**Props:**
- `surveyUrl`: The Formbricks survey URL
- `userId`: EduHub user ID (UUID)
- `courseId`: EduHub course ID
- `enrollmentId`: Optional enrollment ID (created after survey completion during registration)
- `onComplete`: Callback fired when survey is completed
- `onError`: Optional error handler
- `className`: Optional CSS classes

**Features:**
- Automatically appends hidden fields to survey URL with `eduhub*` prefix
- Listens for `formbricksSurveyCompleted` postMessage event
- Shows loading spinner while survey loads
- Error handling with user-friendly error messages
- Security: Validates message origin to prevent XSS attacks

**Usage Example:**
```typescript
<FormbricksSurveyEmbed
  surveyUrl={effectiveSurveyUrl}
  userId={userId}
  courseId={course.id}
  onComplete={() => {
    // Handle survey completion
    console.log('Survey completed!');
  }}
  onError={(error) => {
    console.error('Survey error:', error);
  }}
/>
```

#### 2. `FormbricksResponsesDisplay.tsx`
Displays survey responses for an enrollment in the Applications tab.

**Props:**
- `courseId`: Course ID
- `userId`: User ID
- `enrollmentId`: Optional enrollment ID
- `formbricksEnrollmentSurveyUrl`: Survey URL to fetch responses from

**Features:**
- Fetches responses via GraphQL action `getFormbricksResponses`
- Shows loading state with spinner
- Displays question headlines and answers
- Shows survey name
- Indicates incomplete responses with warning icon
- Graceful fallback if no responses found

#### 3. `RegistrationModal.tsx`
Modified to support Formbricks surveys during enrollment.

**Key Changes:**
- Detects if course has a Formbricks survey configured (course-level or program default)
- Shows `FormbricksSurveyEmbed` instead of motivation letter textarea
- Auto-submits registration when survey is completed
- Hides submit button when using Formbricks (auto-submit only)
- Maintains backward compatibility with traditional motivation letters

### Backend Components

#### 1. GraphQL Action: `getFormbricksResponses`
Fetches survey responses from Formbricks API.

**Input:**
```graphql
{
  courseId: Int!
  userId: uuid!
  enrollmentId: Int
  formbricksSurveyUrl: String!
}
```

**Output:**
```graphql
{
  success: Boolean!
  error: String
  responses: [FormbricksResponse!]
  survey: FormbricksSurvey
}
```

**Implementation:**
- Located in `functions/callNodeFunction/getFormbricksResponses/index.js`
- Extracts survey ID and base URL from survey URL
- Fetches survey structure and responses from Formbricks API
- Filters responses by hidden fields (userId, courseId, enrollmentId)
- Transforms responses to include question labels
- Sorts responses by creation date (newest first)

**Hidden Field Matching:**
- `eduhubUserId`: Must match
- `eduhubCourseId`: Must match
- `eduhubEnrollmentId`: Optional (enrollment created after survey during registration)

#### 2. Database Schema

**Course Table:**
- `formbricksEnrollmentSurveyUrl`: Optional text field for course-specific survey URL

**Program Table:**
- `defaultFormbricksEnrollmentSurveyUrl`: Optional text field for program-wide default survey URL

**Resolution Logic:**
```typescript
const effectiveSurveyUrl = 
  course.formbricksEnrollmentSurveyUrl || 
  course.Program?.defaultFormbricksEnrollmentSurveyUrl || 
  null;
```

#### 3. Environment Variables

Required environment variables for backend function:

```bash
FORMBRICKS_API_KEY=fbk_your_api_key_here
```

The API URL is extracted automatically from the survey URL.

## Setup Guide

### 1. Configure Formbricks API Key

#### Development (Docker Compose)

1. Create `.env` file in project root:
   ```bash
   cp .env.example .env
   ```

2. Add Formbricks API key:
   ```bash
   FORMBRICKS_API_KEY=fbk_your_api_key_here
   ```

3. Restart containers:
   ```bash
   docker compose restart node_functions
   ```

#### Production (Terraform)

Add to Terraform workspace variables:
```hcl
formbricks_api_key = "fbk_your_api_key_here"
```

#### Getting an API Key

1. Log in to Formbricks
2. Go to **Settings → Organization → API Keys**
3. Click **"Add API key"**
4. Configure access:
   - Select the **project** containing your surveys
   - Select the **environment** (production/staging/development)
   - Set permission to at least **"read"**
5. Copy the key (starts with `fbk_`, shown only once!)

### 2. Create a Formbricks Survey

1. In Formbricks, create a **Link Survey** (not App Survey or Website Survey)
2. Add your questions (openText, multipleChoice, etc.)
3. **Enable Hidden Fields:**
   - Go to Survey Settings → Hidden Fields
   - Add these required fields:
     - `eduhubUserId` (required)
     - `eduhubCourseId` (required)
     - `eduhubEnrollmentId` (optional)
4. **Configure Completion:**
   - Enable "Send completion event" in Survey Settings
   - This triggers the `formbricksSurveyCompleted` postMessage
5. **Publish** the survey
6. Copy the survey URL (e.g., `https://app.formbricks.com/s/cm5w9u3jy0005jrq3g2a1b2c3`)

### 3. Link Survey to Program (Optional - Default)

1. Go to **Manage Programs** in EduHub
2. Expand a program row
3. Find **"Default Enrollment Survey URL"** field
4. Paste the Formbricks survey URL
5. Save

All courses in this program will now use this survey by default (unless overridden at course level).

### 4. Link Survey to Course (Optional - Override)

1. Go to **Manage Course → Description tab** (or **Manage Courses → expand course**)
2. Find **"Enrollment Questionnaire"** section
3. Paste the Formbricks survey URL (or leave empty to use program default)
4. Save

This course will now use this specific survey, overriding the program default.

## Testing the Integration

### Test Registration Flow

1. Ensure course has a survey configured (course-level or program default)
2. Go to course detail page
3. Click "Register" or "Apply"
4. Verify:
   - Survey loads in modal (not motivation letter textarea)
   - Hidden fields are passed (check survey URL in iframe src)
   - Survey questions appear correctly
5. Complete and submit survey
6. Verify:
   - Registration modal closes automatically
   - Enrollment is created in database
   - Success message appears

### Test Response Display

1. Go to **Manage Course → Applications tab**
2. Expand an enrollment row
3. Verify:
   - Survey responses appear instead of motivation letter
   - Question headlines are shown
   - Answers are formatted correctly
   - Survey name appears in header
   - Incomplete responses show warning icon

## Troubleshooting

### Survey Not Loading

**Symptoms:**
- Blank iframe or error message in registration modal
- Browser console shows iframe errors

**Solutions:**
1. Check survey URL is correct and survey is published
2. Verify survey is a **Link Survey** (not App or Website Survey)
3. Check Formbricks instance allows iframe embedding
4. Verify no CORS or CSP issues in browser console

### Responses Not Showing

**Symptoms:**
- "Error loading responses" message in Applications tab
- Backend logs show API errors

**Solutions:**
1. **Check API Key Permissions:**
   - Verify API key has access to the correct project/environment
   - Ensure API key has at least "read" permission
   - Test API key:
     ```bash
     curl -H "x-api-key: fbk_your_api_key_here" \
       "https://app.formbricks.com/api/v1/management/me"
     ```

2. **Check Hidden Fields:**
   - Verify survey has hidden fields configured: `eduhubUserId`, `eduhubCourseId`
   - Check survey URL includes hidden fields when loaded in iframe

3. **Check Backend Logs:**
   ```bash
   docker compose logs node_functions -f
   ```
   Look for errors from `getFormbricksResponses` function

4. **Verify Environment Variables:**
   ```bash
   docker compose exec node_functions printenv | grep FORMBRICKS
   ```

### API Key Errors

**Error: "You can't use this method with this API key"**
- The API key doesn't have access to the project/environment where your survey is
- **Solution:** Edit API key in Formbricks and add project/environment access

**Error: "Header not provided or API Key invalid"**
- The API key format is wrong or doesn't exist
- **Solution:** Regenerate API key and update `.env` file

**Error: "401 Unauthorized"**
- The API key doesn't have "read" permission
- **Solution:** Edit API key and set permission to "read" or higher

### GraphQL Action Not Found

**Error: `field 'getFormbricksResponses' not found in type: 'query_root'`**

**Solutions:**
1. Reload Hasura metadata:
   ```bash
   cd backend
   hasura metadata reload
   ```

2. Restart Hasura:
   ```bash
   docker compose restart hasura
   ```

3. Verify action files exist:
   - `backend/metadata/actions.yaml`
   - `backend/metadata/actions.graphql`
   - `functions/callNodeFunction/getFormbricksResponses/index.js`

## Security Considerations

### Origin Validation

The `FormbricksSurveyEmbed` component validates postMessage origin to prevent XSS attacks:

```typescript
const handleMessage = (event: MessageEvent) => {
  try {
    const surveyOrigin = new URL(surveyUrl).origin;
    if (event.origin !== surveyOrigin) return;
  } catch {
    // Fail-secure: reject message if origin can't be verified
    return;
  }
  // Process message...
};
```

### Hidden Field Prefix

Hidden fields use `eduhub*` prefix to avoid conflicts with Formbricks internal variables:
- `eduhubUserId`
- `eduhubCourseId`
- `eduhubEnrollmentId`

### API Key Security

- API keys are stored as environment variables, never committed to code
- `.env` file is gitignored
- API keys should have minimal permissions (read-only when possible)
- Use different API keys for different environments (dev/staging/prod)

## Translation Keys

All Formbricks-related text is internationalized. Key locations:

**Course namespace (`course`):**
- `formbricks.embed_error`: Error loading survey
- `formbricks.survey_title`: Iframe title for accessibility
- `formbricks.survey_completed`: Success message after completion
- `errors.complete_survey_first`: Validation error if trying to submit before survey completion

**Manage Course namespace (`manageCourse`):**
- `formbricks.loading_responses`: Loading state
- `formbricks.error_loading_responses`: Error state
- `formbricks.no_responses`: Empty state
- `formbricks.questionnaire_responses`: Section title
- `formbricks.incomplete_response`: Warning for unfinished surveys

## Best Practices

### Creating Surveys

1. **Use Link Surveys**: App/Website surveys won't work in iframe
2. **Keep surveys short**: Long surveys reduce completion rates
3. **Test before publishing**: Preview survey with hidden fields
4. **Enable completion events**: Required for auto-submission
5. **Use descriptive names**: Helps identify surveys in admin interface

### Managing Surveys

1. **Use program defaults**: Avoid duplicating same survey URL across courses
2. **Update carefully**: Changing survey URL affects all existing enrollments
3. **Archive old surveys**: Keep Formbricks clean by archiving unused surveys
4. **Monitor response rates**: Check Formbricks analytics

### Development

1. **Test with real surveys**: Mock surveys may not have completion events
2. **Check browser console**: Useful for debugging iframe/postMessage issues
3. **Use cache-first**: Responses are cached for performance
4. **Handle all states**: Loading, error, empty, success
5. **Validate hidden fields**: Ensure they're passed correctly

## Limitations

- **Enrollment ID**: Not available during registration (enrollment created after survey)
- **No editing**: Users can't edit responses after submission (Formbricks limitation)
- **Single response**: Only the latest response is shown (oldest responses ignored)
- **Network dependency**: Requires internet connection to load Formbricks instance
- **Iframe restrictions**: Some browser extensions may block iframes

## Future Enhancements

Potential improvements:
- Multiple survey responses per enrollment
- Response editing capability
- Offline survey support
- Custom survey templates
- Survey response analytics
- Conditional survey logic based on course type
- Pre-filled responses from user profile

## Related Documentation

- `docs/FORMBRICKS_IMPLEMENTATION_SUMMARY.md`: Implementation details and next steps
- `docs/FORMBRICKS_INTEGRATION_PLAN.md`: Original technical plan
- `.cursor/rules/formbricks-integration.mdc`: Development guidelines (Cursor rule)

