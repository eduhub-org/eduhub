import { certificateActionErrorMessage } from './certificateMessages';

/** Stand-in for a next-intl translator scoped to `manageCourse`. */
const translator = (known: Record<string, string>) =>
  Object.assign((key: string) => known[key] ?? key, { has: (key: string) => key in known });

const t = translator({
  'errors.certificates.DEGREE_REQUIREMENTS_NOT_MET': 'The degree requirements are not met yet.',
});

const FALLBACK = 'Certificate generation failed.';

describe('certificateActionErrorMessage', () => {
  it('combines the translated message with the backend detail', () => {
    const message = certificateActionErrorMessage(
      {
        messageKey: 'DEGREE_REQUIREMENTS_NOT_MET',
        error: 'Degree requirements not met for 1 selected participant(s): Maya Albrecht (0 of 1 events)',
      },
      t,
      FALLBACK
    );

    expect(message).toBe(
      'The degree requirements are not met yet. (Degree requirements not met for 1 selected participant(s): Maya Albrecht (0 of 1 events))'
    );
  });

  it('uses the translation alone when the backend sends no detail', () => {
    expect(
      certificateActionErrorMessage({ messageKey: 'DEGREE_REQUIREMENTS_NOT_MET' }, t, FALLBACK)
    ).toBe('The degree requirements are not met yet.');
  });

  it('falls back to the backend detail for an untranslated message key', () => {
    expect(
      certificateActionErrorMessage({ messageKey: 'BRAND_NEW_KEY', error: 'raw detail' }, t, FALLBACK)
    ).toBe('raw detail');
  });

  it('falls back to the generic message when nothing usable is returned', () => {
    expect(certificateActionErrorMessage({ messageKey: '  ', error: '  ' }, t, FALLBACK)).toBe(FALLBACK);
    expect(certificateActionErrorMessage(null, t, FALLBACK)).toBe(FALLBACK);
    expect(certificateActionErrorMessage(undefined, t, FALLBACK)).toBe(FALLBACK);
  });
});
