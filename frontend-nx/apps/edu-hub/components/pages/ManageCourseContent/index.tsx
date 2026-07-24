import { useTranslations } from 'next-intl';
import { FC, useCallback, useMemo, useState } from 'react';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { MANAGED_COURSE, UPDATE_COURSE_STATUS } from '../../../queries/course';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk,
} from '../../../queries/__generated__/ManagedCourse';
import { UpdateCourseStatus, UpdateCourseStatusVariables } from '../../../queries/__generated__/UpdateCourseStatus';
import { AlertMessageDialog } from '../../common/dialogs/AlertMessageDialog';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { PageBlock } from '../../common/PageBlock';
import { DescriptionTab } from './DescriptionTab';
import { SessionsTab } from './SessionsTab';
import { ApplicationsTab } from './ApplicationsTab';
import { CourseParticipationsTab } from './CourseParticipationsTab';
import { DegreeParticipationsTab } from './DegreeParticipationsTab';
import { useIsAdmin, useIsUserIdInList } from '../../../hooks/authentication';
import { getRegistrationFeatures } from './ApplicationsTab/registrationConfig';
import Loading from '../../common/Loading';

interface Props {
  courseId: number;
}

const determineTabClasses = (tabIndex: number, selectedTabIndex: number) => {
  const maxAllowedTab = 5;

  if (tabIndex === selectedTabIndex) {
    // Active tab: dark background with light text (like second image)
    return 'bg-bg-card text-label-primary';
  }

  if (tabIndex < maxAllowedTab) {
    // Inactive tabs: light green background with dark text for good contrast (like second image)
    return 'light bg-status-confirmed text-label-primary cursor-pointer hover:bg-status-confirmed hover:opacity-90';
  }

  if (tabIndex === maxAllowedTab) {
    return 'bg-bg-secondary text-label-secondary cursor-pointer';
  }

  return 'bg-bg-secondary text-label-disabled';
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
  const t = useTranslations('manageCourse');
  const managedCourseQueryOptions = useMemo(
    () => ({
      variables: {
        id: courseId,
      },
    }),
    [courseId]
  );

  const qResult = useRoleQuery<ManagedCourse, ManagedCourseVariables>(
    MANAGED_COURSE,
    managedCourseQueryOptions
  );

  const isAdmin = useIsAdmin();
  const instructorIds = qResult?.data?.Course_by_pk?.CourseInstructors.map((ci) => ci.User.id);
  const isInstructorOfCourse = useIsUserIdInList(instructorIds ?? []);

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

  // useMemo must be called before any early returns to comply with Rules of Hooks
  const registrationFeatures = useMemo(
    () => getRegistrationFeatures(course?.registrationType ?? null),
    [course?.registrationType]
  );

  if (qResult.loading && !qResult.data) {
    return (
      <PageBlock>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-label-primary">
          <Loading />
          <p>{t('loading_course')}</p>
        </div>
      </PageBlock>
    );
  }

  if (qResult.error) {
    return (
      <PageBlock>
        <div className="min-h-[50vh] flex items-center justify-center text-error">
          {t('course_load_error')}
        </div>
      </PageBlock>
    );
  }

  if (course == null) {
    return <div>{t('course_not_found', { courseId: courseId })}</div>;
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

            {course.Program.type === 'DEGREES' ? null : (
              <div className={`p-4 m-2 ${determineTabClasses(1, openTabIndex)}`} onClick={openTab1}>
                {t('sessions')}
              </div>
            )}

            {course.externalRegistrationLink ? null : (
              <div className={`p-4 m-2 ${determineTabClasses(2, openTabIndex)}`} onClick={openTab2}>
                {t(registrationFeatures.tabNameKey)}
              </div>
            )}

            {course.externalRegistrationLink || course.Program.type === 'DEGREES' ? null : (
              <div className={`p-4 m-2 ${determineTabClasses(3, openTabIndex)}`} onClick={openTab3}>
                {t('participations_and_achievements')}
              </div>
            )}

            {course.Program.type === 'DEGREES' ? (
              <div className={`p-4 m-2 ${determineTabClasses(4, openTabIndex)}`} onClick={openTab4}>
                {t('degree_participations')}
              </div>
            ) : null}
          </div>

          {openTabIndex === 0 && <DescriptionTab course={course} qResult={qResult} />}
          {openTabIndex === 1 && <SessionsTab course={course} qResult={qResult} />}
          {openTabIndex === 2 && <ApplicationsTab course={course} />}
          {openTabIndex === 3 && <CourseParticipationsTab course={course} qResult={qResult} />}
          {openTabIndex === 4 && <DegreeParticipationsTab course={course} />}
        </div>
      </PageBlock>
      <QuestionConfirmationDialog
        question={t('confirmation_push_course_to_next_status')}
        confirmationText={t('set_status_high')}
        onClose={() => handleUpgradeStatus(false)}
        onConfirm={() => handleUpgradeStatus(true)}
        open={isConfirmUpgradeStatusOpen}
      />
      <AlertMessageDialog
        alert={t('please_fill_all_fields')}
        confirmationText={'OK'}
        onClose={handleCloseCantUpgrade}
        open={isCantUpgradeOpen}
      />
    </>
  );
};
