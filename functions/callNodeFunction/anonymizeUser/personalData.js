import { gql } from 'graphql-request';

export const GET_DELETION_DATA = gql`
  query AccountDeletionData($userId: uuid!) {
    User_by_pk(id: $userId) {
      id firstName lastName email picture matrixUserHandle
      CourseEnrollments { id achievementCertificateURL attendanceCertificateURL }
      OrganizationNewsletterSubscriptions {
        status externalSubscriberId
        Organization {
          ghostNewsletterApiUrl ghostNewsletterApiKeyEncrypted
          ghostNewsletterListId ghostNewsletterSlug ghostNewsletterDoubleOptInEnabled
        }
      }
    }
    CourseInstructor(where: { userId: { _eq: $userId } }) { id certificateURL }
    SessionSpeaker(where: { userId: { _eq: $userId } }) { id }
    Attendance(where: { userId: { _eq: $userId } }) { recordedIdentifier }
    Session(where: { attendanceData: { _is_null: false }, _or: [
      { Attendances: { userId: { _eq: $userId } } }
      { Course: { CourseEnrollments: { userId: { _eq: $userId } } } }
      { Program: { Courses: { CourseEnrollments: { userId: { _eq: $userId } } } } }
    ] }) { id attendanceData }
  }
`;

// Preserve raw attendance for other people and a non-null value so the import
// cron does not treat an erased session as new and import the person again.
export function eraseRawAttendance(raw, identifiers) {
  const matches = (value) => typeof value === 'string' && identifiers.has(value.trim().toLowerCase());
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return JSON.stringify(parsed.filter((row) => !Object.values(row).some(matches)));
  }
  const erasedRows = new Set();
  for (const column of Object.values(parsed)) {
    if (!column || typeof column !== 'object') continue;
    for (const [index, value] of Object.entries(column)) {
      if (matches(value)) erasedRows.add(index);
    }
  }
  for (const column of Object.values(parsed)) {
    if (!column || typeof column !== 'object') continue;
    for (const index of erasedRows) delete column[index];
  }
  return JSON.stringify(parsed);
}

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

export function getErasureVariables(data, userId) {
  const user = data.User_by_pk;
  const identifiers = new Set([
    userId, user.email, `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    user.matrixUserHandle, ...data.Attendance.map((row) => row.recordedIdentifier),
  ].filter(Boolean).map((value) => value.trim().toLowerCase()));
  const mailFilters = ['to', 'from', 'cc', 'bcc', 'subject', 'content'].map((column) => ({
    [column]: { _ilike: `%${escapeLike(user.email)}%` },
  }));
  for (const key of ['userId', 'recipientUserId', 'actorUserId']) {
    mailFilters.push({ metadata: { _contains: { [key]: userId } } });
  }
  for (const [key, rows] of [
    ['enrollmentId', user.CourseEnrollments], ['courseEnrollmentId', user.CourseEnrollments],
    ['courseInstructorId', data.CourseInstructor],
    ['instructorCertificateCourseInstructorId', data.CourseInstructor],
    ['sessionSpeakerId', data.SessionSpeaker],
  ]) {
    for (const row of rows) mailFilters.push({ metadata: { _contains: { [key]: row.id } } });
  }
  return {
    userId,
    email: `anon_${userId.replace(/-/g, '')}@example.com`,
    mailFilter: { _or: mailFilters },
    sessions: data.Session.map((session) => ({
      where: { id: { _eq: session.id }, attendanceData: { _eq: session.attendanceData } },
      _set: { attendanceData: eraseRawAttendance(session.attendanceData, identifiers) },
    })),
  };
}

export const ERASE_PERSONAL_DATA = gql`
  mutation EraseAccountPersonalData(
    $userId: uuid!, $email: String!, $mailFilter: MailLog_bool_exp!, $sessions: [Session_updates!]!
  ) {
    update_User_by_pk(pk_columns: { id: $userId }, _set: {
      firstName: "ANON_USER", lastName: "ANON_USER", email: $email,
      picture: null, externalProfile: null, matriculationNumber: null,
      organizationId: null, organizationName: null, occupation: null,
      zipCode: null, country: null, city: null, addressLine1: null, addressLine2: null,
      matrixUserHandle: null, anonymousId: null, newsletterRegistration: false, status: DELETED
    }) { id }
    update_CourseEnrollment(where: { userId: { _eq: $userId } }, _set: {
      motivationLetter: "", motivationRating: UNRATED, questionnaireResponse: null,
      cancellationRequestReason: null, location: null, billingOrganizationId: null,
      achievementCertificateURL: null, attendanceCertificateURL: null
    }) { affected_rows }
    cancelEnrollments: update_CourseEnrollment(where: {
      userId: { _eq: $userId }, status: { _nin: [CANCELLED, REJECTED, ABORTED, COMPLETED] }
    }, _set: { status: CANCELLED }) { affected_rows }
    update_Attendance(where: { userId: { _eq: $userId } }, _set: {
      recordedIdentifier: null, location: null
    }) { affected_rows }
    update_Session_many(updates: $sessions) { affected_rows }
    update_CourseInstructor(where: { userId: { _eq: $userId } }, _set: {
      certificateURL: null
    }) { affected_rows }
    delete_GuestRegistrationToken(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_OrganizationNewsletterSubscription(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_JobAlertSubscription(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_SavedJobPosting(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_OrganizationAdmin(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_ProjectAuthor(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_ProjectMentor(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_AchievementRecordAuthor(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_AchievementOptionMentor(where: { userId: { _eq: $userId } }) { affected_rows }
    delete_MailLog(where: $mailFilter) { affected_rows }
  }
`;
