import { jest } from '@jest/globals';
import { grantsCoverProgram, isOrgAdminOfCourse } from '../orgAdminScope.js';

const grant = (caps = {}) => ({
  canManageCourses: false,
  canManageEvents: false,
  canManageDegrees: false,
  canManageSettings: false,
  ...caps,
});

describe('grantsCoverProgram', () => {
  it('needs the capability that matches the program type', () => {
    expect(grantsCoverProgram('EVENTS', [grant({ canManageEvents: true })])).toBe(true);
    expect(grantsCoverProgram('EVENTS', [grant({ canManageCourses: true })])).toBe(false);
    expect(grantsCoverProgram('DEGREES', [grant({ canManageDegrees: true })])).toBe(true);
  });

  it('lets a settings admin manage every program type', () => {
    expect(grantsCoverProgram('COURSES', [grant({ canManageSettings: true })])).toBe(true);
  });

  it('refuses without a grant', () => {
    expect(grantsCoverProgram('COURSES', [])).toBe(false);
    expect(grantsCoverProgram('COURSES', undefined)).toBe(false);
  });
});

describe('isOrgAdminOfCourse', () => {
  it('reads the grants of the course organization for the user', async () => {
    const client = {
      request: jest.fn().mockResolvedValue({
        Course_by_pk: { Program: { type: 'COURSES', Organization: { OrganizationAdmins: [grant({ canManageCourses: true })] } } },
      }),
    };
    await expect(isOrgAdminOfCourse(client, 'u-1', 5)).resolves.toBe(true);
    expect(client.request).toHaveBeenCalledWith(expect.any(String), { courseId: 5, userId: 'u-1' });
  });

  it('refuses a missing course or user without asking', async () => {
    const client = { request: jest.fn().mockResolvedValue({ Course_by_pk: null }) };
    await expect(isOrgAdminOfCourse(client, 'u-1', 5)).resolves.toBe(false);
    await expect(isOrgAdminOfCourse(client, null, 5)).resolves.toBe(false);
    expect(client.request).toHaveBeenCalledTimes(1);
  });
});
