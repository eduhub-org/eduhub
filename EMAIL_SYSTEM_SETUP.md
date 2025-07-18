# Email System Setup Guide

This document describes how to set up the fully automated email system for EduHub, including registration process emails and automatic session reminders.

## Overview

The email system consists of:

1. **Registration Process Emails**: Automatically sent when users apply for courses or their status changes
2. **Session Reminder Emails**: Automatically sent before course sessions start (24 hours, 1 hour, and 15 minutes before)

## Architecture

### Automated Registration Process Emails
- **Trigger**: Database event triggers on `CourseEnrollment` table
- **Function**: `sendEnrollmentEmail` function in `callNodeFunction`
- **Templates**: `APPLICATION_RECEIVED`, `APPLICATION_CONFIRMED`, `INVITE`, `DECLINE`, `REGISTRATION_CONFIRMED`
- **Status Changes**: 
  - `APPLIED` → Sends `APPLICATION_RECEIVED` email
  - `CONFIRMED` → Sends `APPLICATION_CONFIRMED` email
  - `INVITED` → Sends `INVITE` email
  - `REJECTED` → Sends `DECLINE` email
  - `REGISTERED` → Sends `REGISTRATION_CONFIRMED` email

### Session Reminder Emails
- **Trigger**: Hasura scheduled event (every 15 minutes) or manual Hasura action
- **Function**: `sendSessionReminders` function in `callNodeFunction`
- **Template**: `SESSION_REMINDER`
- **Tracking**: Uses `MailLog` metadata to prevent duplicate reminders (no separate table needed)

## Email Flow

### Fully Automated System

```
Course Registration Type: APPROVAL_WITH_INPUT (Application-based)
User applies (APPLIED)
├── ✅ Automatic: APPLICATION_RECEIVED email sent
│
├── Admin Review Process:
│   ├── Admin sets motivationRating to "INVITE"/"DECLINE"
│   ├── Admin clicks "Send Invitations" button  
│   ├── Status changed to INVITED/REJECTED
│   └── ✅ Automatic: INVITE/DECLINE email sent (via event trigger)
│
├── User Confirms Participation:
│   ├── Status changed to CONFIRMED
│   └── ✅ Automatic: APPLICATION_CONFIRMED email sent
│
└── Session Reminders:
    ├── ✅ Automatic: SESSION_REMINDER emails (24h, 1h, 15min before)
    └── ✅ Triggered by Hasura scheduled event every 15 minutes

Course Registration Type: DIRECT_WITH_INPUT / DIRECT_CONFIRMATION (Direct Registration)
User registers (REGISTERED)
├── ✅ Automatic: REGISTRATION_CONFIRMED email sent
│
└── Session Reminders:
    ├── ✅ Automatic: SESSION_REMINDER emails (24h, 1h, 15min before)
    └── ✅ Triggered by Hasura scheduled event every 15 minutes
```

## Email Templates

The system includes the following email templates:

### Registration Templates
- **`APPLICATION_RECEIVED`**: Sent when a user applies for a course (status: `APPLIED`)
- **`APPLICATION_CONFIRMED`**: Sent when a user's participation is confirmed (status: `CONFIRMED`)
- **`INVITE`**: Sent when admin invites users (status: `INVITED`)
- **`DECLINE`**: Sent when admin rejects applications (status: `REJECTED`)
- **`REGISTRATION_CONFIRMED`**: Sent when a user directly registers for a course/event (status: `REGISTERED`)

### Session Templates
- **`SESSION_REMINDER`**: Sent before sessions start (24h, 1h, 15min before)

## Key Design Decisions

### Fully Automated Email System
All emails are now sent automatically via Hasura event triggers, providing:

1. **Consistency**: All emails follow the same pattern and variable replacement logic
2. **Reliability**: No risk of forgetting to send emails or manual errors
3. **Audit Trail**: All emails tracked in MailLog with metadata for debugging
4. **Reduced Complexity**: Single email system to maintain
5. **Better Performance**: No frontend dependencies for email sending
6. **Scalability**: Handles bulk operations efficiently via event triggers

### Simplified Tracking with MailLog Metadata
Instead of creating separate tracking tables, we use the existing `MailLog` table's `metadata` JSONB field to track sent reminders:

```json
{
  "type": "SESSION_REMINDER",
  "reminderType": "1_HOUR",
  "sessionId": 456,
  "userId": 789,
  "courseId": 101,
  "sentAt": "2024-01-15T10:00:00Z"
}
```

**Benefits:**
- Fewer database tables to maintain
- All email data in one place for easier debugging
- Leverages existing JSONB indexing capabilities
- More flexible metadata structure

### Integration with callNodeFunction
Both email functions are integrated into the existing `callNodeFunction` serverless architecture, following EduHub patterns:
- Consistent error handling and logging
- Standardized response format
- Shared dependencies and deployment

## Required Environment Variables

The following environment variables should already be set in your EduHub deployment:

```bash
# Existing variables (should already be set)
HASURA_GRAPHQL_ENDPOINT=https://your-hasura-endpoint.com/v1/graphql
HASURA_ADMIN_SECRET=your-admin-secret
HASURA_CLOUD_FUNCTION_SECRET=your-function-secret
CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION=https://your-region-your-project.cloudfunctions.net/callNodeFunction

# Frontend URL for email links
FRONTEND_URL=https://edu.opencampus.sh
```

## Deployment Steps

### 1. Database Migration
```bash
# Apply the database migrations (only email templates)
hasura migrate apply --database-name default
hasura metadata apply
```

### 2. Deploy Functions
The email functions are part of the existing `callNodeFunction`, so they will be deployed automatically with your regular deployment process.

### 3. Automatic Session Reminders
The session reminders are automatically triggered by a Hasura scheduled event every 15 minutes. This is already configured in `backend/metadata/cron_triggers.yaml` and will be applied when you run:

```bash
hasura metadata apply
```

The scheduled event will automatically call the `sendSessionReminders` function to check for upcoming sessions and send appropriate reminder emails.

### 4. Configure Email Templates
The email templates are automatically inserted via migration. You can customize them by updating the `MailTemplate` table:

- `APPLICATION_RECEIVED`: Sent when a user applies for a course
- `APPLICATION_CONFIRMED`: Sent when a user's participation is confirmed
- `SESSION_REMINDER`: Sent before sessions start

## Email Template Variables

The following variables are available in email templates:

### User Variables
- `[User:Firstname]`: User's first name
- `[User:LastName]`: User's last name

### Course/Enrollment Variables
- `[Enrollment:CourseId--Course:Name]`: Course title
- `[Enrollment:CreatedAt]`: Application date
- `[Enrollment:CourseLink]`: Link to course page

### Course Variables
- `[Course:StartTime]`: Course start date
- `[Course:EndTime]`: Course end date

### Session Variables (for reminders)
- `[Session:Title]`: Session title
- `[Session:StartDateTime]`: Session start date and time
- `[Session:Duration]`: Session duration
- `[Session:ReminderText]`: Dynamic text based on reminder type
- `[Session:ReminderTime]`: Dynamic time text based on reminder type

## Testing

### Test Registration Emails
1. Create a test course enrollment
2. Check the `MailLog` table for queued emails
3. Verify the email content and variables are correctly replaced
4. Check the `metadata` field for tracking information

### Test Session Reminders
1. Create a test session with start time in the future
2. Manually trigger the session reminders via Hasura console:
   ```graphql
   mutation {
     sendSessionReminders {
       success
       messageKey
       totalEmailsSent
       processedSessions {
         sessionId
         sessionTitle
         reminderType
         emailsSent
       }
     }
   }
   ```
3. Check the `MailLog` table for queued emails with proper metadata
4. Verify no duplicate emails are sent on subsequent runs

### Frontend Integration
You can also trigger session reminders from the frontend:

```typescript
import { SEND_SESSION_REMINDERS } from '../queries/actions';

const [sendReminders] = useAdminMutation<SendSessionReminders>(SEND_SESSION_REMINDERS);

const handleSendReminders = async () => {
  const result = await sendReminders();
  console.log(`Sent ${result.data?.sendSessionReminders.totalEmailsSent} emails`);
};
```

## Monitoring

Monitor the email system by:

1. **MailLog Table**: Check for failed emails (`status` != 'SENT')
   ```sql
   SELECT * FROM "MailLog" 
   WHERE status = 'FAILED' 
   ORDER BY created_at DESC;
   ```

2. **Metadata Tracking**: Monitor reminder patterns
   ```sql
   SELECT 
     metadata->>'type' as email_type,
     metadata->>'reminderType' as reminder_type,
     COUNT(*) as count
   FROM "MailLog" 
   WHERE metadata->>'type' IN ('SESSION_REMINDER', 'ENROLLMENT_STATUS')
   GROUP BY metadata->>'type', metadata->>'reminderType';
   ```

3. **Function Logs**: Monitor the `callNodeFunction` logs for errors
4. **Hasura Scheduled Events**: Check the Hasura console for scheduled event execution logs

## Troubleshooting

### Common Issues

1. **Emails not being sent**
   - Check if the `sendMail` function is running correctly
   - Verify Mailgun configuration
   - Check `MailLog` table for error messages

2. **Duplicate reminder emails**
   - Verify metadata queries are working correctly
   - Check Hasura scheduled event logs for overlapping executions

3. **Missing email templates**
   - Ensure migration was applied correctly
   - Check `MailTemplate` table for required templates:
     ```sql
     SELECT title FROM "MailTemplate" WHERE title IN ('APPLICATION_RECEIVED', 'APPLICATION_CONFIRMED', 'SESSION_REMINDER', 'INVITE', 'DECLINE');
     ```

4. **Variable replacement not working**
   - Verify GraphQL queries are returning correct data
   - Check function logs for variable replacement errors

5. **Function not found errors**
   - Ensure functions are properly registered in `callNodeFunction/index.js`
   - Check function names match exactly in event triggers and actions

6. **Automatic emails not triggering**
   - Verify event triggers are properly configured
   - Check Hasura event trigger logs
   - Ensure `callNodeFunction` is accessible from Hasura
   - Verify environment variables are set correctly

7. **Mixed email behavior (some automatic, some manual)**
   - All emails are now sent automatically via event triggers
   - `APPLIED`, `CONFIRMED`, `INVITED`, and `REJECTED` status changes all trigger automatic emails
   - If emails are not being sent, check the event trigger configuration and function logs

## Customization

### Adding New Email Types
1. Create new email template in `MailTemplate` table
2. Add logic to appropriate function in `callNodeFunction`
3. Update variable replacement as needed
4. Add metadata tracking for the new type

### Modifying Reminder Schedule
1. Update the schedule in `backend/metadata/cron_triggers.yaml`
2. Apply metadata changes: `hasura metadata apply`
3. Modify reminder windows in `sendSessionReminders` function if needed

### Custom Email Variables
Add new variable replacement logic in the functions' `replaceVariables` function.

### Adding New Functions
Follow the EduHub serverless function pattern:
1. Create function file in `callNodeFunction/yourFunction/index.js`
2. Register in `callNodeFunction/index.js`
3. Create Hasura action or event trigger
4. Add frontend query if needed

## Performance Considerations

- **MailLog Metadata Queries**: The JSONB metadata field is indexed for efficient querying
- **Batch Processing**: Session reminders process all reminder types in one execution
- **Duplicate Prevention**: Uses efficient Set-based checking for already sent reminders
- **Error Handling**: Comprehensive error handling prevents function crashes 

## Course Registration Types

The system supports different registration workflows based on the `Course.registrationType` field:

### Application-based Courses (`APPROVAL_WITH_INPUT`)
- Users submit applications with motivation letters
- Admins review and approve/reject applications
- Multi-step process: `APPLIED` → `INVITED`/`REJECTED` → `CONFIRMED`
- Suitable for selective courses, workshops with limited capacity

### Direct Registration Courses (`DIRECT_WITH_INPUT`, `DIRECT_CONFIRMATION`)
- Users register directly without admin approval
- Single-step process: `REGISTERED` (immediate confirmation)
- Suitable for open events, webinars, large capacity courses

### External Registration (`EXTERNAL_REGISTRATION`)
- Registration handled by external systems
- No enrollment records in EduHub
- Suitable for third-party managed events 