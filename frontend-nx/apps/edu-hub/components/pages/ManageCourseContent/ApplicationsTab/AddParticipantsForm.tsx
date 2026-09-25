import React, { FC, useMemo, useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../../../common/Button';
import TagSelector from '../../../inputs/TagSelector';
import RadioButtonSelector from '../../../inputs/RadioButtonSelector';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { USER_LIST } from '../../../../queries/user';
import { UpdateEnrollment, UpdateEnrollmentVariables } from '../../../../queries/__generated__/UpdateEnrollment';
import { UPDATE_ENROLLMENT } from '../../../../queries/insertEnrollment';
import { CourseEnrollmentStatus_enum } from '../../../../__generated__/globalTypes';

interface AddParticipantsFormProps {
  courseId: number;
  hasApplicationProcess: boolean;
  hasCourseStarted: boolean;
  onSubmit: () => void;
}

export const AddParticipantsForm: FC<AddParticipantsFormProps> = ({
  courseId,
  hasApplicationProcess,
  hasCourseStarted,
  onSubmit,
}) => {
  const t = useTranslations('manageCourse');

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
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 w-[400px] h-[400px]">
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
      {userSelectionError && <div className="text-red-500 mt-4">{userSelectionError}</div>}

      <div className="flex justify-center my-8">
        <Button filled type="submit">
          {t('submit')}
        </Button>
      </div>
    </form>
  );
};

export default AddParticipantsForm;
