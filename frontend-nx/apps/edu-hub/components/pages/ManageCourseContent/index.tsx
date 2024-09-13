import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { MANAGED_COURSE, UPDATE_COURSE_STATUS } from '../../../graphql/queries/course/course';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk,
} from '../../../graphql/__generated__/ManagedCourse';
import { UpdateCourseStatus, UpdateCourseStatusVariables } from '../../../graphql/__generated__/UpdateCourseStatus';
import { AlertMessageDialog } from '../../common/dialogs/AlertMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { PageBlock } from '../../common/PageBlock';
import { DescriptionTab } from './DescriptionTab';
import { SessionsTab } from './SessionsTab';
import { ApplicationsTab } from './ApplicationsTab';
import { CourseParticipationsTab } from './CourseParticipationsTab';
import { DegreeParticipationsTab } from './DegreeParticipationsTab';
import { useIsAdmin, useIsUserIdInList } from '../../../hooks/authentication';

interface Props {
  courseId: number;
}

const determineTabClasses = (tabIndex: number, selectedTabIndex: number) => {
  const maxAllowedTab = 5;

  if (tabIndex === selectedTabIndex) {
    return 'bg-gray-800 text-white';
  }

  if (tabIndex < maxAllowedTab) {
    return 'bg-edu-confirmed cursor-pointer';
  }

  if (tabIndex === maxAllowedTab) {
    return 'bg-edu-dark-gray cursor-pointer';
  }

  return 'bg-edu-light-gray';
};

const getNextCourseStatus = (course: ManagedCourse_Course_by_pk) => {
  switch (course.status) {
    case 'DRAFT':
      return 'READY_FOR_PUBLICATION';
    case 'READY_FOR_PUBLICATION':
      return 'READY_FOR_APPLICATION';
    case 'READY_FOR_APPLICATION':
      return 'APPLICANTS_INVITED';
    default:
      return course.status;
  }
};

/**
 *
 *  Course status behavior:
 * DRAFT -> Only enable Kurzbeschreibung
 * READY_FOR_PUBLICATION -> allow to add Termine
 * READY_FOR_APPLICATION -> allow to view applications
 * APPLICANTS_INVITED/PARTICIPANTS_RATED -> allow to view everything
 *
 * the highest option available is selected by default!
 *
 * PARTICIPANTS_RATED is reached by clicking "zertifikate generieren", which is only shown in status APPLICANTS_INVITED
 *
 * @returns {any} the component
 */
export const ManageCourseContent: FC<Props> = ({ courseId }) => {
  const { t } = useTranslation('manageCourse');

  const qResult = useRoleQuery<ManagedCourse, ManagedCourseVariables>(MANAGED_COURSE, {
    variables: {
      id: courseId,
    },
  });

  const isAdmin = useIsAdmin();
  const instructorIds = qResult?.data?.Course_by_pk?.CourseInstructors.map((ci) => ci.Expert.User.id);
  const isInstructorOfCourse = useIsUserIdInList(instructorIds);

  if (qResult.error) {
    console.log('query managed course error!', qResult.error);
  }

  const course: ManagedCourse_Course_by_pk | null = qResult.data?.Course_by_pk || null;

  const maxAllowedTab = 5;

  const [openTabIndex, setOpenTabIndex] = useState(0);

  const openTab0 = useCallback(() => {
    if (maxAllowedTab >= 0) {
      setOpenTabIndex(0);
    }
  }, [setOpenTabIndex, maxAllowedTab]);

  const openTab1 = useCallback(() => {
    if (maxAllowedTab >= 1) {
      setOpenTabIndex(1);
    }
  }, [setOpenTabIndex, maxAllowedTab]);

  const openTab2 = useCallback(() => {
    if (maxAllowedTab >= 2) {
      setOpenTabIndex(2);
    }
  }, [setOpenTabIndex, maxAllowedTab]);

  const openTab3 = useCallback(() => {
    if (maxAllowedTab >= 3) {
      setOpenTabIndex(3);
    }
  }, [setOpenTabIndex, maxAllowedTab]);

  const openTab4 = useCallback(() => {
    if (maxAllowedTab >= 3) {
      setOpenTabIndex(4);
    }
  }, [setOpenTabIndex, maxAllowedTab]);

  const [isCantUpgradeOpen, setCantUpgradeOpen] = useState(false);
  const handleCloseCantUpgrade = useCallback(() => {
    setCantUpgradeOpen(false);
  }, [setCantUpgradeOpen]);
  const [isConfirmUpgradeStatusOpen, setConfirmUpgradeStatusOpen] = useState(false);
  const [updateCourseStatusMutation] = useRoleMutation<UpdateCourseStatus, UpdateCourseStatusVariables>(
    UPDATE_COURSE_STATUS
  );
  const handleUpgradeStatus = useCallback(
    async (confirmAnswer: boolean) => {
      setConfirmUpgradeStatusOpen(false);
      if (course != null && confirmAnswer) {
        const nextStatus = getNextCourseStatus(course);
        if (nextStatus !== course.status) {
          setOpenTabIndex(openTabIndex + 1);
        }
        await updateCourseStatusMutation({
          variables: {
            courseId: course.id,
            status: nextStatus as any,
          },
        });
        qResult.refetch();
      }
    },
    [setConfirmUpgradeStatusOpen, course, updateCourseStatusMutation, qResult, openTabIndex]
  );

  if (course == null) {
    return <div>{t('course-page:course-not-found', { courseId: courseId })}</div>;
  }

  // If the user is neither an admin nor an instructor for this course return empty div
  // (is equivalent to a non existing course)
  if (!isAdmin && !isInstructorOfCourse) {
    return <div></div>;
  }

  return (
    <>
      <PageBlock>
        <div className="max-w-screen-xl mx-auto mt-20">
          <div className="flex flex-row mb-12 mt-12 text-white">
            <h1 className="text-4xl font-bold">{course.title}</h1>
          </div>

          <div className="grid grid-cols-4 mb-20">
            <div className={`p-4 m-2 ${determineTabClasses(0, openTabIndex)}`} onClick={openTab0}>
              {t('description')}
            </div>

            {course.Program.shortTitle === 'DEGREES' ? null : (
              <div className={`p-4 m-2 ${determineTabClasses(1, openTabIndex)}`} onClick={openTab1}>
                {t('sessions')}
              </div>
            )}

            {course.externalRegistrationLink ? null : (
              <div className={`p-4 m-2 ${determineTabClasses(2, openTabIndex)}`} onClick={openTab2}>
                {t('applications')}
              </div>
            )}

            {course.externalRegistrationLink || course.Program.shortTitle === 'DEGREES' ? null : (
              <div className={`p-4 m-2 ${determineTabClasses(3, openTabIndex)}`} onClick={openTab3}>
                {t('participations_and_achievements')}
              </div>
            )}

            {course.Program.shortTitle === 'DEGREES' ? (
              <div className={`p-4 m-2 ${determineTabClasses(4, openTabIndex)}`} onClick={openTab4}>
                {t('degree_participations')}
              </div>
            ) : null}
          </div>

          {openTabIndex === 0 && <DescriptionTab course={course} qResult={qResult} />}
          {openTabIndex === 1 && <SessionsTab course={course} qResult={qResult} />}
          {openTabIndex === 2 && <ApplicationsTab course={course} qResult={qResult} />}
          {openTabIndex === 3 && <CourseParticipationsTab course={course} qResult={qResult} />}
          {openTabIndex === 4 && <DegreeParticipationsTab course={course} />}
        </div>
      </PageBlock>
      <QuestionConfirmationDialog
        question={t('course-page:confirmation-push-the-course-to-next-status')}
        confirmationText={t('course-page:set-status-high')}
        onClose={handleUpgradeStatus}
        open={isConfirmUpgradeStatusOpen}
      />
      <AlertMessageDialog
        alert={t('course-page:please-fill-in-all-fields-to-proceed-further')}
        confirmationText={'OK'}
        onClose={handleCloseCantUpgrade}
        open={isCantUpgradeOpen}
      />
    </>
  );
};
