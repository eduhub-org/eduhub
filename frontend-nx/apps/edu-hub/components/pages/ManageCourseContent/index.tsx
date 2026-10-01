import { useTranslations } from 'next-intl';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useOrgAdminQuery, useRoleQuery } from '../../../hooks/authedQuery';
import { MANAGED_COURSE, ORG_ADMIN_MANAGEABLE_COURSE, UPDATE_COURSE_STATUS } from '../../../queries/course';
import {
  OrgAdminManageableCourse,
  OrgAdminManageableCourseVariables,
} from '../../../queries/__generated__/OrgAdminManageableCourse';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import { useManageCourseWhere } from '../../../hooks/manageScope';
import { useUserId } from '../../../hooks/user';
import { AuthRoles } from '../../../types/enums';
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
import { ParticipantPreviewButton } from './ParticipantPreviewButton';
import { useIsAdmin, useIsOrgAdmin, useIsUserIdInList } from '../../../hooks/authentication';
import { getRegistrationFeatures } from './ApplicationsTab/registrationConfig';
import Loading from '../../common/Loading';
import { ProgramType } from '../../../types/enums';
import { readLastOpenedTab, storeLastOpenedTab } from './lastOpenedTab';

interface Props {
  courseId: number;
}

interface CourseManagementProps extends Props {
  /**
   * The viewer manages this course as an org admin (the page runs under org_admin). They get every
   * tab an instructor gets; only the participant preview stays with the course's own instructors.
   */
  manageAsOrgAdmin: boolean;
}

const determineTabClasses = (tabIndex: number, selectedTabIndex: number) =>
  tabIndex === selectedTabIndex
    ? 'bg-bg-card text-label-primary'
    : 'light bg-status-confirmed text-label-primary cursor-pointer hover:bg-status-confirmed hover:opacity-90';

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
/**
 * Picks the role the course is managed under, then renders it. Admins and the course's own
 * instructors keep their session role, as before. An org admin who does not instruct the course
 * manages it as org_admin - but only if its program type matches one of their capabilities: they
 * can read every course of their organization, and would otherwise get a page on which every save
 * fails.
 */
export const ManageCourseContent: FC<Props> = ({ courseId }) => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const userId = useUserId();
  const manageCourseWhere = useManageCourseWhere();
  const checkAsOrgAdmin = isOrgAdmin && !isAdmin;

  const variables = useMemo(
    () => ({ where: { _and: [{ id: { _eq: courseId } }, manageCourseWhere] } }),
    [courseId, manageCourseWhere]
  );
  const { data, loading } = useOrgAdminQuery<OrgAdminManageableCourse, OrgAdminManageableCourseVariables>(
    ORG_ADMIN_MANAGEABLE_COURSE,
    { variables, skip: !checkAsOrgAdmin }
  );

  if (checkAsOrgAdmin && (loading || !userId)) {
    return (
      <PageBlock>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loading />
        </div>
      </PageBlock>
    );
  }

  const manageable = checkAsOrgAdmin ? data?.Course[0] : undefined;
  const instructsCourse = !!manageable?.CourseInstructors.some((ci) => ci.User?.id === userId);

  if (manageable && !instructsCourse) {
    return (
      <ManagementRoleProvider role={AuthRoles.org_admin}>
        <CourseManagement courseId={courseId} manageAsOrgAdmin />
      </ManagementRoleProvider>
    );
  }
  return <CourseManagement courseId={courseId} manageAsOrgAdmin={false} />;
};

const CourseManagement: FC<CourseManagementProps> = ({ courseId, manageAsOrgAdmin }) => {
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
  const instructorIds = qResult?.data?.Course_by_pk?.CourseInstructors.flatMap((ci) => (ci.User ? [ci.User.id] : []));
  const isInstructorOfCourse = useIsUserIdInList(instructorIds ?? []);

  if (qResult.error) {
    console.log('query managed course error!', qResult.error);
  }

  const course: ManagedCourse_Course_by_pk | null = qResult.data?.Course_by_pk || null;

  // null until the user picks a tab here; until then the tab remembered for this course (if it is
  // still shown) or the first tab is open.
  const [chosenTabIndex, setChosenTabIndex] = useState<number | null>(null);
  const [rememberedTabIndex, setRememberedTabIndex] = useState<number | null>(null);

  // Read on mount, while the course is still loading, so the page opens on the right tab directly.
  useEffect(() => {
    setChosenTabIndex(null);
    setRememberedTabIndex(readLastOpenedTab(courseId));
  }, [courseId]);

  const isDegreeCourse = course?.Program.type === ProgramType.DEGREES;
  const visibleTabIndices = useMemo(() => {
    if (course == null) return [0];
    return [
      0,
      ...(isDegreeCourse ? [] : [1]),
      ...(course.externalRegistrationLink ? [] : [2]),
      ...(course.externalRegistrationLink || isDegreeCourse ? [] : [3]),
      ...(isDegreeCourse ? [4] : []),
    ];
  }, [course, isDegreeCourse]);

  // A tab that is no longer shown (e.g. after an external registration link was set) never stays open.
  const isVisibleTab = (tabIndex: number | null): tabIndex is number =>
    tabIndex != null && visibleTabIndices.includes(tabIndex);
  const openTabIndex = isVisibleTab(chosenTabIndex)
    ? chosenTabIndex
    : isVisibleTab(rememberedTabIndex)
      ? rememberedTabIndex
      : 0;

  const selectTab = useCallback(
    (tabIndex: number) => {
      setChosenTabIndex(tabIndex);
      // Mirror what a reload would read, so a selection that becomes hidden falls back to the
      // first tab rather than to an older remembered one.
      setRememberedTabIndex(tabIndex);
      storeLastOpenedTab(courseId, tabIndex);
    },
    [courseId]
  );

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
          setChosenTabIndex(openTabIndex + 1);
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

  const isEventCourse = course?.Program.type === ProgramType.EVENTS;

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
  if (!isAdmin && !isInstructorOfCourse && !manageAsOrgAdmin) {
    return <div></div>;
  }

  const tabLabels: Record<number, string> = {
    0: t('description'),
    1: t(isEventCourse ? 'programme' : 'sessions'),
    2: t(registrationFeatures.tabNameKey),
    // Without achievement certificates the tab holds no projects section, so promising them in its
    // name is misleading.
    3: t(course.achievementCertificatePossible ? 'participations_and_achievements' : 'participations'),
    4: t('degree_participations'),
  };

  return (
    <>
      <PageBlock>
        {/* PageBlock drops its side margin from xl up, where a 1280px wide window would otherwise let
            the content touch the edges; from 2xl on the centred column has room of its own. */}
        <div className="max-w-screen-xl mx-auto mt-20 xl:px-12 2xl:px-0">
          <div className="flex flex-col gap-4 mb-6 mt-6 md:mb-12 md:mt-12 text-white sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
            {/* The preview action is for the course's own instructors. */}
            {!manageAsOrgAdmin && <ParticipantPreviewButton courseId={courseId} />}
          </div>

          {/* Two tiles per row on phones, one row from md up. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-8 md:mb-12">
            {visibleTabIndices.map((tabIndex) => (
              <button
                key={tabIndex}
                type="button"
                onClick={() => selectTab(tabIndex)}
                aria-pressed={tabIndex === openTabIndex}
                className={`p-3 md:p-4 text-left text-sm md:text-base ${determineTabClasses(tabIndex, openTabIndex)}`}
              >
                {tabLabels[tabIndex]}
              </button>
            ))}
          </div>

          {openTabIndex === 0 && <DescriptionTab course={course} qResult={qResult} />}
          {openTabIndex === 1 && <SessionsTab course={course} qResult={qResult} />}
          {openTabIndex === 2 && <ApplicationsTab course={course} manageAsOrgAdmin={manageAsOrgAdmin} />}
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
