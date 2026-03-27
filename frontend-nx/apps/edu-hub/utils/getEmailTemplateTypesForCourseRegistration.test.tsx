import { CourseRegistrationType_enum } from '../__generated__/globalTypes';
import { getEmailTemplateTypesForCourseRegistration } from './getEmailTemplateTypesForCourseRegistration';

describe('getEmailTemplateTypesForCourseRegistration', () => {
  it('returns empty for external or missing registration type', () => {
    expect(getEmailTemplateTypesForCourseRegistration(null)).toEqual([]);
    expect(getEmailTemplateTypesForCourseRegistration(CourseRegistrationType_enum.EXTERNAL_REGISTRATION)).toEqual(
      []
    );
  });

  it('includes INVITE and paid variants for direct registration types', () => {
    const directTypes = [
      CourseRegistrationType_enum.DIRECT_WITH_INPUT,
      CourseRegistrationType_enum.DIRECT_CONFIRMATION,
      CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT,
      CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT,
    ];
    for (const rt of directTypes) {
      const types = getEmailTemplateTypesForCourseRegistration(rt);
      expect(types).toContain('INVITE');
      expect(types).toContain('APPLICATION_RECEIVED_PAID');
      expect(types).toContain('REGISTRATION_CONFIRMED_PAID');
    }
  });

  it('excludes self-registration confirmed templates for approval flow', () => {
    const types = getEmailTemplateTypesForCourseRegistration(CourseRegistrationType_enum.APPROVAL_WITH_INPUT);
    expect(types).toContain('INVITE');
    expect(types).not.toContain('REGISTRATION_CONFIRMED');
    expect(types).not.toContain('REGISTRATION_CONFIRMED_PAID');
  });
});
