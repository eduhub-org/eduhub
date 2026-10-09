import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ApplicationDetails } from '../ApplicationDetails';
import { getRegistrationFeatures } from '../registrationConfig';
import { CourseRegistrationType_enum, MotivationRating_enum } from '../../../../../__generated__/globalTypes';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const enrollment = {
  __typename: 'CourseEnrollment',
  id: 1,
  courseId: 7,
  userId: 'u1',
  status: 'APPLIED',
  motivationRating: MotivationRating_enum.UNRATED,
  motivationLetter: 'I want to learn.',
  questionnaireResponse: null,
  created_at: '2026-10-01T10:00:00Z',
  invitationExpirationDate: null,
  User: {
    __typename: 'User',
    email: 'lena@example.com',
    organizationName: null,
    Organization: null,
    CourseEnrollments: [],
  },
} as unknown as React.ComponentProps<typeof ApplicationDetails>['enrollment'];

const renderDetails = (props: Partial<React.ComponentProps<typeof ApplicationDetails>> = {}) => {
  const onRate = jest.fn();
  const expandNext = jest.fn();
  render(
    <>
      <input aria-label="search" />
      <ApplicationDetails
        enrollment={enrollment}
        features={getRegistrationFeatures(CourseRegistrationType_enum.APPROVAL_WITH_INPUT)}
        surveyUrl={null}
        onRate={onRate}
        displayDate={(date) => date ?? ''}
        isActive
        expandNext={expandNext}
        {...props}
      />
    </>
  );
  return { onRate, expandNext };
};

describe('ApplicationDetails', () => {
  it('rates and jumps with the keyboard while it is the active row', () => {
    const { onRate, expandNext } = renderDetails();
    fireEvent.keyDown(window, { key: '1' });
    expect(onRate).toHaveBeenCalledWith(MotivationRating_enum.INVITE);
    fireEvent.keyDown(window, { key: '0' });
    expect(onRate).toHaveBeenLastCalledWith(MotivationRating_enum.UNRATED);
    fireEvent.keyDown(window, { key: 'j' });
    expect(expandNext).toHaveBeenCalled();
  });

  it('ignores keys typed into a field', () => {
    const { onRate } = renderDetails();
    fireEvent.keyDown(screen.getByLabelText('search'), { key: '1' });
    expect(onRate).not.toHaveBeenCalled();
  });

  it('does not listen when it is not the active row', () => {
    const { onRate } = renderDetails({ isActive: false });
    fireEvent.keyDown(window, { key: '1' });
    expect(onRate).not.toHaveBeenCalled();
  });

  it('rates with the buttons and offers the next application', () => {
    const { onRate, expandNext } = renderDetails();
    fireEvent.click(screen.getByRole('button', { name: /rating\.reject/ }));
    expect(onRate).toHaveBeenCalledWith(MotivationRating_enum.DECLINE);
    fireEvent.click(screen.getByRole('button', { name: /application_details\.next_application/ }));
    expect(expandNext).toHaveBeenCalled();
  });
});
