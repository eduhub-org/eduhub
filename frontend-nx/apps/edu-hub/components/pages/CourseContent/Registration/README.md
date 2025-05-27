# Registration Component System

This directory contains a feature-oriented registration system for the EduHub CourseContent component. The system supports multiple registration types and provides a clean, modular architecture with comprehensive user feedback.

## Architecture

The registration system follows a feature-oriented approach with clear separation of concerns:

```
Registration/
├── index.tsx                    # Main Registration component
├── types.ts                     # Type definitions and configuration
├── RegistrationButton.tsx       # Registration button component
├── RegistrationStatus.tsx       # Status display for enrolled users
├── RegistrationModal.tsx        # Modal for input forms and payment
├── hooks/
│   └── useRegistrationHandler.ts # Registration logic hook
└── README.md                    # This documentation
```

## Invitation Confirmation Flow

The registration system works in conjunction with the **Onboarding component** to handle invitation confirmations. This creates a complete user journey from invitation to course participation.

### How Invitation Confirmation Works

1. **Invitation Detection**: When a user with `INVITED` status visits a course page, the CourseContent component automatically detects this and triggers the onboarding flow
2. **Onboarding Display**: The Onboarding component is conditionally rendered above the Registration component when:
   - User is logged in (`isLoggedIn === true`)
   - User has an active invitation (`resetValues === true`)
   - Invitation has not expired (`invitationExpirationDate >= current date`)

3. **User Profile Completion**: The Onboarding component requires users to complete their profile information:
   - **Occupation**: Dropdown selection from predefined options
   - **Organization**: Dropdown with search and create functionality
   - **Matriculation Number**: Required for university students only

4. **Invitation Decision**: Users can either:
   - **Confirm Participation**: Updates enrollment status from `INVITED` to `CONFIRMED`
   - **Decline Invitation**: Updates enrollment status from `INVITED` to `CANCELLED`

### Integration with Registration Component

```tsx
// In CourseContent component
{isLoggedIn && resetValues && (
  <Onboarding
    course={course}
    enrollmentId={enrollmentId}
    refetchCourse={refetchCourse}
    setResetValues={setResetValues}
  />
)}

<Registration
  course={course}
  courseEnrollment={courseEnrollment}
  onRegistrationSuccess={handleRegistrationSuccess}
/>
```

### Onboarding Component Features

**Profile Completion Form:**
- **Occupation Selector**: Dynamically translated dropdown with occupation options
- **Organization Selector**: Searchable dropdown with ability to create new organizations
- **Conditional Fields**: Matriculation number field appears only for university students
- **Real-time Updates**: Form fields update user profile immediately via GraphQL mutations

**Invitation Actions:**
- **Confirm Button**: Accepts invitation and updates status to `CONFIRMED`
- **Decline Button**: Shows confirmation dialog before cancelling invitation
- **Loading States**: Buttons show loading spinners during status updates
- **Error Handling**: Graceful error handling with console logging

**User Experience:**
- **Visual Distinction**: Special background color (`bg-edu-course-invited`) to highlight invitation status
- **Clear Messaging**: Congratulatory message and important information about course participation
- **Mattermost Integration**: Information about course chat access after confirmation
- **Responsive Design**: Mobile-friendly layout with proper spacing and button arrangement

### Status Transition Flow

```
INVITED (with valid expiration) → Onboarding Component → CONFIRMED/CANCELLED
                                                      ↓
                                              Registration Component
                                                      ↓
                                              RegistrationStatus Component
                                                      ↓
                                              Course Resource Access
```

### Key Differences from Registration Component

| Aspect | Registration Component | Onboarding Component |
|--------|----------------------|---------------------|
| **Purpose** | Handle new applications | Confirm existing invitations |
| **User State** | Not enrolled | Already invited |
| **Profile Data** | Optional | Required completion |
| **Actions** | Apply/Register | Confirm/Decline |
| **Visibility** | Always visible for eligible users | Only for invited users |
| **Form Type** | Course-specific (motivation letter) | Profile-specific (occupation, organization) |

## Registration Types

The system supports 6 different registration types as defined in the backend:

### Currently Implemented (4/6)
1. **APPROVAL_WITH_INPUT** - Registration with approval process and motivation letter
2. **EXTERNAL_REGISTRATION** - Redirect to external registration link
3. **DIRECT_WITH_INPUT** - Direct registration with input form
4. **DIRECT_CONFIRMATION** - Direct registration without input

### To Be Added (2/6)
5. **DIRECT_WITH_INPUT_AND_PAYMENT** - Direct registration with input form and payment
6. **DIRECT_CONFIRMATION_AND_PAYMENT** - Direct registration with payment

## Components

### Registration (Main Component)
The main component that orchestrates the registration flow based on user state and registration type.

**Props:**
- `course: Course_Course_by_pk` - Course data
- `courseEnrollment?: CourseWithEnrollment_Course_by_pk_CourseEnrollments` - User's enrollment if exists
- `onRegistrationSuccess?: () => void` - Callback for successful registration

**Features:**
- Automatic snackbar notifications for success/error states
- Comprehensive error handling with user-friendly messages
- Loading state management
- Responsive design for mobile and desktop

### RegistrationButton
Displays the appropriate registration button based on registration type and user state.

**Features:**
- Dynamic button text based on registration type
- Application deadline validation
- Login state handling
- Disabled states for loading and invalid conditions
- Responsive styling

### RegistrationStatus
Shows the current enrollment status for users who are already enrolled.

**Supported Statuses (from database):**
- **APPLIED**: "The course application was received" - Shows applied status badge
- **REJECTED**: "The application was rejected" - Shows rejected status badge  
- **INVITED**: "Invitation was sent to Student" - Shows invited status message only (confirmation handled by Onboarding component)
- **CONFIRMED**: "The course invitation was confirmed by the student" - Shows course resource buttons
- **ABORTED**: "The course was not successfully completed" - Shows aborted status badge
- **COMPLETED**: "The course was successfully completed by receiving at least one certificate" - Shows course resource buttons
- **CANCELLED**: "User has cancelled application" - Shows cancelled status badge

**Important Note**: For `INVITED` status, the RegistrationStatus component only displays a status message. The actual invitation confirmation functionality is handled by the separate Onboarding component, which appears above the Registration component when a user has an active invitation.

**Course Resource Access:**
For confirmed and completed enrollments, displays action buttons for:
- **Course Chat**: Direct link to the course's Mattermost chat channel
- **Online Meeting**: Link to video conference (when course has online sessions)

### RegistrationModal
Modal component for registration types that require user input.

**Features:**
- Motivation letter input with validation
- Payment terms acceptance
- Comprehensive error handling and validation
- Success feedback with automatic modal closure
- Mobile-responsive design
- Loading states with spinner animations
- Form reset on successful submission

### useRegistrationHandler Hook
Custom hook that encapsulates all registration logic.

**Capabilities:**
- Handles different registration types
- Manages modal state
- Processes form submissions
- Integrates with GraphQL mutations
- Comprehensive error handling with snackbar notifications
- Success notifications with automatic UI updates
- Loading state management

## User Feedback System

The registration system includes a comprehensive feedback system:

### Snackbar Notifications
- **Success Messages**: Automatic notifications for successful registrations
- **Error Messages**: Clear error descriptions for failed operations
- **Loading States**: Visual feedback during async operations
- **Auto-dismiss**: Notifications automatically close after appropriate time

### Error Handling
- **Validation Errors**: Real-time form validation with clear messages
- **Network Errors**: Graceful handling of connection issues
- **Server Errors**: User-friendly error messages for backend failures
- **Fallback Messages**: Generic error handling for unexpected cases

### Loading States
- **Button Loading**: Spinner animations during registration
- **Modal Loading**: Disabled form elements during submission
- **Status Loading**: Loading indicators for status changes

## Configuration

Registration types are configured in `types.ts` with the following properties:

```typescript
interface RegistrationTypeConfig {
  requiresInput: boolean;      // Show input form
  requiresApproval: boolean;   // Requires admin approval
  requiresPayment: boolean;    // Requires payment processing
  isExternal: boolean;         // External registration link
  isDirect: boolean;           // Direct registration without approval
}
```

## Translations

The system uses the consolidated `course` namespace with translations organized in `course.json`:

### English and German (`course.json`)
All registration-related translations are consolidated in the main course translation files with proper grouping:

- **registration**: Button texts, deadlines, and registration actions
- **modal**: Modal titles, labels, and form content
- **status**: Enrollment status messages
- **errors**: Validation and error messages
- **success_messages**: Success notifications and confirmations
- **onboarding_modal**: Onboarding component specific translations
- **general**: Common actions like confirm/reject buttons

### Translation Keys Structure
```
course:
  registration:
    apply_now: "Apply now"
    register_now: "Register Now"
    application_deadline: "Application deadline: "
    # ... other registration keys
  modal:
    title_approval: "Apply for Course"
    motivation_letter_label: "Motivation Letter"
    # ... other modal keys
  status:
    applied: "Applied"
    invited: "Invited"
    # ... other status keys
  errors:
    motivation_letter_required: "Please provide a motivation letter"
    # ... other error keys
  success_messages:
    success_title: "You have successfully applied"
    # ... other success keys
  onboarding_modal:
    important: "Important"
    congratulation: "Congratulations!"
    form_intro: "Please complete your profile information"
    # ... other onboarding keys
  general:
    confirm: "Confirm"
    reject: "Decline"
    # ... other general keys
```

## Integration

The Registration component is integrated into the main CourseContent component alongside the Onboarding component:

```tsx
{/* Onboarding appears first for invited users */}
{isLoggedIn && resetValues && (
  <Onboarding
    course={course}
    enrollmentId={enrollmentId}
    refetchCourse={refetchCourse}
    setResetValues={setResetValues}
  />
)}

{/* Registration component handles all other cases */}
<Registration 
  course={course} 
  courseEnrollment={courseEnrollment} 
  onRegistrationSuccess={handleRegistrationSuccess}
/>
```

### Required Dependencies
- `useSnackbar` hook from the common snackbar system
- GraphQL mutations for enrollment operations
- Translation system (`next-translate`) with `course` namespace
- Material-UI components for modal and form elements
- Profile-related mutations for user data updates (Onboarding)

## Future Enhancements

### Payment Integration
The system is prepared for payment integration with:
- Payment form components in RegistrationModal
- Payment provider hooks in useRegistrationHandler
- Payment result handling with appropriate notifications
- Payment status tracking and error recovery

### Enhanced Onboarding
Potential improvements to the invitation confirmation flow:
- Email verification step before confirmation
- Course-specific onboarding questions
- Integration with calendar systems for session reminders
- Automated Mattermost channel invitation upon confirmation

## Benefits

1. **Feature-Oriented**: Clear separation of registration concerns
2. **Type-Safe**: Full TypeScript support with generated types
3. **User-Friendly**: Comprehensive feedback and error handling
4. **Extensible**: Easy to add new registration types and features
5. **Internationalized**: Complete translation support with consolidated namespace
6. **Accessible**: Proper error handling, loading states, and user feedback
7. **Maintainable**: Clean component structure and comprehensive documentation
8. **Responsive**: Mobile-first design with desktop optimization

## Translation Consolidation

This registration system has been updated to use the consolidated `course` translation namespace, which provides:

- **Unified Translations**: All course-related translations in one place
- **Better Organization**: Logical grouping of translation keys
- **Easier Maintenance**: Single source of truth for course translations
- **Consistent Naming**: Snake_case naming convention throughout
- **Reduced Complexity**: Fewer translation files to manage

## Testing Considerations

When testing the registration system:

1. **Registration Types**: Test all 4 implemented registration types
2. **Error Scenarios**: Network failures, validation errors, server errors
3. **Success Flows**: Complete registration flows with proper notifications
4. **Mobile Responsiveness**: Test modal and form behavior on mobile devices
5. **Loading States**: Verify loading indicators and disabled states
6. **Translation**: Test both English and German translations with `course` namespace
7. **Edge Cases**: Application deadlines, full courses, duplicate registrations 