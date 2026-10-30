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

  it('offers to invite again once an invitation has expired', () => {
    const onRenewInvitation = jest.fn();
    renderDetails({
      enrollment: { ...enrollment, status: 'EXPIRED', invitationExpirationDate: '2026-10-01' },
      isInvitationExpired: true,
      onRenewInvitation,
    } as Partial<React.ComponentProps<typeof ApplicationDetails>>);
    expect(screen.getByText(/status\.invitation_expired/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'application_details.reinvite' }));
    expect(onRenewInvitation).toHaveBeenCalled();
  });

  it('offers to extend a running invitation', () => {
    renderDetails({
      enrollment: { ...enrollment, status: 'INVITED', invitationExpirationDate: '2026-12-01' },
      onRenewInvitation: jest.fn(),
    } as Partial<React.ComponentProps<typeof ApplicationDetails>>);
    expect(screen.getByRole('button', { name: 'application_details.extend_invitation' })).toBeInTheDocument();
  });

  it('has no renewal button without the handler', () => {
    renderDetails({
      enrollment: { ...enrollment, status: 'EXPIRED', invitationExpirationDate: '2026-10-01' },
      isInvitationExpired: true,
    } as Partial<React.ComponentProps<typeof ApplicationDetails>>);
    expect(screen.queryByRole('button', { name: 'application_details.reinvite' })).not.toBeInTheDocument();
  });
  it('invites a single applicant from the rating panel', () => {
    const onPromote = jest.fn();
    renderDetails({ onPromote, promoteLabelKey: 'application_details.invite_single' });
    fireEvent.click(screen.getByRole('button', { name: 'application_details.invite_single' }));
    expect(onPromote).toHaveBeenCalled();
  });

  it('confirms someone from the waitlist of a direct registration, with their place in line', () => {
    const onPromote = jest.fn();
    renderDetails({
      enrollment: { ...enrollment, status: 'WAITLIST' },
      features: getRegistrationFeatures(CourseRegistrationType_enum.DIRECT_CONFIRMATION),
      onPromote,
      promoteLabelKey: 'application_details.confirm_from_waitlist',
      waitlistPosition: 2,
    });
    expect(screen.getByText('application_details.waitlist_position')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'application_details.confirm_from_waitlist' }));
    expect(onPromote).toHaveBeenCalled();
  });

  it('explains why a paid event has no way up from the waitlist', () => {
    renderDetails({
      enrollment: { ...enrollment, status: 'WAITLIST' },
      features: getRegistrationFeatures(CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT),
      promoteHintKey: 'application_details.paid_waitlist_not_supported',
    });
    expect(screen.getByText('application_details.paid_waitlist_not_supported')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /confirm_from_waitlist/ })).not.toBeInTheDocument();
  });
});
