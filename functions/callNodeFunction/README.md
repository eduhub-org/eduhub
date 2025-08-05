# EduHub Email System - Node Functions

This directory contains the Node.js cloud functions for EduHub's automated email system.

## Functions

### sendEnrollmentEmail
Automatically sends emails when course enrollment status changes. Triggered by Hasura event triggers.

**Supported Status Changes:**
- `APPLIED` → APPLICATION_RECEIVED email
- `CONFIRMED` → APPLICATION_CONFIRMED email  
- `INVITED` → INVITE email
- `REJECTED` → DECLINE email
- `REGISTERED` → REGISTRATION_CONFIRMED email

### sendSessionReminders
Sends automated session reminder emails for the **first session only** of each course.

**Reminder Windows:**
- 24 hours before (±15 minutes tolerance)
- 1 hour before (±15 minutes tolerance)  
- 15 minutes before (±6 minutes tolerance)

## Email Template Variables

Both email functions use a **centralized variable system** (`emailTemplateVariables.js`) that provides:

✅ **Centralized Management**: Single source of truth for all email variables  
✅ **Automatic Date Formatting**: Dates formatted based on app timezone settings  
✅ **Template Validation**: Validates templates against known variables  
✅ **Type Safety**: Prevents runtime errors from missing data  
✅ **Easy Maintenance**: Add new variables in one place  

### Quick Usage
```javascript
import { createEnrollmentVariableReplacer } from '../emailTemplateVariables.js';

const replaceVariables = createEnrollmentVariableReplacer(enrollmentDetails, formatDate);
const emailContent = replaceVariables(template.content);
```

**Complete Documentation**: [`EMAIL_TEMPLATE_VARIABLES.md`](EMAIL_TEMPLATE_VARIABLES.md)

## Testing

### Prerequisites
```bash
npm install
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test sendEnrollmentEmail.test.js

# Run tests in verbose mode (shows console output)
VERBOSE=1 npm test
```

### Test Structure

```
functions/callNodeFunction/
├── __tests__/
│   └── helpers/
│       └── mockData.js           # Shared mock data and utilities
├── sendEnrollmentEmail/
│   ├── __tests__/
│   │   └── sendEnrollmentEmail.test.js
│   └── index.js
├── sendSessionReminders/
│   ├── __tests__/
│   │   └── sendSessionReminders.test.js
│   └── index.js
├── jest.config.js                # Jest configuration
├── jest.setup.js                 # Global test setup
└── package.json
```

### Test Coverage

The tests cover:

**sendEnrollmentEmail:**
- ✅ Event operation filtering (INSERT/UPDATE/DELETE)
- ✅ Status change detection
- ✅ Email template mapping for all statuses
- ✅ Variable replacement in email content
- ✅ Error handling (GraphQL errors, missing data, missing templates)
- ✅ Email metadata and properties
- ✅ Success/failure response formats

**sendSessionReminders:**
- ✅ First session filtering (only first sessions get reminders)
- ✅ Multiple reminder time windows (24h, 1h, 15m)
- ✅ Duplicate prevention via MailLog metadata
- ✅ Variable replacement and session duration calculation
- ✅ Error handling (GraphQL errors, missing templates)
- ✅ Email metadata and tracking
- ✅ Response format validation

### Mock Data

The test suite uses comprehensive mock data including:
- Sample users, courses, sessions, and enrollments
- All email templates with variable placeholders
- Hasura event trigger payloads
- GraphQL response structures

### Environment Variables

Test environment automatically sets:
- `HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql`
- `HASURA_ADMIN_SECRET=test-admin-secret`
- `FRONTEND_URL=https://test.edu.opencampus.sh`

### Example Test Output

```bash
$ npm test

> callNodeFunction@0.0.1 test
> node --experimental-vm-modules node_modules/.bin/jest

 PASS  sendEnrollmentEmail/__tests__/sendEnrollmentEmail.test.js
 PASS  sendSessionReminders/__tests__/sendSessionReminders.test.js

Test Suites: 2 passed, 2 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.34s
Ran all test suites.
```

### Debugging Tests

To see detailed console output during tests:
```bash
VERBOSE=1 npm test
```

To run a specific test case:
```bash
npm test -- --testNamePattern="should send reminders only for first sessions"
```

### Continuous Integration

The tests are designed to be deterministic and can be run in CI/CD environments. They use:
- Fixed mock dates for consistent time-based testing
- Comprehensive mocking of external dependencies
- No real network calls or database connections

## Development

### Adding New Tests

1. Create test files in the `__tests__` directory next to the function
2. Use the shared mock data from `__tests__/helpers/mockData.js`
3. Follow the existing test patterns for consistency
4. Ensure good test coverage for both happy path and error scenarios

### Test Naming Convention

- Describe blocks: Feature or component being tested
- Test cases: "should [expected behavior] when [condition]"
- Use clear, descriptive names that explain the test purpose 