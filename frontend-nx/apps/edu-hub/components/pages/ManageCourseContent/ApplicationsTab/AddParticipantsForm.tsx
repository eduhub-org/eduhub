import React, { FC, useMemo, useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../../../common/Button';
import TagSelector from '../../../inputs/TagSelector';
import RadioButtonSelector from '../../../inputs/RadioButtonSelector';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { USER_LIST } from '../../../../queries/user';
import { UpdateEnrollment, UpdateEnrollmentVariables } from '../../../../queries/__generated__/UpdateEnrollment';
import { COURSE_ENROLLMENT_STATUSES_OF_USERS, UPDATE_ENROLLMENT } from '../../../../queries/insertEnrollment';
import {
  CourseEnrollmentStatusesOfUsers,
  CourseEnrollmentStatusesOfUsersVariables,
} from '../../../../queries/__generated__/CourseEnrollmentStatusesOfUsers';
import {
  CourseEnrollmentStatus_enum,
  CourseRegistrationType_enum,
  MailTemplateType_enum,
} from '../../../../__generated__/globalTypes';
import { MdWarningAmber } from 'react-icons/md';
import { StatusChangeEmailNotice } from '../../../common/StatusChangeEmailNotice';
import { enrollmentStatusMailTemplate } from '../../../../helpers/enrollmentStatusEmail';

interface AddParticipantsFormProps {
  courseId: number;
  registrationType: CourseRegistrationType_enum | null;
  hasApplicationProcess: boolean;
  hasCourseStarted: boolean;
  /** Places still free, null without a limit. Organizers may add beyond it; the form warns. */
  freePlaces: number | null;
  takenPlaces: number;
  maxParticipants: number | null;
  onSubmit: () => void;
}

/** Statuses that hold a place in the course. */
const PLACE_TAKING_STATUSES: string[] = [
  CourseEnrollmentStatus_enum.CONFIRMED,
  CourseEnrollmentStatus_enum.INVITED,
  CourseEnrollmentStatus_enum.REGISTERED,
];

export const AddParticipantsForm: FC<AddParticipantsFormProps> = ({
  courseId,
  registrationType,
  hasApplicationProcess,
  hasCourseStarted,
  freePlaces,
  takenPlaces,
  maxParticipants,
  onSubmit,
}) => {
  const t = useTranslations('manageCourse');
  const tCommon = useTranslations('common');

  // Once a course/event has started, "aborted" ("Teilnahme abgebrochen") is the meaningful
  // status for someone dropping out; beforehand it's "cancelled" ("Registrierung storniert").
  const dropoutStatus = hasCourseStarted
    ? CourseEnrollmentStatus_enum.ABORTED
    : CourseEnrollmentStatus_enum.CANCELLED;
  const dropoutLabel = hasCourseStarted ? t('add_as_aborted') : t('add_as_cancelled');

  // State hooks
  const [selectedUserIds, setSelectedUserIds] = useState<{ id: string; name: string }[]>([]);
  const [selectedStatus, setSelectedStatus] = useState(
    hasApplicationProcess ? CourseEnrollmentStatus_enum.APPLIED : CourseEnrollmentStatus_enum.CONFIRMED
  );
  const [userSelectionError, setUserSelectionError] = useState<string | null>(null);

  // GraphQL hooks
  const { data, loading, error } = useRoleQuery(USER_LIST);
  const [insertEnrollment] = useRoleMutation<UpdateEnrollment, UpdateEnrollmentVariables>(UPDATE_ENROLLMENT, {
    // The applications table is paged server-side via ManagedCourseApplications
    // (not part of the ManagedCourse payload anymore), so it must be refetched
    // explicitly for the new participants to appear without a reload.
    refetchQueries: ['ManagedCourseApplications', 'ManagedCourse'],
  });

  // Memoized user list based on GraphQL query
  const availableUsers = useMemo(() => {
    if (data && !loading && !error) {
      return data.User.map((user: { id: string; firstName: string; lastName: string; email: string }) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName} (${user.email})`,
      }));
    }
    return [];
  }, [data, loading, error]);

  // Enum to radio button options. Applied/invited only make sense when the course/event
  // has an approval-based application process; direct registrations only ever go
  // straight to confirmed (or later get cancelled/aborted).
  const radioOptions = [
    ...(hasApplicationProcess
      ? [
          { value: CourseEnrollmentStatus_enum.APPLIED, label: t('add_as_applied') },
          { value: CourseEnrollmentStatus_enum.INVITED, label: t('add_as_invited') },
        ]
      : []),
    { value: CourseEnrollmentStatus_enum.CONFIRMED, label: t('add_as_confirmed') },
    { value: dropoutStatus, label: dropoutLabel },
  ];

  // Someone selected may already be enrolled: that decides which email the change sends (from
  // the waitlist it is WAITLIST_CONFIRMED) and whether it takes a new place at all.
  const { data: currentEnrollments, error: currentEnrollmentsError } = useRoleQuery<
    CourseEnrollmentStatusesOfUsers,
    CourseEnrollmentStatusesOfUsersVariables
  >(COURSE_ENROLLMENT_STATUSES_OF_USERS, {
    variables: { courseId, userIds: selectedUserIds.map((user) => user.id) },
    skip: selectedUserIds.length === 0,
    // Statuses change under us (other organizers, our own last submit): never trust the cache.
    fetchPolicy: 'network-only',
  });
  // Until the lookup has answered, nobody's status is known: no preview rather than a wrong one,
  // and no submit either, so nobody is confirmed without seeing the email and overbooking notes.
  const statusesKnown = selectedUserIds.length > 0 && !!currentEnrollments && !currentEnrollmentsError;
  const waitingForStatuses = selectedUserIds.length > 0 && !statusesKnown;
  const currentStatusOf = useMemo(
    () => new Map((currentEnrollments?.CourseEnrollment ?? []).map((e) => [e.userId, e.status as string])),
    [currentEnrollments]
  );

  // An unchanged status triggers no email.
  const emails = useMemo(() => {
    const countByTemplate = new Map<MailTemplateType_enum | null, number>();
    for (const user of selectedUserIds) {
      const oldStatus = currentStatusOf.get(user.id) ?? null;
      const template =
        oldStatus === selectedStatus
          ? null
          : enrollmentStatusMailTemplate({ oldStatus, newStatus: selectedStatus, registrationType });
      countByTemplate.set(template, (countByTemplate.get(template) ?? 0) + 1);
    }
    return [...countByTemplate].map(([template, count]) => ({ template, count }));
  }, [selectedUserIds, currentStatusOf, selectedStatus, registrationType]);

  // Adding people beyond the free places is allowed; the form only warns. People who already
  // hold a place take no new one.
  const newPlaces = PLACE_TAKING_STATUSES.includes(selectedStatus)
    ? selectedUserIds.filter((user) => !PLACE_TAKING_STATUSES.includes(currentStatusOf.get(user.id) ?? '')).length
    : 0;
  const overbooking = freePlaces != null ? Math.max(0, newPlaces - freePlaces) : 0;

  // An organizer's override: someone confirmed here takes part without the checkout.
  const isPaidRegistration =
    registrationType === CourseRegistrationType_enum.DIRECT_CONFIRMATION_AND_PAYMENT ||
    registrationType === CourseRegistrationType_enum.DIRECT_WITH_INPUT_AND_PAYMENT;

  // Event handlers
  const handleUserSelection = (newUserIds: { id: string; name: string }[]) => setSelectedUserIds(newUserIds);
  const handleStatusSelection = (newValue: string) => setSelectedStatus(newValue as CourseEnrollmentStatus_enum);

  // Submit form
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      setUserSelectionError(t('add_user_error'));
      return;
    }
    setUserSelectionError(null); // Clear any previous errors

    // A user holding a preview enrollment on this course is left out by the
    // upsert (affected_rows 0) rather than silently turned into a hidden
    // participant, so say who was skipped instead of closing the form.
    const skippedUsers: { id: string; name: string }[] = [];
    for (const user of selectedUserIds) {
      const result = await insertEnrollment({
        variables: {
          courseId,
          userId: user.id,
          motivationLetter: 'Manually added user.',
          status: selectedStatus as CourseEnrollmentStatus_enum,
        },
      }).catch((err) => console.error(`Failed to insert for user ${user.id}: ${err}`));
      if (result && !result.data?.insert_CourseEnrollment?.affected_rows) {
        skippedUsers.push(user);
      }
    }

    if (skippedUsers.length > 0) {
      setSelectedUserIds(skippedUsers);
      setUserSelectionError(
        t('add_user_preview_conflict', { names: skippedUsers.map((user) => user.name).join(', ') })
      );
      return;
    }

    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 w-[400px] min-h-[400px]">
      <TagSelector
        variant="material"
        label={t('selected_users')}
        placeholder={t('name_or_email')}
        itemId={0}
        values={selectedUserIds as unknown as { id: number; name: string }[]}
        options={availableUsers as unknown as { id: number; name: string }[]}
        onValueUpdated={handleUserSelection}
        refetchQueries={[]}
      />
      <RadioButtonSelector
        className="mt-8"
        immediateCommit={false}
        label={t('status_label')}
        itemId={0}
        currentValue={selectedStatus}
        radioOptions={radioOptions}
        onSelectedValueChange={handleStatusSelection}
        refetchQueries={[]}
      />
      {isPaidRegistration && selectedStatus === CourseEnrollmentStatus_enum.CONFIRMED && (
        <p className="mt-4 text-sm text-label-secondary">{t('add_paid_no_payment_hint')}</p>
      )}
      {statusesKnown && overbooking > 0 && maxParticipants != null && (
        <p className="mt-4 flex items-start gap-2 text-sm text-warning" role="alert">
          <MdWarningAmber className="mt-0.5 flex-shrink-0" aria-hidden="true" />
          {t('bulk_actions.overbook_warning', {
            count: overbooking,
            taken: takenPlaces + newPlaces,
            max: maxParticipants,
          })}
        </p>
      )}
      {statusesKnown && <StatusChangeEmailNotice courseId={courseId} emails={emails} />}
      {currentEnrollmentsError && (
        <div className="text-red-500 mt-4">{tCommon('status_email.lookup_failed')}</div>
      )}
      {userSelectionError && <div className="text-red-500 mt-4">{userSelectionError}</div>}

      <div className="flex justify-center my-8">
        <Button filled type="submit" disabled={waitingForStatuses}>
          {t('submit')}
        </Button>
      </div>
    </form>
  );
};

export default AddParticipantsForm;
