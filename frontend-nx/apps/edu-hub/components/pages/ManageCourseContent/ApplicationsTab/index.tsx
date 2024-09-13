import { QueryResult } from '@apollo/client';
import { FC, useCallback, useMemo, useState } from 'react';
import { Button } from '../../../common/Button';

import {
  ManagedCourse_Course_by_pk,
  ManagedCourse_Course_by_pk_CourseEnrollments,
} from '../../../../graphql/__generated__/ManagedCourse';
import { ApplicationRow } from './ApplicationRow';
import Dot from '../../../common/Dot';
import { OnlyAdmin } from '../../../common/OnlyLoggedIn';
import {
  identityEventMapper,
  pickIdPkMapper,
  useAdminMutation,
  useRoleMutation,
  useUpdateCallback2,
} from '../../../../hooks/authedMutation';
import {
  UpdateEnrollmentRating,
  UpdateEnrollmentRatingVariables,
} from '../../../../graphql/__generated__/UpdateEnrollmentRating';
import { UPDATE_ENROLLMENT_STATUS, UPDATE_ENROLLMENT_RATING } from '../../../../graphql/mutations/insertEnrollment';
import { Button as OldButton } from '../../../common/Button';
import { Dialog, DialogTitle } from '@mui/material';
import { MdClose } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAdminQuery } from '../../../../hooks/authedQuery';
import { MailTemplates } from '../../../../graphql/__generated__/MailTemplates';
import { INSERT_MAIL_LOG, MAIL_TEMPLATES } from '../../../../graphql/queries/mail';
import { useDisplayDate } from '../../../../helpers/dateTimeHelpers';
import { InsertMailLog, InsertMailLogVariables } from '../../../../graphql/__generated__/InsertMailLog';
import {
  UpdateEnrollmentStatus,
  UpdateEnrollmentStatusVariables,
} from '../../../../graphql/__generated__/UpdateEnrollmentStatus';
import useTranslation from 'next-translate/useTranslation';
import { AuthRoles } from '../../../../types/enums';
import AddButton from '../../../common/AddButton';
import Modal from '../../../common/Modal';
import AddParticipantsForm from './AddParticipantsForm';
import { useCurrentRole } from '../../../../hooks/authentication';

interface IProps {
  course: ManagedCourse_Course_by_pk;
  qResult: QueryResult<any, any>;
}

const now = new Date();
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

export const ApplicationsTab: FC<IProps> = ({ course, qResult }) => {
  const { t, lang } = useTranslation('manageCourse');
  const displayDate = useDisplayDate();

  const infoDots = (
    <>
    <div>{t('course-page:application-rating')}</div>
    <div className="grid grid-cols-6 text-gray-400">
      <div>
        <Dot color="lightgreen" /> {t('course-page:invite')}
      </div>
      <div>
        <Dot color="orange" /> {t('course-page:unclear')}
      </div>
      <div>
        <Dot color="red" /> {t('course-page:reject')}
      </div>
      <div>
        <Dot color="grey" /> {t('course-page:not-rated')}
      </div>
      <div />
      <div />
    </div>
  </>
);

  const currentRole = useCurrentRole();

  const [selectedEnrollments, setSelectedEnrollments] = useState([] as number[]);

  const [inviteExpireDate, setInviteExpireDate] = useState(nextWeek);
  const handleSetInviteExpireDate = useCallback(
    (d: Date | null) => {
      setInviteExpireDate(d || new Date());
    },
    [setInviteExpireDate]
  );
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const handleCloseInviteDialog = useCallback(() => {
    setIsInviteDialogOpen(false);
  }, [setIsInviteDialogOpen]);
  const handleOpenInviteDialog = useCallback(() => {
    setIsInviteDialogOpen(true);
  }, [setIsInviteDialogOpen]);

  const queryMailTemplates = useAdminQuery<MailTemplates>(MAIL_TEMPLATES, {
    skip: currentRole !== AuthRoles.admin,
  });
  const mailTemplates = queryMailTemplates.data;
  if (queryMailTemplates.error) {
    console.log('fail to query mail templates!', queryMailTemplates);
  }

  const [insertMailLogMutation] = useAdminMutation<InsertMailLog, InsertMailLogVariables>(INSERT_MAIL_LOG);
  const [updateEnrollmentStatus] = useRoleMutation<UpdateEnrollmentStatus, UpdateEnrollmentStatusVariables>(
    UPDATE_ENROLLMENT_STATUS
  );
  const handleSendInvitesAndRejections = useCallback(async () => {
    if (mailTemplates != null) {
      const inviteTemplate = mailTemplates.MailTemplate.find((x) => x.title === 'INVITE');
      const rejectTemplate = mailTemplates.MailTemplate.find((x) => x.title === 'DECLINE');

      if (inviteTemplate != null && rejectTemplate != null) {
        const relevantEnrollments = selectedEnrollments
          .map((eid) => {
            const ce = course.CourseEnrollments.find((e) => e.id === eid);
            return ce;
          })
          .filter(
            (x) => x != null && ['APPLIED', 'INVITED', 'REJECTED'].includes(x.status)
          ) as ManagedCourse_Course_by_pk_CourseEnrollments[];

        try {
          for (const enrollment of relevantEnrollments) {
            let template;
            let newStatus;
            if (enrollment.motivationRating === 'INVITE') {
              template = { ...inviteTemplate };
              newStatus = 'INVITED';
            } else if (enrollment.motivationRating === 'DECLINE') {
              template = { ...rejectTemplate };
              newStatus = 'REJECTED';
            } else {
              continue;
            }

            const doReplace = (source: string) => {
              return source
                .replaceAll('[User:Firstname]', enrollment.User.firstName)
                .replaceAll('[User:LastName]', enrollment.User.lastName)
                .replaceAll('[Enrollment:ExpirationDate]', displayDate(inviteExpireDate))
                .replaceAll('[Enrollment:CourseId--Course:Name]', course.title)
                .replaceAll('[Enrollment:CourseLink]', `${window.location.origin}/course/${course.id}`);
            };

            template.content = doReplace(template.content);
            template.subject = doReplace(template.subject);

            await insertMailLogMutation({
              variables: {
                bcc: template.bcc,
                cc: template.cc,
                content: template.content,
                from: template.from || 'noreply@opencampus.sh',
                status: 'READY_TO_SEND',
                subject: template.subject,
                to: enrollment.User.email,
              },
            });

            await updateEnrollmentStatus({
              variables: {
                enrollmentId: enrollment.id,
                expire: newStatus === 'INVITED' ? inviteExpireDate : null,
                status: newStatus,
              },
            });
          }
        } finally {
          qResult.refetch();
          setIsInviteDialogOpen(false);
          setSelectedEnrollments([]);
        }
      } else {
        console.log('Missing mail templates INVITE and/or REJECT, cannot send invite and rejection mails!');
      }
    }
  }, [
    mailTemplates,
    selectedEnrollments,
    insertMailLogMutation,
    updateEnrollmentStatus,
    qResult,
    setIsInviteDialogOpen,
    inviteExpireDate,
    course,
    displayDate,
  ]);

  const handleSelectRow = useCallback(
    (enrollmentId: number, selected: boolean) => {
      if (selected) {
        if (!selectedEnrollments.includes(enrollmentId)) {
          const copy = [...selectedEnrollments];
          copy.push(enrollmentId);
          setSelectedEnrollments(copy);
        }
      } else {
        setSelectedEnrollments(selectedEnrollments.filter((id) => id !== enrollmentId));
      }
    },
    [selectedEnrollments, setSelectedEnrollments]
  );

  const setEnrollmentRating = useUpdateCallback2<UpdateEnrollmentRating, UpdateEnrollmentRatingVariables>(
    UPDATE_ENROLLMENT_RATING,
    'enrollmentId',
    'rating',
    pickIdPkMapper,
    identityEventMapper,
    qResult
  );

  const courseEnrollments = useMemo(() => {
    const result = [...course.CourseEnrollments];
    result.sort((a, b) => a.id - b.id);
    return result;
  }, [course]);

  const getEmailsOfConfirmedApplications = () => {
    return courseEnrollments
      .filter((enrollment) => enrollment.status === 'CONFIRMED')
      .map((enrollment) => enrollment.User.email)
      .join(',');
  };

  const [isAddParticipantsModalOpen, setAddParticipantsModalOpen] = useState(false);

  const openAddParticipantsModal = () => setAddParticipantsModalOpen(true);
  const closeAddParticipantsModal = () => setAddParticipantsModalOpen(false);

  return (
    <>
      <OnlyAdmin>
        <div className="flex justify-start mt-4 mb-4 text-white">
          <AddButton title="add_participants" onClick={openAddParticipantsModal} translationNamespace="manageCourse" />
        </div>
        <Modal
          isOpen={isAddParticipantsModalOpen}
          onClose={closeAddParticipantsModal}
          title={t('manageCourse:add_participants')}
        >
          <AddParticipantsForm courseId={course.id} onSubmit={closeAddParticipantsModal} />
        </Modal>
      </OnlyAdmin>{' '}
      <div>
        {courseEnrollments.length > 0 ? (
          <>
            <div className="text-gray-400">
              <ApplicationRow
                enrollment={null}
                onSetRating={setEnrollmentRating}
                onSelectRow={handleSelectRow}
                isRowSelected={false}
              />
            </div>
            {courseEnrollments.map((enrollment) => (
              <ApplicationRow
                key={enrollment.id}
                enrollment={enrollment}
                onSetRating={setEnrollmentRating}
                onSelectRow={handleSelectRow}
                isRowSelected={selectedEnrollments.includes(enrollment.id)}
              />
            ))}

            <div className="mt-6 mb-3">{infoDots}</div>

            <OnlyAdmin>
              <div className="flex justify-end mb-6">
                <OldButton onClick={handleOpenInviteDialog} filled inverted>
                  {t('course-page:send-invitations')}
                </OldButton>
              </div>
            </OnlyAdmin>
          </>
        ) : (
          <p className="m-auto text-center mb-14 text-gray-400">{t('course-page:no-applications-present')}</p>
        )}
        <Button
          as="a"
          href={`mailto:?bcc=${getEmailsOfConfirmedApplications()}`}
          className="bg-edu-course-current rounded-full py-2 px-4"
          filled
        >
          {t('course-page:email-confirmed-applicants')}
        </Button>{' '}
      </div>
      <Dialog className="h" open={isInviteDialogOpen} onClose={handleCloseInviteDialog}>
        <DialogTitle>
          <div className="grid grid-cols-2">
            <div> {t('course-page:invite-applicants')} </div>
            <div className="cursor-pointer flex justify-end">
              <MdClose onClick={handleCloseInviteDialog} />
            </div>
          </div>
        </DialogTitle>

        <div className="m-16">
          <div className="grid grid-cols-2 h-64">
            <div className="mr-3">{t('course-page:invitation-deadline')}:</div>
            <div className="ml-3">
              <DatePicker
                dateFormat={lang === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy'}
                selected={inviteExpireDate}
                onChange={handleSetInviteExpireDate}
                minDate={now}
                locale={lang}
              />
            </div>
          </div>

          <div className="flex justify-center mt-16">
            <OldButton onClick={handleSendInvitesAndRejections}>{t('course-page:invite')}</OldButton>
          </div>
        </div>
      </Dialog>
    </>
  );
};
