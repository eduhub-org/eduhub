import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CourseRegistrationType_enum } from '../../../../../__generated__/globalTypes';
import { RegistrationButton } from '../RegistrationButton';

let mockLocale = 'de';
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

const course = (overrides: Record<string, unknown> = {}) =>
  ({
    applicationEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    externalRegistrationLink: null,
    registrationButtonLabelDe: null,
    registrationButtonLabelEn: null,
    ...overrides,
  }) as any;

const renderButton = (courseOverrides: Record<string, unknown> = {}, isCourseFull = false) =>
  render(
    <RegistrationButton
      course={course(courseOverrides)}
      registrationType={CourseRegistrationType_enum.APPROVAL_WITH_INPUT}
      onClick={jest.fn()}
      isCourseFull={isCourseFull}
    />
  );

describe('RegistrationButton label', () => {
  beforeEach(() => {
    mockLocale = 'de';
  });

  it('uses the label derived from the registration type by default', () => {
    renderButton();
    expect(screen.getByRole('button')).toHaveTextContent('registration.apply_now');
  });

  it('uses the custom label for the current locale', () => {
    const labels = { registrationButtonLabelDe: 'Jetzt mitmachen', registrationButtonLabelEn: 'Join now' };
    renderButton(labels);
    expect(screen.getByRole('button')).toHaveTextContent('Jetzt mitmachen');
  });

  it('falls back to the default when the current locale has no custom label', () => {
    mockLocale = 'en';
    renderButton({ registrationButtonLabelDe: 'Jetzt mitmachen' });
    expect(screen.getByRole('button')).toHaveTextContent('registration.apply_now');
  });

  it('still offers the waitlist when the course is full', () => {
    renderButton({ registrationButtonLabelDe: 'Jetzt mitmachen' }, true);
    expect(screen.getByRole('button')).toHaveTextContent('registration.join_waitlist');
  });
});
