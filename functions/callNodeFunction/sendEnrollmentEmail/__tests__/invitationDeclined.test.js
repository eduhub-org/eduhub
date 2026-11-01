import { jest } from '@jest/globals';

const queueEmailMock = jest.fn();
jest.unstable_mockModule('../../lib/queueEmail.js', () => ({ queueEmail: queueEmailMock }));

const { isDeclinedByParticipant, notifyOrganizersOfDecline } = await import('../invitationDeclined.js');

const event = (sessionUserId, oldStatus = 'INVITED', newStatus = 'CANCELLED') => ({
  op: 'UPDATE',
  session_variables: sessionUserId ? { 'x-hasura-user-id': sessionUserId, 'x-hasura-role': 'user' } : {},
  data: { old: { status: oldStatus, userId: 'AAA' }, new: { status: newStatus, userId: 'aaa' } },
});

describe('isDeclinedByParticipant', () => {
  it('is a decline when the invited person cancelled the invitation themselves', () => {
    expect(isDeclinedByParticipant(event('aaa'))).toBe(true);
  });

  it('is not a decline when an organizer cancelled it or the admin secret did', () => {
    expect(isDeclinedByParticipant(event('organizer-id'))).toBe(false);
    expect(isDeclinedByParticipant(event(null))).toBe(false);
  });

  it('is not a decline for other changes', () => {
    expect(isDeclinedByParticipant(event('aaa', 'CONFIRMED', 'CANCELLED'))).toBe(false);
    expect(isDeclinedByParticipant(event('aaa', 'INVITED', 'EXPIRED'))).toBe(false);
  });
});

describe('notifyOrganizersOfDecline', () => {
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
  const user = (id, email) => ({ id, firstName: id, lastName: 'X', email });
  const enrollment = {
    id: 5,
    User: user('p-1', 'participant@example.com'),
    Course: {
      id: 9,
      title: 'Workshop',
      CourseInstructors: [{ User: user('i-1', 'ina@example.com') }],
      Program: {
        type: 'EVENTS',
        Organization: {
          OrganizationAdmins: [
            { canManageEvents: true, canManageCourses: false, canManageDegrees: false, canManageSettings: false, User: user('a-1', 'eve@example.com') },
            { canManageEvents: false, canManageCourses: true, canManageDegrees: false, canManageSettings: false, User: user('a-2', 'carl@example.com') },
          ],
        },
      },
    },
  };

  beforeEach(() => {
    queueEmailMock.mockReset().mockResolvedValue({ success: true });
  });

  it('queues the decline email to every organizer of the course', async () => {
    const client = { request: jest.fn().mockResolvedValue({ CourseEnrollment_by_pk: enrollment }) };

    await notifyOrganizersOfDecline(5, client, logger);

    expect(client.request).toHaveBeenCalledWith(expect.anything(), { enrollmentId: 5 });
    expect(queueEmailMock.mock.calls.map(([args]) => [args.templateType, args.recipientEmail])).toEqual([
      ['INVITATION_DECLINED_ORGANIZER', 'ina@example.com'],
      ['INVITATION_DECLINED_ORGANIZER', 'eve@example.com'],
    ]);
  });

  it('never throws when the lookup fails', async () => {
    const client = { request: jest.fn().mockRejectedValue(new Error('down')) };

    await expect(notifyOrganizersOfDecline(5, client, logger)).resolves.toBeUndefined();
    expect(queueEmailMock).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
