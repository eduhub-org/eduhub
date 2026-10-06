import { CourseRegistrationType_enum } from '../__generated__/globalTypes';
import { getEditableEmailTemplateTypes } from './getEditableEmailTemplateTypes';

const course = (registrationType: CourseRegistrationType_enum | null, attendance = false, achievement = false) => ({
  registrationType,
  attendanceCertificatePossible: attendance,
  achievementCertificatePossible: achievement,
});

describe('getEditableEmailTemplateTypes', () => {
  it('returns nothing for external registration', () => {
    expect(getEditableEmailTemplateTypes(course(CourseRegistrationType_enum.EXTERNAL_REGISTRATION, true, true))).toEqual(
      []
    );
  });

  it('offers the application mails for the application process', () => {
    expect(getEditableEmailTemplateTypes(course(CourseRegistrationType_enum.APPROVAL_WITH_INPUT))).toEqual([
      'APPLICATION_RECEIVED',
      'INVITE',
      'DECLINE',
      'APPLICATION_CONFIRMED',
      'WAITLIST_NOTICE',
      'SESSION_REMINDER',
    ]);
    expect(getEditableEmailTemplateTypes(course(null))).toContain('APPLICATION_RECEIVED');
  });

  it('offers only the registration confirmation for direct registration', () => {
    for (const type of [CourseRegistrationType_enum.DIRECT_CONFIRMATION, CourseRegistrationType_enum.DIRECT_WITH_INPUT]) {
      expect(getEditableEmailTemplateTypes(course(type))).toEqual([
        'REGISTRATION_CONFIRMED',
        'WAITLIST_NOTICE',
        'SESSION_REMINDER',
      ]);
    }
  });

  it('offers the paid confirmation for registration with payment', () => {
    for (const type of [
      CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT,
      CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT,
    ]) {
      const types = getEditableEmailTemplateTypes(course(type));
      expect(types).toContain('REGISTRATION_CONFIRMED_PAID');
      expect(types).not.toContain('REGISTRATION_CONFIRMED');
      expect(types).not.toContain('CANCELLATION_REQUEST_ORGANIZER');
    }
  });

  it('adds the certificate mails only for enabled certificates', () => {
    const attendanceOnly = getEditableEmailTemplateTypes(course(CourseRegistrationType_enum.DIRECT_CONFIRMATION, true));
    expect(attendanceOnly).toContain('CERTIFICATE_ATTENDANCE_READY');
    expect(attendanceOnly).not.toContain('CERTIFICATE_ACHIEVEMENT_READY');

    const achievementOnly = getEditableEmailTemplateTypes(
      course(CourseRegistrationType_enum.APPROVAL_WITH_INPUT, false, true)
    );
    expect(achievementOnly).toContain('CERTIFICATE_ACHIEVEMENT_READY');
    expect(achievementOnly).not.toContain('CERTIFICATE_ATTENDANCE_READY');
  });

  it('never offers technical templates', () => {
    const types = getEditableEmailTemplateTypes(course(CourseRegistrationType_enum.APPROVAL_WITH_INPUT, true, true));
    expect(types).not.toContain('ORGANIZER_ADDED');
    expect(types).not.toContain('APPLICATION_RECEIVED_PAID');
  });
});
