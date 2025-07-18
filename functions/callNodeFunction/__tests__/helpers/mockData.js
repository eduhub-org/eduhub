// Shared mock data for email system tests

export const mockUsers = {
  user1: {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  },
  user2: {
    id: 'user-456',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com'
  },
  user3: {
    id: 'user-789',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob.wilson@example.com'
  }
};

export const mockCourses = {
  course1: {
    id: 101,
    title: 'Introduction to Programming',
    startTime: '2024-02-01T09:00:00Z',
    endTime: '2024-04-01T17:00:00Z'
  },
  course2: {
    id: 102,
    title: 'Advanced Programming',
    startTime: '2024-03-01T09:00:00Z',
    endTime: '2024-05-01T17:00:00Z'
  }
};

export const mockSessions = {
  session1: {
    id: 1,
    title: 'Session 1: Getting Started',
    startDateTime: '2024-01-16T10:00:00Z',
    endDateTime: '2024-01-16T12:00:00Z'
  },
  session2: {
    id: 2,
    title: 'Session 2: Advanced Concepts',
    startDateTime: '2024-01-23T10:00:00Z',
    endDateTime: '2024-01-23T12:00:00Z'
  },
  session3: {
    id: 3,
    title: 'Session 3: Final Project',
    startDateTime: '2024-01-30T10:00:00Z',
    endDateTime: '2024-01-30T12:00:00Z'
  }
};

export const mockEnrollments = {
  enrollment1: {
    id: 1,
    status: 'APPLIED',
    userId: mockUsers.user1.id,
    courseId: mockCourses.course1.id,
    created_at: '2024-01-15T10:00:00Z',
    invitationExpirationDate: '2024-02-15T10:00:00Z'
  },
  enrollment2: {
    id: 2,
    status: 'CONFIRMED',
    userId: mockUsers.user2.id,
    courseId: mockCourses.course1.id,
    created_at: '2024-01-14T10:00:00Z',
    invitationExpirationDate: '2024-02-14T10:00:00Z'
  }
};

export const mockEmailTemplates = {
  applicationReceived: {
    id: 1,
    title: 'APPLICATION_RECEIVED',
    subject: 'Application Received: [Enrollment:CourseId--Course:Name]',
    content: 'Hello [User:Firstname] [User:LastName], we have received your application for [Enrollment:CourseId--Course:Name].',
    from: 'noreply@opencampus.sh',
    cc: null,
    bcc: null
  },
  applicationConfirmed: {
    id: 2,
    title: 'APPLICATION_CONFIRMED',
    subject: 'Application Confirmed: [Enrollment:CourseId--Course:Name]',
    content: 'Hello [User:Firstname] [User:LastName], your application for [Enrollment:CourseId--Course:Name] has been confirmed.',
    from: 'noreply@opencampus.sh',
    cc: null,
    bcc: null
  },
  invite: {
    id: 3,
    title: 'INVITE',
    subject: 'Course Invitation: [Enrollment:CourseId--Course:Name]',
    content: 'Hello [User:Firstname] [User:LastName], you have been invited to [Enrollment:CourseId--Course:Name]. Please confirm by [Enrollment:ExpirationDate].',
    from: 'noreply@opencampus.sh',
    cc: null,
    bcc: null
  },
  decline: {
    id: 4,
    title: 'DECLINE',
    subject: 'Application Update: [Enrollment:CourseId--Course:Name]',
    content: 'Hello [User:Firstname] [User:LastName], unfortunately we cannot accept your application for [Enrollment:CourseId--Course:Name] at this time.',
    from: 'noreply@opencampus.sh',
    cc: null,
    bcc: null
  },
  sessionReminder: {
    id: 5,
    title: 'SESSION_REMINDER',
    subject: 'Session Reminder: [Session:Title] [Session:ReminderText]',
    content: 'Hello [User:Firstname] [User:LastName], your session "[Session:Title]" for course "[Enrollment:CourseId--Course:Name]" [Session:ReminderText] at [Session:StartDateTime]. Duration: [Session:Duration].',
    from: 'noreply@opencampus.sh',
    cc: null,
    bcc: null
  },
  registrationConfirmed: {
    id: 6,
    title: 'REGISTRATION_CONFIRMED',
    subject: 'Registration Confirmed: [Enrollment:CourseId--Course:Name]',
    content: 'Hello [User:Firstname] [User:LastName], your registration for [Enrollment:CourseId--Course:Name] has been confirmed.',
    from: 'noreply@opencampus.sh',
    cc: null,
    bcc: null
  }
};

// Helper function to create Hasura event trigger request
export const createHasuraEventRequest = (operation, newData, oldData = null) => ({
  body: {
    event: {
      op: operation,
      data: {
        new: newData,
        old: oldData
      }
    }
  }
});

// Helper function to create enrollment details response
export const createEnrollmentDetailsResponse = (enrollment, user, course) => ({
  CourseEnrollment_by_pk: {
    ...enrollment,
    User: user,
    Course: course
  }
});

// Helper function to create email template response
export const createEmailTemplateResponse = (template) => ({
  MailTemplate: [template]
});

// Helper function to create mail log response
export const createMailLogResponse = (id) => ({
  insert_MailLog_one: { id }
});

// Helper function to create course with sessions response for session reminders
export const createCourseWithSessionsResponse = (course, sessions, allSessions, enrollments) => ({
  Course: [{
    ...course,
    Sessions: sessions,
    AllSessions: allSessions,
    CourseEnrollments: enrollments.map(enrollment => ({
      id: enrollment.id,
      User: mockUsers[Object.keys(mockUsers).find(key => mockUsers[key].id === enrollment.userId)]
    }))
  }]
});

// Helper function to create sent reminders response
export const createSentRemindersResponse = (reminders = []) => ({
  MailLog: reminders
});

// Helper function to create sent reminder metadata
export const createReminderMetadata = (sessionId, userId, reminderType) => ({
  metadata: {
    type: 'SESSION_REMINDER',
    sessionId,
    userId,
    reminderType
  },
  to: mockUsers[Object.keys(mockUsers).find(key => mockUsers[key].id === userId)]?.email
}); 