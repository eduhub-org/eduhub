import { CourseRegistrationType_enum } from '../../../../__generated__/globalTypes';
import { flagsToRegistrationType, registrationTypeToFlags } from '../registrationFlags';

describe('registrationFlags', () => {
  it('round-trips every registration type', () => {
    for (const type of Object.values(CourseRegistrationType_enum)) {
      expect(flagsToRegistrationType(registrationTypeToFlags(type))).toBe(type);
    }
  });

  it('treats a missing type as an application', () => {
    expect(registrationTypeToFlags(null)).toEqual({
      external: false,
      application: true,
      questionnaire: true,
      payment: false,
    });
  });

  it('ignores questionnaire and payment while the application process is on', () => {
    expect(
      flagsToRegistrationType({ external: false, application: true, questionnaire: false, payment: true })
    ).toBe(CourseRegistrationType_enum.APPROVAL_WITH_INPUT);
  });

  it('lets external registration win over all other switches', () => {
    expect(
      flagsToRegistrationType({ external: true, application: true, questionnaire: true, payment: true })
    ).toBe(CourseRegistrationType_enum.EXTERNAL_REGISTRATION);
  });
});
