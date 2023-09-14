import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useRoleQuery } from '../../hooks/authedQuery';
import { MANAGED_COURSE, UPDATE_COURSE_STATUS } from '../../queries/course';
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk,
} from '../../queries/__generated__/ManagedCourse';
import {
  UpdateCourseStatus,
  UpdateCourseStatusVariables,
} from '../../queries/__generated__/UpdateCourseStatus';
import { CourseStatus_enum } from '../../__generated__/globalTypes';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import { QuestionConfirmationDialog } from '../common/dialogs/QuestionConfirmationDialog';
import { PageBlock } from '../common/PageBlock';
import { ApplicationsTab } from './ApplicationsTab';
import { DescriptionTab } from './DescriptionTab';
import ManageCourseEnrollment from './ParticipationTab';
import { SessionsTab } from './SessionsTab';

interface Props {
  courseId: number;
}

const determineMaxAllowedTab = (courseStatus: CourseStatus_enum) => {
  const maxAllowedTab = 4;
  // switch (courseStatus) {
  //   case CourseStatus_enum.READY_FOR_PUBLICATION:
  //     maxAllowedTab = 1;
  //     break;
  //   case CourseStatus_enum.READY_FOR_APPLICATION:
  //     maxAllowedTab = 2;
  //     break;
  //   case CourseStatus_enum.APPLICANTS_INVITED:
  //     maxAllowedTab = 3;
  //     break;
  //   case CourseStatus_enum.PARTICIPANTS_RATED:
  //     maxAllowedTab = 3;
  //     break;
  // }
  return maxAllowedTab;
};

const determineTabClasses = (
  tabIndex: number,
  selectedTabIndex: number,
  courseStatus: CourseStatus_enum
) => {
  const maxAllowedTab = determineMaxAllowedTab(courseStatus);

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

const canUpgradeStatus = (course: ManagedCourse_Course_by_pk) => {
  const isFilled = (x: string | null) => x != null && x.length > 0;

  if (course.status === 'DRAFT') {
    return (
      // isFilled(course.learningGoals) &&
      // isFilled(course.headingDescriptionField1) &&
      // isFilled(course.headingDescriptionField2) &&
      // isFilled(course.contentDescriptionField1) &&
      // isFilled(course.contentDescriptionField2) &&
      course.CourseLocations.length > 0
    );
  } else if (course.status === 'READY_FOR_PUBLICATION') {
    return (
      course.Sessions.length > 0 &&
      course.Sessions.every(
        (session) =>
          session.startDateTime != null &&
          session.endDateTime != null &&
          isFilled(session.title) &&
          session.title !== course.title &&
          session.SessionAddresses.length > 0
      ) &&
      new Set(course.Sessions.map((s) => s.title)).size ===
        course.Sessions.length
    );
  } else if (course.status === 'READY_FOR_APPLICATION') {
    return (
      course.CourseEnrollments.find((e) => e.status === 'CONFIRMED') != null
    );
  } else {
    return false;
  }
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
  const { t } = useTranslation();

  const qResult = useRoleQuery<ManagedCourse, ManagedCourseVariables>(
    MANAGED_COURSE,
    {
      variables: {
        id: courseId,
      },
    }
  );

  if (qResult.error) {
    console.log('query managed course error!', qResult.error);
  }

  const course: ManagedCourse_Course_by_pk | null =
    qResult.data?.Course_by_pk || null;

  const maxAllowedTab = determineMaxAllowedTab(
    course?.status || ('DRAFT' as any)
  );

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

  const [isCantUpgradeOpen, setCantUpgradeOpen] = useState(false);
  const handleCloseCantUpgrade = useCallback(() => {
    setCantUpgradeOpen(false);
  }, [setCantUpgradeOpen]);
  const [isConfirmUpgradeStatusOpen, setConfirmUpgradeStatusOpen] =
    useState(false);
  const handleRequestUpgradeStatus = useCallback(() => {
    if (course != null && canUpgradeStatus(course)) {
      setConfirmUpgradeStatusOpen(true);
    } else {
      setCantUpgradeOpen(true);
    }
  }, [course, setConfirmUpgradeStatusOpen]);
  const [updateCourseStatusMutation] = useRoleMutation<
    UpdateCourseStatus,
    UpdateCourseStatusVariables
  >(UPDATE_COURSE_STATUS);
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
    [
      setConfirmUpgradeStatusOpen,
      course,
      updateCourseStatusMutation,
      qResult,
      openTabIndex,
    ]
  );

  if (course == null) {
    return (
      <div>{t('course-page:course-not-found', { courseId: courseId })}</div>
    );
  }

  return (
    <>
      <PageBlock>
        <div className="max-w-screen-xl mx-auto mt-20">
          <div className="flex flex-row mb-12 mt-12 text-white">
            <h1 className="text-4xl font-bold">{course.title}</h1>
          </div>

          <div className="grid grid-cols-4 mb-20">
            <div
              className={`p-4 m-2 ${determineTabClasses(
                0,
                openTabIndex,
                course.status
              )}`}
              onClick={openTab0}
            >
              {t('course-page:brief-description')}
            </div>

            {course.Program.shortTitle !== "DEGREES" ? null : (
              <div
                className={`p-4 m-2 ${determineTabClasses(
                  1,
                  openTabIndex,
                  course.status
                )}`}
                onClick={openTab1}
              >
                {t('course-page:appointments')}
              </div>
            )}

            {course.externalRegistrationLink ? null : (
              <div
                className={`p-4 m-2 ${determineTabClasses(
                  2,
                  openTabIndex,
                  course.status
                )}`}
                onClick={openTab2}
              >
                {t('course-page:applications')}
              </div>
            )}

            {course.externalRegistrationLink ? null : (
              <div
                className={`p-4 m-2 ${determineTabClasses(
                  3,
                  openTabIndex,
                  course.status
                )}`}
                onClick={openTab3}
              >
                {t('course-page:participation-and-benefits')}
              </div>
            )}
          </div>

          {openTabIndex === 0 && (
            <DescriptionTab course={course} qResult={qResult} />
          )}

          {openTabIndex === 1 && (
            <SessionsTab course={course} qResult={qResult} />
          )}

          {openTabIndex === 2 && (
            <ApplicationsTab course={course} qResult={qResult} />
          )}
          {openTabIndex === 3 && (
            <ManageCourseEnrollment course={course} qResult={qResult} />
          )}

          {/* {openTabIndex === maxAllowedTab && openTabIndex < 3 && (
            <div className="flex justify-end mb-16">
              <OldButton
                onClick={handleRequestUpgradeStatus}
                as="button"
                filled
                inverted
              >
                {t('course-page:upgrade-status')}
              </OldButton>
            </div>
          )} */}
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
