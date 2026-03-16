# Formbricks Integration - Implementation Summary

## ✅ Implementation Complete

All phases of the Formbricks integration have been successfully implemented. This document summarizes what was created and what needs to be done next.

---

## 📁 Files Created

### Backend

1. **Database Migrations**
   - `backend/migrations/default/1767001288636_add_formbricks_to_course/up.sql` (modified: renamed to formbricksEnrollmentSurveyUrl)
   - `backend/migrations/default/1767001288636_add_formbricks_to_course/down.sql` (modified)
   - `backend/migrations/default/1767053790862_add_program_default_formbricks_enrollment_survey/up.sql` (new)
   - `backend/migrations/default/1767053790862_add_program_default_formbricks_enrollment_survey/down.sql` (new)

2. **Backend Function**
   - `functions/callNodeFunction/getFormbricksResponses/index.js`

3. **Hasura Metadata**
   - Updated `backend/metadata/databases/default/tables/public_Course.yaml` (renamed formbricksSurveyUrl to formbricksEnrollmentSurveyUrl)
   - Updated `backend/metadata/databases/default/tables/public_Program.yaml` (added defaultFormbricksEnrollmentSurveyUrl)
   - Updated `backend/metadata/actions.graphql`
   - Updated `backend/metadata/actions.yaml`

### Frontend

1. **Components**
   - `frontend-nx/apps/edu-hub/components/common/FormbricksSurveyEmbed.tsx`
   - `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/DescriptionTab/FormbricksSurveyConfig.tsx`
   - `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/ApplicationsTab/FormbricksResponsesDisplay.tsx`

2. **Updated Components**
   - `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/DescriptionTab/index.tsx`
   - `frontend-nx/apps/edu-hub/components/pages/CourseContent/Registration/RegistrationModal.tsx`
   - `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/ApplicationsTab/index.tsx`

3. **GraphQL**
   - Updated `frontend-nx/apps/edu-hub/queries/courseFragment.ts` (renamed formbricksSurveyUrl to formbricksEnrollmentSurveyUrl in all fragments)
   - Updated `frontend-nx/apps/edu-hub/queries/programFragment.ts` (added defaultFormbricksEnrollmentSurveyUrl to fragments)
   - Updated `frontend-nx/apps/edu-hub/queries/updateProgram.ts` (added UPDATE_DEFAULT_ENROLLMENT_SURVEY mutation)

4. **Translations**
   - Updated `frontend-nx/apps/edu-hub/locales/de.json`
   - Updated `frontend-nx/apps/edu-hub/locales/en.json`

---

## 🔧 Next Steps

### 1. Run Database Migration

```bash
cd backend
# Apply the migration (adjust command based on your migration tool)
hasura migrate apply
# Or if using Hasura CLI:
hasura migrate apply --database-name default
```

### 2. Generate GraphQL Types

```bash
cd frontend-nx
# Run Apollo codegen to generate TypeScript types
GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo
# Or manually:
cd apps/edu-hub
rm -rf queries/__generated__/*
GRAPHQL_URI=http://localhost:8080/v1/graphql ../../node_modules/apollo/bin/run client:codegen --includes "./queries/**/*.ts" --target typescript
```

This will generate:
- `queries/__generated__/UpdateCourseFormbricksSurvey.ts`
- `queries/__generated__/GetFormbricksResponses.ts`

### 3. Configure Environment Variables

#### For Local Development (Docker Compose)

1. **Create `.env` file** in the project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add your Formbricks credentials:
   ```bash
   FORMBRICKS_API_URL=https://your-formbricks-instance.com
   FORMBRICKS_API_KEY=fb_prod_your_api_key_here
   ```

3. **Docker Compose will automatically load** these variables when you run `docker compose up`

#### For Production/Staging (Terraform)

Add these variables to your Terraform workspace:
```hcl
formbricks_api_url = "https://your-formbricks-instance.com"
formbricks_api_key = "fb_prod_your_api_key_here"
```

**To get your API key:**
1. Log in to Formbricks
2. Go to Settings → Organization → API Keys
3. Click "Add API Key"
4. Set permission to "read" for your project's production environment
5. Copy the key immediately (only shown once!)

**Note:** The `.env` file is gitignored and should never be committed. Use `.env.example` as a template.

### 4. Test the Integration

1. **Create a Formbricks Survey:**
   - Create a Link Survey in Formbricks
   - Enable Hidden Fields with IDs: `eduhubUserId`, `eduhubCourseId`, `eduhubEnrollmentId` (optional)
   - Publish and copy the survey URL

2. **Link Survey to Program (Optional - Default):**
   - Go to Manage Programs
   - Expand a program row
   - Find "Default Enrollment Survey URL" field (4th column in questionnaire section)
   - Paste the Formbricks survey URL
   - This will be used as default for all courses in the program

3. **Link Survey to Course (Optional - Override):**
   - Go to Manage Course → Description tab (or Manage Courses → expand course)
   - Find "Enrollment Questionnaire" section
   - Paste the Formbricks survey URL (or leave empty to use program default)
   - Save

4. **Test Registration:**
   - Register for a course that has a Formbricks survey configured
   - The survey should appear embedded in the registration modal
   - Complete the survey
   - Registration should auto-submit on completion

5. **Test Response Display:**
   - Go to Manage Course → Applications tab
   - Expand an enrollment row
   - Formbricks responses should appear instead of motivation letter

---

## 🐛 Troubleshooting

### GraphQL Types Missing

If you see TypeScript errors about missing types:
```bash
cd frontend-nx
GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo
```

### API Key Not Working

**Important**: When creating an API key in Formbricks, you must configure **project access** and **permissions**.

1. **Create/Edit an API Key in Formbricks:**
   - Go to Formbricks → Settings → Organization → API Keys
   - Click "Add API key" (or edit existing key)
   - **Configure Project Access:**
     - Select the **project** that contains your surveys
     - Select the **environment** (production/staging/development)
     - Set permission to at least **"read"** (or "write"/"manage" if you need to modify surveys)
   - **Configure Organization Access** (if needed):
     - Set organization-level permissions (read/write)
   - Copy the key (it should start with `fbk_`)

2. **Update your `.env` file:**
   ```bash
   FORMBRICKS_API_KEY=fbk_your_api_key_here
   ```

3. **Restart the node_functions container:**
   ```bash
   docker compose restart node_functions
   ```

4. **Test your API key:**
   ```bash
   # From host
   curl -H "x-api-key: $(docker compose exec -T node_functions printenv FORMBRICKS_API_KEY)" \
     "https://app.formbricks.com/api/v1/management/me"
   
   # Should return your organization info, not an error
   ```

5. **Common Issues:**
   - **"You can't use this method with this API key"**: The API key doesn't have access to the project/environment where your survey is located
   - **"Header not provided or API Key invalid"**: The API key format is wrong or the key doesn't exist
   - **401 Unauthorized**: The API key doesn't have "read" permission for the project/environment
   
   **Solution**: Edit your API key in Formbricks and ensure it has:
   - Access to the correct **project**
   - Access to the correct **environment** (production/staging/development)
   - At least **"read"** permission for that project/environment

### Survey Not Loading

- Check that the survey URL is correct
- Verify the survey is published in Formbricks
- Check browser console for iframe errors
- Ensure Formbricks instance allows iframe embedding

### Responses Not Showing

- Verify hidden fields are configured correctly in Formbricks
- Check backend logs for API errors
- Ensure FORMBRICKS_API_URL and FORMBRICKS_API_KEY are set correctly
- Verify API key has "read" permission

### GraphQL Action Not Found Error

If you see `field 'getFormbricksResponses' not found in type: 'query_root'`:

1. **Reload Hasura Metadata:**
   ```bash
   cd backend
   hasura metadata reload
   ```
   
   Or if using Hasura Console:
   - Open Hasura Console: `hasura console`
   - Go to "Actions" tab
   - Click "Reload Metadata" button

2. **Verify Action Configuration:**
   - Check that `backend/metadata/actions.yaml` contains `getFormbricksResponses` action
   - Check that `backend/metadata/actions.graphql` contains the query definition
   - Ensure the backend function exists at `functions/callNodeFunction/getFormbricksResponses/index.js`

3. **Restart Hasura:**
   ```bash
   docker compose restart hasura
   ```

---

## 📝 Notes

- **Field Naming**: The course-level field is now `formbricksEnrollmentSurveyUrl` (renamed from `formbricksSurveyUrl`) to indicate its purpose
- **Program Default**: Programs can have a `defaultFormbricksEnrollmentSurveyUrl` that serves as default for all courses in the program
- **Override Behavior**: Course-level URLs override program defaults (if a course has its own URL, it's used; otherwise the program default is used)
- **Backward Compatibility**: Courses without Formbricks surveys continue using the traditional motivation letter
- **Registration Types**: Formbricks surveys only replace motivation letters for courses with `APPROVAL_WITH_INPUT` or `DIRECT_WITH_INPUT` registration types
- **Auto-submit**: The survey completion event triggers automatic form submission
- **Response Fetching**: Responses are fetched on-demand when viewing applications (cached for performance)

---

## 🎉 Success Criteria

✅ Database migration applied  
✅ GraphQL types generated  
✅ Environment variables configured  
✅ Formbricks API key tested  
✅ Survey linked to course  
✅ Registration flow works with embedded survey  
✅ Responses display correctly in Applications tab  

---

## 📚 Documentation

Full implementation details are available in:
- `docs/FORMBRICKS_INTEGRATION_PLAN.md` - Complete technical plan
- This file - Quick reference and next steps

