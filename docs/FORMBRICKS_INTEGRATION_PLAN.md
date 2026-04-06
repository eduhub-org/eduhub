# Formbricks Integration Plan for EduHub

## Overview

This document outlines the complete implementation plan for integrating Formbricks questionnaires into EduHub to replace/extend the motivation letter system for course applications.

## Quick Reference: Required Configuration

| Item | Value | Where to Find |
|------|-------|---------------|
| **FORMBRICKS_API_URL** | `https://your-formbricks.com` | Your Formbricks instance URL |
| **FORMBRICKS_API_KEY** | `fb_prod_xxx...` | Settings → Organization → API Keys |
| **Survey URL** | `https://your-formbricks.com/s/{id}` | Survey → Share → Copy URL |

**API Key Setup (in Formbricks):**
1. Go to **Settings** → **Organization** → **API Keys**
2. Click **Add API Key**
3. Set permission to **"read"** for your project's production environment
4. Copy the key immediately (only shown once!)

**Test the key:**
```bash
curl -H "x-api-key: YOUR_KEY" https://YOUR_FORMBRICKS_URL/api/v1/me
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              EduHub                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Course Settings (Admin/Instructor)                                     │
│  ├── New optional field: formbricksSurveyId                             │
│  └── UI to link/configure Formbricks survey                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Registration Flow (User)                                                │
│  ├── If course has formbricksSurveyId → embed Formbricks survey         │
│  │   └── Hidden fields: eduhubUserId, eduhubCourseId, eduhubEnrollmentId│
│  ├── If no survey → show traditional motivation letter input            │
│  └── Listen for formbricksSurveyCompleted event                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Applications Tab (Instructor)                                           │
│  ├── Fetch responses via Hasura action → Formbricks API                 │
│  └── Display structured answers in expandable enrollment row            │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Formbricks                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  Survey Editor: Admins design questionnaires                             │
│  Link Surveys: Embeddable via iframe with hidden fields                  │
│  Management API: GET /management/responses for fetching answers          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema Changes

### 1.1 Add Formbricks fields to Course table

**File:** `backend/migrations/default/TIMESTAMP_add_formbricks_to_course/up.sql`

```sql
-- Add Formbricks enrollment survey configuration to Course table
ALTER TABLE "public"."Course" 
ADD COLUMN "formbricksEnrollmentSurveyUrl" TEXT NULL;

COMMENT ON COLUMN "public"."Course"."formbricksEnrollmentSurveyUrl" IS 'Full URL to the Formbricks survey for course enrollment/application (for iframe embedding). Overrides program default if set.';

-- Add default Formbricks enrollment survey URL to Program table
ALTER TABLE "public"."Program" 
ADD COLUMN "defaultFormbricksEnrollmentSurveyUrl" TEXT NULL;

COMMENT ON COLUMN "public"."Program"."defaultFormbricksEnrollmentSurveyUrl" IS 'Default Formbricks survey URL for course enrollments/applications. Courses can override this with their own formbricksEnrollmentSurveyUrl.';
```

**File:** `backend/migrations/default/TIMESTAMP_add_formbricks_to_course/down.sql`

```sql
ALTER TABLE "public"."Course" 
DROP COLUMN IF EXISTS "formbricksEnrollmentSurveyUrl";

ALTER TABLE "public"."Program" 
DROP COLUMN IF EXISTS "defaultFormbricksEnrollmentSurveyUrl";
```

### 1.2 Optionally add response reference to CourseEnrollment

**File:** `backend/migrations/default/TIMESTAMP_add_formbricks_response_to_enrollment/up.sql`

```sql
-- Optional: Store Formbricks response ID in enrollment for direct lookup
ALTER TABLE "public"."CourseEnrollment" 
ADD COLUMN "formbricksResponseId" TEXT NULL;

COMMENT ON COLUMN "public"."CourseEnrollment"."formbricksResponseId" IS 'Formbricks response ID linking to the applicants questionnaire answers';
```

### 1.3 Update Hasura metadata

**File:** `backend/metadata/databases/default/tables/public_Course.yaml`

Add to `select_permissions` for all roles that need it:

```yaml
# Add this column to select_permissions for instructor_access, user_access, anonymous
- formbricksEnrollmentSurveyUrl
```

Add to `update_permissions` for `instructor_access`:

```yaml
# Add to update_permissions columns
- formbricksEnrollmentSurveyUrl
```

**File:** `backend/metadata/databases/default/tables/public_Program.yaml`

Add to `select_permissions` for all roles that need it:

```yaml
# Add this column to select_permissions for anonymous, instructor_access
- defaultFormbricksEnrollmentSurveyUrl
```

Add to `update_permissions` for admin (as appropriate for your deployment):

```yaml
# Add to update_permissions columns
- defaultFormbricksEnrollmentSurveyUrl
```

**File:** `backend/metadata/databases/default/tables/public_CourseEnrollment.yaml`

Add to relevant permissions:

```yaml
# Add to insert_permissions and select_permissions
- formbricksResponseId
```

---

## Phase 2: Backend - Hasura Action for Formbricks API

### 2.1 Create the Formbricks response fetching function

**File:** `functions/callNodeFunction/getFormbricksResponses/index.js`

```javascript
import fetch from 'node-fetch';

/**
 * Fetches Formbricks survey responses for a specific enrollment.
 * Uses hidden fields to correlate responses with EduHub data.
 * 
 * @param {Object} req - Request object containing body with courseId and userId
 * @param {Object} logger - Winston logger instance
 * @returns {Object} Formbricks response data or error
 */
const getFormbricksResponses = async (req, logger) => {
  const { courseId, userId, enrollmentId, formbricksSurveyId } = req.body.input || req.body;
  
  logger.info('Fetching Formbricks responses', { courseId, userId, enrollmentId, formbricksSurveyId });
  
  // Validate required inputs
  if (!formbricksSurveyId) {
    return {
      success: true,
      responses: [],
      survey: null,
      message: 'No Formbricks survey configured for this course'
    };
  }
  
  const formbricksApiUrl = process.env.FORMBRICKS_API_URL;
  const formbricksApiKey = process.env.FORMBRICKS_API_KEY;
  
  if (!formbricksApiUrl || !formbricksApiKey) {
    logger.error('Formbricks configuration missing');
    return {
      success: false,
      error: 'Formbricks not configured',
      messageKey: 'FORMBRICKS_NOT_CONFIGURED'
    };
  }
  
  try {
    // Fetch the survey structure first (to get question labels)
    const surveyResponse = await fetch(
      `${formbricksApiUrl}/api/v2/management/surveys/${formbricksSurveyId}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': formbricksApiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!surveyResponse.ok) {
      throw new Error(`Failed to fetch survey: ${surveyResponse.status}`);
    }
    
    const surveyData = await surveyResponse.json();
    
    // Fetch responses filtered by hidden fields
    // The userId is passed as 'eduhubUserId' hidden field when the survey is submitted
    // (We use 'eduhubUserId' instead of 'userId' to avoid conflict with Formbricks internal userId)
    const responsesUrl = new URL(`${formbricksApiUrl}/api/v2/management/responses`);
    responsesUrl.searchParams.append('surveyId', formbricksSurveyId);
    responsesUrl.searchParams.append('limit', '100');
    
    const responsesResponse = await fetch(responsesUrl.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': formbricksApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!responsesResponse.ok) {
      throw new Error(`Failed to fetch responses: ${responsesResponse.status}`);
    }
    
    const responsesData = await responsesResponse.json();
    
    // Filter responses by eduhub* hidden fields
    // Note: enrollmentId is optional because enrollment is created AFTER survey completion during registration
    const userResponses = responsesData.data.filter(response => {
      const hiddenFields = response.data?.hiddenFields || response.variables || {};
      const responseUserId = hiddenFields.eduhubUserId;
      const responseCourseId = hiddenFields.eduhubCourseId;
      const responseEnrollmentId = hiddenFields.eduhubEnrollmentId;
      
      // Must match userId and courseId (both required), enrollmentId is optional but helps with precision
      return responseUserId === userId && 
             responseCourseId === String(courseId) &&
             (!enrollmentId || responseEnrollmentId === String(enrollmentId));
    });
    
    // Transform responses to include question labels
    const blocks = surveyData.data?.blocks || [];
    const questions = blocks.flatMap(block => block.elements || []);
    
    const formattedResponses = userResponses.map(response => {
      const answers = [];
      
      for (const [questionId, answerValue] of Object.entries(response.data || {})) {
        // Skip hidden fields
        if (questionId === 'hiddenFields') continue;
        
        const question = questions.find(q => q.id === questionId);
        const headline = question?.headline?.default || question?.headline || questionId;
        
        answers.push({
          questionId,
          headline,
          answer: formatAnswer(answerValue),
          rawAnswer: answerValue
        });
      }
      
      return {
        id: response.id,
        createdAt: response.createdAt,
        finished: response.finished,
        answers
      };
    });
    
    logger.info('Successfully fetched Formbricks responses', { 
      count: formattedResponses.length 
    });
    
    return {
      success: true,
      responses: formattedResponses,
      survey: {
        id: surveyData.data?.id,
        name: surveyData.data?.name
      }
    };
    
  } catch (error) {
    logger.error('Error fetching Formbricks responses', { 
      error: error.message,
      stack: error.stack 
    });
    
    return {
      success: false,
      error: error.message,
      messageKey: 'FORMBRICKS_FETCH_ERROR'
    };
  }
};

/**
 * Formats answer values for display
 */
function formatAnswer(value) {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default getFormbricksResponses;
```

### 2.2 Register the function

**File:** `functions/callNodeFunction/index.js`

Add the import and registration:

```javascript
// Add import at top
import getFormbricksResponses from "./getFormbricksResponses/index.js";

// Add to functionMap
const functionMap = {
  // ... existing functions
  getFormbricksResponses,
};
```

### 2.3 Add Hasura Action

**File:** `backend/metadata/actions.graphql`

Add the GraphQL type definitions:

```graphql
type Query {
  getFormbricksResponses(
    courseId: Int!
    userId: uuid!
    enrollmentId: Int!
    formbricksSurveyId: String!
  ): GetFormbricksResponsesResult!
}

type GetFormbricksResponsesResult {
  success: Boolean!
  responses: [FormbricksResponse!]
  survey: FormbricksSurvey
  error: String
  messageKey: String
}

type FormbricksResponse {
  id: String!
  createdAt: String!
  finished: Boolean!
  answers: [FormbricksAnswer!]!
}

type FormbricksAnswer {
  questionId: String!
  headline: String!
  answer: String!
  rawAnswer: String
}

type FormbricksSurvey {
  id: String!
  name: String!
}
```

**File:** `backend/metadata/actions.yaml`

Add the action configuration:

```yaml
- name: getFormbricksResponses
  definition:
    kind: ""
    handler: '{{CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION}}'
    headers:
      - name: secret
        value_from_env: HASURA_CLOUD_FUNCTION_SECRET
      - name: name
        value: getFormbricksResponses
  permissions:
    - role: instructor_access
  comment: Fetches Formbricks survey responses for a course enrollment
```

---

## Phase 3: Frontend - Course Settings

### 3.1 Add Formbricks survey configuration UI

**File:** `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/SettingsTab/FormbricksSurveyConfig.tsx`

```tsx
import { FC, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { TextField, Button, IconButton, Tooltip, Alert } from '@mui/material';
import { MdOpenInNew, MdDelete, MdHelp } from 'react-icons/md';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { gql } from '@apollo/client';

const UPDATE_COURSE_FORMBRICKS_SURVEY = gql`
  mutation UpdateCourseFormbricksSurvey(
    $courseId: Int!
    $formbricksSurveyId: String
    $formbricksSurveyUrl: String
  ) {
    update_Course_by_pk(
      pk_columns: { id: $courseId }
      _set: { 
        formbricksSurveyId: $formbricksSurveyId
        formbricksSurveyUrl: $formbricksSurveyUrl
      }
    ) {
      id
      formbricksSurveyId
      formbricksSurveyUrl
    }
  }
`;

interface Props {
  courseId: number;
  formbricksSurveyId: string | null;
  formbricksSurveyUrl: string | null;
  onUpdate: () => void;
}

export const FormbricksSurveyConfig: FC<Props> = ({
  courseId,
  formbricksSurveyId,
  formbricksSurveyUrl,
  onUpdate,
}) => {
  const t = useTranslations('manageCourse');
  const [surveyUrl, setSurveyUrl] = useState(formbricksSurveyUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [updateSurvey, { loading }] = useRoleMutation(UPDATE_COURSE_FORMBRICKS_SURVEY);

  // Extract survey ID from Formbricks URL
  // URL format: https://formbricks.example.com/s/{surveyId}
  const extractSurveyId = useCallback((url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const sIndex = pathParts.indexOf('s');
      if (sIndex !== -1 && pathParts[sIndex + 1]) {
        return pathParts[sIndex + 1].split('?')[0];
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    
    if (!surveyUrl.trim()) {
      // Clear the survey
      await updateSurvey({
        variables: {
          courseId,
          formbricksSurveyId: null,
          formbricksSurveyUrl: null,
        },
      });
      setIsEditing(false);
      onUpdate();
      return;
    }

    const extractedId = extractSurveyId(surveyUrl);
    if (!extractedId) {
      setError(t('formbricks.invalid_url'));
      return;
    }

    await updateSurvey({
      variables: {
        courseId,
        formbricksSurveyId: extractedId,
        formbricksSurveyUrl: surveyUrl.trim(),
      },
    });
    
    setIsEditing(false);
    onUpdate();
  }, [surveyUrl, courseId, extractSurveyId, updateSurvey, onUpdate, t]);

  const handleClear = useCallback(async () => {
    await updateSurvey({
      variables: {
        courseId,
        formbricksSurveyId: null,
        formbricksSurveyUrl: null,
      },
    });
    setSurveyUrl('');
    onUpdate();
  }, [courseId, updateSurvey, onUpdate]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-medium text-gray-900">
          {t('formbricks.title')}
        </h3>
        <Tooltip title={t('formbricks.tooltip')}>
          <MdHelp className="text-gray-400 cursor-help" />
        </Tooltip>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        {t('formbricks.description')}
      </p>

      {formbricksSurveyId && !isEditing ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              {t('formbricks.survey_configured')}
            </p>
            <p className="text-xs text-green-600 truncate">
              {formbricksSurveyUrl}
            </p>
          </div>
          <Tooltip title={t('formbricks.open_survey')}>
            <IconButton
              size="small"
              onClick={() => window.open(formbricksSurveyUrl!, '_blank')}
            >
              <MdOpenInNew />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('formbricks.remove_survey')}>
            <IconButton size="small" onClick={handleClear}>
              <MdDelete className="text-red-500" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setIsEditing(true)}
          >
            {t('common.edit')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <TextField
            fullWidth
            size="small"
            label={t('formbricks.survey_url_label')}
            placeholder="https://formbricks.example.com/s/abc123..."
            value={surveyUrl}
            onChange={(e) => setSurveyUrl(e.target.value)}
            error={!!error}
            helperText={error || t('formbricks.survey_url_helper')}
          />
          <div className="flex gap-2">
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
            {isEditing && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setIsEditing(false);
                  setSurveyUrl(formbricksSurveyUrl || '');
                  setError(null);
                }}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
      )}

      <Alert severity="info" className="mt-4">
        {t('formbricks.info_hidden_fields')}
      </Alert>
    </div>
  );
};
```

### 3.2 Update GraphQL fragments

**File:** `frontend-nx/apps/edu-hub/queries/courseFragment.ts`

Add the Formbricks fields to the fragments:

```typescript
// Add to COURSE_FRAGMENT, ADMIN_COURSE_FRAGMENT, COURSE_FRAGMENT_MINIMUM, COURSE_FRAGMENT_ANONYMOUS
// Inside the fragment definition, add:
formbricksSurveyId
formbricksSurveyUrl
```

---

## Phase 4: Frontend - Registration Modal

### 4.1 Create FormbricksSurveyEmbed component

**File:** `frontend-nx/apps/edu-hub/components/common/FormbricksSurveyEmbed.tsx`

```tsx
import { FC, useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  surveyUrl: string;
  userId: string;
  courseId: number;
  enrollmentId?: number;
  onComplete: () => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Embeds a Formbricks survey via iframe with hidden field passthrough.
 * Listens for the formbricksSurveyCompleted event.
 */
export const FormbricksSurveyEmbed: FC<Props> = ({
  surveyUrl,
  userId,
  courseId,
  enrollmentId,
  onComplete,
  onError,
  className = '',
}) => {
  const t = useTranslations('course');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Build the survey URL with hidden fields
  const buildSurveyUrl = useCallback(() => {
    try {
      const url = new URL(surveyUrl);
      url.searchParams.set('embed', 'true');
      // Use eduhub* prefix to avoid conflicts with Formbricks internal variables
      url.searchParams.set('eduhubUserId', userId);
      url.searchParams.set('eduhubCourseId', String(courseId));
      if (enrollmentId) {
        // enrollmentId is optional because enrollment is created AFTER survey completion during registration
        url.searchParams.set('eduhubEnrollmentId', String(enrollmentId));
      }
      return url.toString();
    } catch {
      return surveyUrl;
    }
  }, [surveyUrl, userId, courseId, enrollmentId]);

  // Listen for survey completion event
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message origin matches Formbricks
      const surveyOrigin = new URL(surveyUrl).origin;
      if (event.origin !== surveyOrigin) return;

      if (event.data === 'formbricksSurveyCompleted') {
        onComplete();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [surveyUrl, onComplete]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.(t('formbricks.embed_error'));
  }, [onError, t]);

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-md">
        <p className="text-red-600">{t('formbricks.embed_error')}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
      <iframe
        src={buildSurveyUrl()}
        className="w-full h-full border-0 rounded-md"
        style={{ minHeight: '500px' }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={t('formbricks.survey_title')}
        allow="camera; microphone"
      />
    </div>
  );
};
```

### 4.2 Modify RegistrationModal

**File:** `frontend-nx/apps/edu-hub/components/pages/CourseContent/Registration/RegistrationModal.tsx`

Update to conditionally show Formbricks survey:

```tsx
import { FC, useState, useCallback, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { MdClose } from 'react-icons/md';
import { useTranslations } from 'next-intl';

import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';
import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { Button } from '../../../common/Button';
import { FormbricksSurveyEmbed } from '../../../common/FormbricksSurveyEmbed';
import { getRegistrationTypeConfig, RegistrationFormData, RegistrationResult } from './types';

interface RegistrationModalProps {
  visible: boolean;
  closeModal: () => void;
  course: Course_Course_by_pk;
  registrationType: CourseRegistrationType_enum;
  onSubmit: (formData: RegistrationFormData) => Promise<RegistrationResult>;
  isLoading: boolean;
  userId?: string; // Current user ID for Formbricks
}

export const RegistrationModal: FC<RegistrationModalProps> = ({
  visible,
  closeModal,
  course,
  registrationType,
  onSubmit,
  isLoading,
  userId,
}) => {
  const t = useTranslations('course');
  const [motivationLetter, setMotivationLetter] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formbricksSurveyCompleted, setFormbricksSurveyCompleted] = useState(false);

  const config = getRegistrationTypeConfig(registrationType);
  
  // Check if course has Formbricks survey configured
  const hasFormbricksSurvey = !!(course.formbricksSurveyId && course.formbricksSurveyUrl);
  const useFormbricks = hasFormbricksSurvey && config.requiresInput;

  const handleFormbricksComplete = useCallback(() => {
    setFormbricksSurveyCompleted(true);
    // Auto-submit the form after survey completion
    onSubmit({
      motivationLetter: '[Formbricks Survey Completed]',
      acceptTerms: true,
    }).then((result) => {
      if (result.success) {
        closeModal();
      } else {
        setError(result.error || t('errors.registration_failed'));
      }
    });
  }, [onSubmit, closeModal, t]);

  const handleSubmit = useCallback(async () => {
    // If using Formbricks and survey not completed, don't allow submit
    if (useFormbricks && !formbricksSurveyCompleted) {
      setError(t('errors.complete_survey_first'));
      return;
    }
    
    if (!useFormbricks && config.requiresInput && !motivationLetter.trim()) {
      setError(t('errors.motivation_letter_required'));
      return;
    }

    if (config.requiresPayment && !acceptTerms) {
      setError(t('errors.terms_required'));
      return;
    }

    setError(null);

    const result = await onSubmit({
      motivationLetter: motivationLetter.trim(),
      acceptTerms,
    });

    if (result.success) {
      closeModal();
    } else {
      setError(result.error || t('errors.registration_failed'));
    }
  }, [useFormbricks, formbricksSurveyCompleted, config, motivationLetter, acceptTerms, onSubmit, t, closeModal]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      closeModal();
      setError(null);
      setMotivationLetter('');
      setAcceptTerms(false);
      setFormbricksSurveyCompleted(false);
    }
  }, [isLoading, closeModal]);

  const getModalTitle = () => {
    if (config.requiresPayment) {
      return t('modal.title_with_payment');
    }
    if (config.isDirect) {
      return t('modal.title_direct');
    }
    return t('modal.title_approval');
  };

  const isSubmitDisabled = useFormbricks 
    ? isLoading || !formbricksSurveyCompleted
    : isLoading || (config.requiresInput && !motivationLetter.trim()) || (config.requiresPayment && !acceptTerms);

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      maxWidth={useFormbricks ? 'lg' : 'md'}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          minHeight: useFormbricks ? '80vh' : '480px',
          maxHeight: '90vh',
          margin: { xs: 0, sm: 2 },
          '@media (max-width: 600px)': {
            margin: 0,
            maxHeight: '100vh',
            borderRadius: 0,
            width: '100%',
            maxWidth: '100%',
          },
        },
      }}
    >
      <DialogTitle sx={{ padding: { xs: '16px', sm: '24px' } }}>
        <div className="flex justify-between items-center">
          <span className="text-lg sm:text-xl font-semibold pr-4">{getModalTitle()}</span>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label={t('modal.close')}
            disabled={isLoading}
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent sx={{ padding: { xs: '0 16px', sm: '0 24px' }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="mb-4">
          <p className="text-gray-600 font-medium text-sm sm:text-base">{course.title}</p>
        </div>

        {/* Formbricks Survey Embed */}
        {useFormbricks && userId && (
          <div className="flex-1 mb-4" style={{ minHeight: '500px' }}>
            <FormbricksSurveyEmbed
              surveyUrl={course.formbricksSurveyUrl!}
              userId={userId}
              courseId={course.id}
              onComplete={handleFormbricksComplete}
              onError={setError}
              className="h-full"
            />
            {formbricksSurveyCompleted && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">{t('formbricks.survey_completed')}</p>
              </div>
            )}
          </div>
        )}

        {/* Traditional Motivation Letter Input */}
        {!useFormbricks && config.requiresInput && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('modal.motivation_letter_label')}
            </label>
            <textarea
              value={motivationLetter}
              onChange={(e) => setMotivationLetter(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              rows={7}
              placeholder={t('modal.motivation_letter_placeholder')}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Payment Terms */}
        {config.requiresPayment && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 sm:p-4 mb-4">
              <p className="text-sm text-yellow-800">{t('modal.payment_info', { cost: course.cost })}</p>
            </div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-700 leading-relaxed">{t('modal.accept_terms')}</span>
            </label>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </DialogContent>

      {/* Hide submit button when using Formbricks - auto-submit on completion */}
      {!useFormbricks && (
        <DialogActions sx={{ padding: { xs: '16px', sm: '24px' }, paddingTop: 0 }}>
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 w-full">
            <Button onClick={handleClose} disabled={isLoading} className="px-6 py-3 w-full sm:w-auto order-2 sm:order-1">
              {t('modal.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              filled
              disabled={isSubmitDisabled}
              className="px-6 py-3 min-w-[140px] font-medium w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>{t('modal.submitting')}</span>
                </div>
              ) : config.requiresPayment ? (
                t('modal.proceed_to_payment')
              ) : (
                t('modal.submit')
              )}
            </Button>
          </div>
        </DialogActions>
      )}
    </Dialog>
  );
};
```

---

## Phase 5: Frontend - Applications Tab Enhancement

### 5.1 Create FormbricksResponsesDisplay component

**File:** `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/ApplicationsTab/FormbricksResponsesDisplay.tsx`

```tsx
import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { gql, useQuery } from '@apollo/client';
import { CircularProgress } from '@mui/material';

const GET_FORMBRICKS_RESPONSES = gql`
  query GetFormbricksResponses(
    $courseId: Int!
    $userId: uuid!
    $enrollmentId: Int!
    $formbricksSurveyId: String!
  ) {
    getFormbricksResponses(
      courseId: $courseId
      userId: $userId
      enrollmentId: $enrollmentId
      formbricksSurveyId: $formbricksSurveyId
    ) {
      success
      error
      responses {
        id
        createdAt
        finished
        answers {
          questionId
          headline
          answer
        }
      }
      survey {
        id
        name
      }
    }
  }
`;

interface Props {
  courseId: number;
  userId: string;
  enrollmentId: number;
  formbricksSurveyId: string;
}

export const FormbricksResponsesDisplay: FC<Props> = ({
  courseId,
  userId,
  enrollmentId,
  formbricksSurveyId,
}) => {
  const t = useTranslations('manageCourse');

  const { data, loading, error } = useQuery(GET_FORMBRICKS_RESPONSES, {
    variables: { courseId, userId, enrollmentId, formbricksSurveyId },
    fetchPolicy: 'cache-first',
  });

  const latestResponse = useMemo(() => {
    if (!data?.getFormbricksResponses?.responses?.length) return null;
    return data.getFormbricksResponses.responses[0];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <CircularProgress size={16} />
        <span className="text-sm">{t('formbricks.loading_responses')}</span>
      </div>
    );
  }

  if (error || !data?.getFormbricksResponses?.success) {
    return (
      <div className="text-sm text-red-500">
        {t('formbricks.error_loading_responses')}
      </div>
    );
  }

  if (!latestResponse) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('formbricks.no_responses')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
        {t('formbricks.questionnaire_responses')}
        {data.getFormbricksResponses.survey?.name && (
          <span className="text-xs text-gray-500 font-normal">
            ({data.getFormbricksResponses.survey.name})
          </span>
        )}
      </div>
      
      <div className="space-y-2 pl-4">
        {latestResponse.answers.map((answer: { questionId: string; headline: string; answer: string }) => (
          <div key={answer.questionId} className="border-l-2 border-gray-200 pl-3 py-1">
            <div className="text-xs font-medium text-gray-600">{answer.headline}</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap">{answer.answer}</div>
          </div>
        ))}
      </div>
      
      {!latestResponse.finished && (
        <div className="text-xs text-orange-600 italic pl-4">
          {t('formbricks.incomplete_response')}
        </div>
      )}
    </div>
  );
};
```

### 5.2 Update ApplicationsTab expandable row

Modify the `ExpandableApplicationRow` component in `ApplicationsTab/index.tsx` to include the Formbricks responses:

```tsx
// In the ExpandableApplicationRow component, add:

// Import at top
import { FormbricksResponsesDisplay } from './FormbricksResponsesDisplay';

// Inside the component, add conditional rendering:
const ExpandableApplicationRow = ({ row: enrollment }: { row: ManagedCourse_Course_by_pk_CourseEnrollments }) => {
  // ... existing code ...

  // Check if course has Formbricks survey
  const hasFormbricksSurvey = !!(course.formbricksSurveyId);

  return (
    <div className="pt-5 pb-5">
      <div className="flex items-start gap-3 pl-3">
        {/* ... existing email and history column ... */}

        {/* Application Content - Formbricks or Motivation Letter */}
        <div style={{ width: '424px', flexShrink: 0 }}>
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">
              {t('coursePage.application')}
            </div>
            
            {hasFormbricksSurvey ? (
              <FormbricksResponsesDisplay
                courseId={enrollment.courseId}
                userId={enrollment.userId}
                enrollmentId={enrollment.id}
                formbricksSurveyId={course.formbricksSurveyId!}
              />
            ) : (
              <div className="text-gray-900 whitespace-pre-wrap break-words pl-4">
                {enrollment.motivationLetter || '-'}
              </div>
            )}
          </div>
        </div>

        {/* ... existing rating controls column ... */}
      </div>
    </div>
  );
};
```

---

## Phase 6: Translations

### 6.1 German translations

**File:** `frontend-nx/apps/edu-hub/locales/de.json`

Add under appropriate sections:

```json
{
  "manageCourse": {
    "formbricks": {
      "title": "Bewerbungsfragebogen",
      "description": "Verknüpfe einen Formbricks-Fragebogen, der anstelle des Motivationsschreibens bei der Anmeldung angezeigt wird.",
      "tooltip": "Bewerber füllen diesen Fragebogen aus, wenn sie sich für den Kurs anmelden. Die Antworten werden in der Bewerbungsübersicht angezeigt.",
      "survey_url_label": "Formbricks Survey URL",
      "survey_url_helper": "Füge die URL deines Formbricks Link-Surveys ein",
      "survey_configured": "Fragebogen konfiguriert",
      "open_survey": "Fragebogen öffnen",
      "remove_survey": "Fragebogen entfernen",
      "invalid_url": "Bitte gib eine gültige Formbricks Survey URL ein",
      "info_hidden_fields": "Die Benutzer-ID und Kurs-ID werden automatisch als Hidden Fields an Formbricks übergeben.",
      "loading_responses": "Lade Antworten...",
      "error_loading_responses": "Fehler beim Laden der Fragebogen-Antworten",
      "no_responses": "Keine Fragebogen-Antworten vorhanden",
      "questionnaire_responses": "Fragebogen-Antworten",
      "incomplete_response": "Fragebogen nicht vollständig ausgefüllt"
    }
  },
  "course": {
    "formbricks": {
      "survey_title": "Bewerbungsfragebogen",
      "survey_completed": "Vielen Dank! Dein Fragebogen wurde erfolgreich eingereicht.",
      "embed_error": "Der Fragebogen konnte nicht geladen werden. Bitte versuche es später erneut."
    },
    "errors": {
      "complete_survey_first": "Bitte fülle zuerst den Fragebogen vollständig aus."
    }
  }
}
```

### 6.2 English translations

**File:** `frontend-nx/apps/edu-hub/locales/en.json`

```json
{
  "manageCourse": {
    "formbricks": {
      "title": "Application Questionnaire",
      "description": "Link a Formbricks questionnaire that will be shown instead of the motivation letter during registration.",
      "tooltip": "Applicants will fill out this questionnaire when registering for the course. Responses will be displayed in the applications overview.",
      "survey_url_label": "Formbricks Survey URL",
      "survey_url_helper": "Paste the URL of your Formbricks Link Survey",
      "survey_configured": "Questionnaire configured",
      "open_survey": "Open questionnaire",
      "remove_survey": "Remove questionnaire",
      "invalid_url": "Please enter a valid Formbricks Survey URL",
      "info_hidden_fields": "User ID and Course ID are automatically passed to Formbricks as hidden fields.",
      "loading_responses": "Loading responses...",
      "error_loading_responses": "Error loading questionnaire responses",
      "no_responses": "No questionnaire responses available",
      "questionnaire_responses": "Questionnaire Responses",
      "incomplete_response": "Questionnaire not fully completed"
    }
  },
  "course": {
    "formbricks": {
      "survey_title": "Application Questionnaire",
      "survey_completed": "Thank you! Your questionnaire has been successfully submitted.",
      "embed_error": "The questionnaire could not be loaded. Please try again later."
    },
    "errors": {
      "complete_survey_first": "Please complete the questionnaire first."
    }
  }
}
```

---

## Phase 7: Environment Configuration & Authentication

### 7.1 Formbricks API Authentication

Formbricks uses **API Key authentication** via the `x-api-key` HTTP header. All Management API requests require this header:

```bash
curl -X GET 'https://your-formbricks-instance.com/api/v1/management/responses?surveyId=xxx' \
  -H 'x-api-key: YOUR_API_KEY_HERE'
```

### 7.2 Where to Find/Create an API Key in Formbricks

#### Step-by-Step Instructions

1. **Log in** to your Formbricks cloud instance

2. **Navigate to Organization Settings**:
   - Click on your **project/environment** in the top-left
   - Go to **Settings** (gear icon)
   - Select **Organization** section in the sidebar
   - Click **API Keys**

   **Direct URL pattern:**
   ```
   https://your-formbricks-instance.com/environments/{environmentId}/settings/api-keys
   ```

3. **Create a New API Key**:
   - Click **"Add API Key"**
   - Enter a **label** (e.g., "EduHub Integration")
   - Configure **Project Access**:
     - Select the project containing your surveys
     - Select the environment (`production` recommended for live use)
     - Set permission level to **"read"** (minimum required for fetching responses)
   - Optionally enable **Organization Access** if needed for broader access
   - Click **"Add API Key"**

4. **Copy the API Key**:
   - ⚠️ **CRITICAL**: The full API key is only shown **once** immediately after creation!
   - Copy it immediately and store it securely
   - Format: `fb_prod_xxxxxxxxxxxxxxxxxxxx` or similar

#### API Key Permissions Explained

| Permission | Description | Required for EduHub? |
|------------|-------------|---------------------|
| **read** | View surveys, responses, contacts | ✅ Yes (minimum required) |
| **write** | Create/update surveys and responses | ❌ No |
| **manage** | Full access including deletion | ❌ No |

For the EduHub integration, **"read" permission is sufficient** since:
- Users submit responses directly through the embedded iframe (no API needed)
- EduHub only needs to **fetch** existing responses to display in the Applications tab

### 7.3 Test Your API Key

Verify your API key is working before deploying:

```bash
# Replace with your actual values
curl -X GET 'https://YOUR_FORMBRICKS_URL/api/v1/me' \
  -H 'x-api-key: YOUR_API_KEY'
```

**Expected success response (200 OK):**
```json
{
  "id": "cll2m30r70004mx0huqkitgqv",
  "createdAt": "2023-08-08T18:04:59.922Z",
  "type": "production",
  "project": {
    "id": "cll2m30r60003mx0hnemjfckr",
    "name": "My Project"
  }
}
```

**Error responses:**
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: API key lacks required permissions

### 7.4 Add Environment Variables

**Backend (functions/.env or deployment config):**

```bash
# Formbricks Integration - REQUIRED
FORMBRICKS_API_URL=https://your-formbricks-instance.com
FORMBRICKS_API_KEY=fb_prod_your_api_key_here
```

| Variable | Description | Example |
|----------|-------------|---------|
| `FORMBRICKS_API_URL` | Base URL of your Formbricks instance (no trailing slash) | `https://app.formbricks.com` |
| `FORMBRICKS_API_KEY` | API key created in Formbricks settings | `fb_prod_abc123...` |

**Frontend (Next.js public config - for iframe embedding only):**

```bash
# Optional - only needed if you want to configure the Formbricks URL dynamically
# Note: Do NOT expose the API key in frontend!
NEXT_PUBLIC_FORMBRICKS_URL=https://your-formbricks-instance.com
```

### 7.5 Security Best Practices

1. **Never expose the API key in frontend code**
   - Keep it in backend environment variables only
   - Use Hasura actions to proxy API calls

2. **Use environment-specific keys**
   - Create separate API keys for development, staging, and production
   - Label them clearly (e.g., "EduHub Dev", "EduHub Prod")

3. **Minimal permissions**
   - Only grant "read" access since that's all EduHub needs
   - Avoid "manage" permission unless absolutely necessary

4. **Rotate keys periodically**
   - Delete and recreate API keys on a schedule
   - Update environment variables after rotation

5. **Audit access**
   - Review API key usage in Formbricks logs
   - Remove unused keys promptly

### 7.6 Formbricks Survey Configuration

When creating a survey in Formbricks for use with EduHub:

#### Step 1: Create the Survey

1. Go to your Formbricks project
2. Click **"Create Survey"**
3. Select **"Link Survey"** (this allows embedding and URL-based access)
4. Design your questionnaire with the questions you want applicants to answer

#### Step 2: Configure Hidden Fields

Hidden fields allow EduHub to pass user context to Formbricks without showing it to users:

1. In the survey editor, scroll down to **"Hidden Fields"** section
2. Toggle it **ON**
3. Add these field IDs (exact spelling required):
   - `eduhubUserId` - Will receive the EduHub user UUID (required)
   - `eduhubCourseId` - Will receive the EduHub course ID (required)
   - `eduhubEnrollmentId` - Will receive the EduHub enrollment ID (optional - enrollment is created after survey completion during registration)

![Hidden Fields Configuration](https://formbricks.com/docs/images/hidden-fields.png)

#### Step 3: Publish and Get URL

1. Click **"Publish"** to make the survey live
2. Go to the **"Summary"** tab
3. Click **"Share"** button
4. Copy the survey URL (format: `https://your-instance.com/s/{surveyId}`)

#### Step 4: Link to EduHub Course

1. In EduHub, go to **Manage Course** → **Settings**
2. Find the **"Application Questionnaire"** section
3. Paste the Formbricks survey URL
4. Save

### 7.7 How the Integration Works at Runtime

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User clicks    │     │ EduHub builds   │     │ Formbricks      │
│  "Apply"        │ ──▶ │ iframe URL with │ ──▶ │ renders survey  │
│                 │     │ hidden fields   │     │ in embed mode   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
        URL: https://formbricks.com/s/abc123            │
             ?embed=true                                │
             &userId=xxx                                │
             &courseId=42                               ▼
             &enrollmentId=123              ┌─────────────────┐
                                            │ User completes  │
                                            │ survey, submits │
                                            └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Instructor     │     │ EduHub Hasura   │     │ Formbricks API  │
│  views apps     │ ◀── │ action fetches  │ ◀── │ returns response│
│                 │     │ via API         │     │ with hidden     │
└─────────────────┘     └─────────────────┘     │ field data      │
                                                └─────────────────┘

API Call:
GET /api/v1/management/responses?surveyId=abc123
Header: x-api-key: fb_prod_xxx

Response includes:
{
  "data": [{
    "id": "resp_123",
    "data": {
      "hiddenFields": {
        "eduhubUserId": "xxx",
        "eduhubCourseId": "42",
        "eduhubEnrollmentId": "123"
      },
      "question1": "Answer 1",
      "question2": "Answer 2"
    }
  }]
}
```

---

## Implementation Checklist

- [ ] Phase 1: Database migrations
  - [ ] Add formbricksSurveyId and formbricksSurveyUrl to Course table
  - [ ] Add formbricksResponseId to CourseEnrollment table (optional)
  - [ ] Update Hasura metadata permissions

- [ ] Phase 2: Backend function
  - [ ] Create getFormbricksResponses function
  - [ ] Register function in index.js
  - [ ] Add Hasura action definition

- [ ] Phase 3: Course settings UI
  - [ ] Create FormbricksSurveyConfig component
  - [ ] Update GraphQL fragments
  - [ ] Add to course settings page

- [ ] Phase 4: Registration modal
  - [ ] Create FormbricksSurveyEmbed component
  - [ ] Update RegistrationModal with conditional rendering
  - [ ] Handle survey completion events

- [ ] Phase 5: Applications tab
  - [ ] Create FormbricksResponsesDisplay component
  - [ ] Update ExpandableApplicationRow
  - [ ] Handle loading/error states

- [ ] Phase 6: Translations
  - [ ] Add German translations
  - [ ] Add English translations

- [ ] Phase 7: Configuration & Authentication
  - [ ] Create Formbricks API key with "read" permission
  - [ ] Test API key with curl command
  - [ ] Add FORMBRICKS_API_URL to backend environment
  - [ ] Add FORMBRICKS_API_KEY to backend environment
  - [ ] Document Formbricks survey setup requirements for admins

---

## Future Enhancements

1. **Survey Template Library**: Pre-built questionnaire templates for common use cases
2. **Analytics Dashboard**: Aggregate survey response analytics per course
3. **Conditional Logic**: Show different questions based on user profile
4. **PDF Export**: Export survey responses as part of application documents
5. **Multi-language**: Sync EduHub locale with Formbricks survey language

