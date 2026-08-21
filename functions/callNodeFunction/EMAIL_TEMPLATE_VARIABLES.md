# Email Template Variables Reference

This document provides a comprehensive reference for all available email template variables in the EduHub email system.

## Overview

The email template variable system is centralized in `emailTemplateVariables.js` to ensure consistency, maintainability, and ease of use across all email functions.

## Available Variables

### User Variables
*Available in: enrollment emails, session reminders*

- **`[User:FirstName]`**: User's first name
  - Example: `John`
  
- **`[User:LastName]`**: User's last name
  - Example: `Doe`

### Course Variables
*Available in: enrollment emails*

- **`[Enrollment:CourseId--Course:Name]`**: Course title
  - Example: `Introduction to Data Science`
  - Available in: enrollment emails, session reminders

- **`[Course:StartTime]`**: Course start date (formatted based on app timezone)
  - Example: `15. Januar 2024` (German locale) or `January 15, 2024` (US locale)
  - Shows: `TBD` if not set

- **`[Course:EndTime]`**: Course end date (formatted based on app timezone)
  - Example: `20. März 2024` (German locale) or `March 20, 2024` (US locale)
  - Shows: `TBD` if not set

### Enrollment Variables
*Available in: enrollment emails*

- **`[Enrollment:CreatedAt]`**: Application/enrollment date (formatted)
  - Example: `10. Januar 2024`

- **`[Enrollment:ExpirationDate]`**: Invitation expiration date (formatted)
  - Example: `25. Januar 2024`
  - Shows: `TBD` if not set

- **`[Enrollment:CourseLink]`**: Link to course page
  - Example: `https://edu.opencampus.sh/course/123`
  - Available in: enrollment emails, session reminders

- **`[Enrollment:CertificateLink]`**: Link to the issued certificate (achievement or attendance); falls back to the course page
  - Example: `https://edu.opencampus.sh/course/123`
  - Available in: certificate-ready emails

### Project Variables
*Available in: project lifecycle emails*

- **`[Project:Title]`**: Project title
  - Example: `Solar-powered water purifier`

- **`[Project:Link]`**: Link to the project page
  - Example: `https://edu.opencampus.sh/project/123`

- **`[Project:ReviewComment]`**: The comment the instructor left in the review
  dialog, rendered as a labelled paragraph. Expands to nothing when no comment
  was left, so the template never shows an empty heading. The label carries both
  languages, since one template body holds the German and English half.
  - Example: `<p><strong>Kommentar der Kursleitung / Instructor comment:</strong><br>Bitte die Quellen ergänzen.</p>`
  - Available in: `PROJECT_APPROVED`, `PROJECT_REJECTED`, `PROJECT_SENT_BACK`

- **`[Project:SubmissionDeadline]`**: The deadline the team has to meet — the
  project's own `submissionDeadline`, else the course's, else the program's
  default — rendered as a labelled paragraph. Expands to nothing when no
  deadline is set, so a template never shows a dangling label. Date only
  (`dd.mm.yyyy`); the label carries both languages, like `[Project:ReviewComment]`.
  - Example: `<p><strong>Abgabefrist / Submission deadline:</strong> 04.09.2026</p>`
  - Available in: all project lifecycle emails; used by `PROJECT_SENT_BACK`,
    where instructors can extend the deadline while sending a project back

- **`[Project:ApplicantName]`**: Name of the user who requested to join the project
  - Example: `Jane Doe`
  - Available in: `PROJECT_JOIN_REQUESTED` emails only

### Session Variables
*Available in: session reminder emails*

- **`[Session:Title]`**: Session title
  - Example: `Introduction to Machine Learning`

- **`[Session:StartDateTime]`**: Session start date and time (localized)
  - Example: `15.1.2024, 14:00:00`

- **`[Session:EndDateTime]`**: Session end date and time (localized); the clock
  time alone when the session ends on the day it starts
  - Example: `16:00`
  - Available in: `SESSION_RESCHEDULED` emails

- **`[Session:Duration]`**: Session duration (calculated from start/end times)
  - Example: `2 hours` or `90 minutes`

- **`[Session:ReminderText]`**: Dynamic reminder text based on timing
  - Examples: `starts tomorrow`, `starts in 1 hour`, `starts in 15 minutes`

- **`[Session:ReminderTime]`**: Dynamic time text based on timing
  - Examples: `tomorrow`, `in 1 hour`, `in 15 minutes`

### System Variables
*Available in: general emails (e.g., user creation)*

- **`[System:PasswordResetLink]`**: Password reset link for user account creation
  - Example: `https://keycloak.example.com/realms/edu-hub/login-actions/reset-credentials?client_id=hasura`
  - Available in: user creation emails

- **`[System:PortalUrl]`**: Portal URL for user login
  - Example: `https://edu.opencampus.sh`
  - Available in: user creation emails

## Date Formatting

All date variables are automatically formatted based on the app's timezone setting:

- **Europe/Berlin**: German format (`15. Januar 2024`)
- **Europe/London**: British format (`15 January 2024`)
- **Europe/Paris**: French format (`15 janvier 2024`)
- **America/New_York**: US format (`January 15, 2024`)
- **UTC**: US format (`January 15, 2024`)

The timezone is retrieved from the `AppSettings` table and mapped to appropriate locale automatically.

## Usage in Email Templates

### For Enrollment Emails

```html
<!DOCTYPE html>
<html>
<body>
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your application for <strong>[Enrollment:CourseId--Course:Name]</strong> has been received.</p>
  <p>Application submitted: [Enrollment:CreatedAt]</p>
  <p>Course starts: [Course:StartTime] and ends: [Course:EndTime]</p>
  <p>View course: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
</body>
</html>
```

### For Session Reminder Emails

```html
<!DOCTYPE html>
<html>
<body>
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your session <strong>[Session:Title]</strong> for course <strong>[Enrollment:CourseId--Course:Name]</strong> [Session:ReminderText].</p>
  <p>Session starts: [Session:StartDateTime]</p>
  <p>Duration: [Session:Duration]</p>
  <p>Course page: <a href="[Enrollment:CourseLink]">[Enrollment:CourseLink]</a></p>
</body>
</html>
```

### For User Creation Emails

```html
<!DOCTYPE html>
<html>
<body>
  <p>Hello [User:FirstName] [User:LastName],</p>
  <p>Your account has been created for the EduHub platform.</p>
  <p>To set your password, please click on the following link:</p>
  <p><a href="[System:PasswordResetLink]">Set Password</a></p>
  <p>You can log in here: <a href="[System:PortalUrl]">[System:PortalUrl]</a></p>
</body>
</html>
```

## Template Validation

The system includes template validation to ensure only known variables are used:

```javascript
import { validateTemplate } from './emailTemplateVariables.js';

const template = 'Hello [User:FirstName], welcome to [Unknown:Variable]!';
const validation = validateTemplate(template);

console.log(validation);
// Output: { valid: false, unknownVariables: ['[Unknown:Variable]'] }
```

## Adding New Variables

To add new variables to the system:

1. **Update the registry** in `emailTemplateVariables.js`:

```javascript
export const EMAIL_VARIABLES = {
  // ... existing categories ...
  
  NEW_CATEGORY: {
    '[New:Variable]': {
      description: 'Description of the new variable',
      example: 'Example value',
      categories: ['enrollment', 'session'] // Where it's available
    }
  }
};
```

2. **Update the replacement logic** in `createVariableReplacer()`:

```javascript
// Add to the replacement function
result = result
  .replaceAll('[New:Variable]', data.newData?.variableValue || 'default');
```

3. **Update convenience functions** if needed:

```javascript
export function createEnrollmentVariableReplacer(enrollmentDetails, formatDate) {
  return createVariableReplacer({
    // ... existing data ...
    newData: { variableValue: 'computed value' }
  }, formatDate);
}
```

4. **Add tests** for the new variable in `__tests__/emailTemplateVariables.test.js`

5. **Update documentation** in this file and any relevant README files

## Development Tools

### Generate Documentation

```javascript
import { generateVariableDocumentation } from './emailTemplateVariables.js';

// Generate documentation for all variables
const fullDocs = generateVariableDocumentation();

// Generate documentation for specific category
const enrollmentDocs = generateVariableDocumentation('enrollment');
```

### Get Variables by Category

```javascript
import { getVariablesByCategory } from './emailTemplateVariables.js';

const sessionVars = getVariablesByCategory('session');
console.log(Object.keys(sessionVars)); // List of session variables
```

### Validate Templates

```javascript
import { validateTemplate } from './emailTemplateVariables.js';

const isValid = validateTemplate(templateContent);
if (!isValid.valid) {
  console.log('Unknown variables:', isValid.unknownVariables);
}
```

## Best Practices

1. **Always use the centralized system**: Don't create manual variable replacement logic
2. **Validate templates**: Use the validation function to check templates before deployment
3. **Use appropriate categories**: Only include variables that make sense for the email type
4. **Provide fallbacks**: Always include meaningful fallbacks for optional data
5. **Test thoroughly**: Add tests for new variables and edge cases
6. **Document changes**: Update this documentation when adding new variables

## Error Handling

The system gracefully handles missing data:

- **Missing user data**: Variables are replaced with empty strings
- **Missing dates**: Variables show `TBD` (To Be Determined)
- **Missing optional data**: Variables use sensible defaults or empty strings
- **Invalid templates**: Validation catches unknown variables before processing

## Implementation Examples

### Enrollment Email Function

```javascript
import { createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';

const replaceVariables = createEnrollmentVariableReplacer(enrollmentDetails, formatDate);
// `{ html: false }` for the subject: it is plain text, so entity-escaping a
// title like "Solar & Co" there would show up as "Solar &amp; Co".
const emailSubject = replaceVariables(template.subject, { html: false });
const emailContent = replaceVariables(template.content);
```

Values that come from users (names, course and project titles) are HTML-escaped
for the body and inserted verbatim into the subject. `queueEmail` already does
this; functions that build a mail themselves have to pass `{ html: false }` for
the subject.

### Session Reminder Function

```javascript
import { createSessionVariableReplacer } from '../emailTemplateVariables.js';

const replaceVariables = createSessionVariableReplacer(session, enrollment, {
  startDateTime: sessionStart.toLocaleString(),
  duration: calculateDuration(session),
  reminderText: getReminderText(window.type),
  reminderTime: getReminderTime(window.type)
});
```

## Migration Guide

If you have existing email functions using manual variable replacement:

1. **Import the centralized system**:
   ```javascript
   import { createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';
   ```

2. **Replace manual logic**:
   ```javascript
   // Old way
   const replaceVariables = (text) => {
     return text
       .replaceAll('[User:FirstName]', user.firstName)
       .replaceAll('[User:LastName]', user.lastName);
   };

   // New way
   const replaceVariables = createEnrollmentVariableReplacer(enrollmentDetails, formatDate);
   ```

3. **Update tests** to use the new system
4. **Remove duplicate code** and rely on the centralized implementation

This centralized approach ensures consistency, reduces code duplication, and makes the email system more maintainable and robust. 