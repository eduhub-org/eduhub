import { FC, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';

import Onboarding from './Onboarding';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { useUserId } from '../../../hooks/user';
import { CourseWithEnrollment } from '../../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../../queries/courseWithEnrollment';
import { CourseEnrollmentStatus_enum, CourseRegistrationType_enum } from '../../../__generated__/globalTypes';
import { useIsLoggedIn } from '../../../hooks/authentication';
import { COURSE_ANONYMOUS } from '../../../queries/course';
import { Course, CourseVariables } from '../../../queries/__generated__/Course';
import { getCourseEnrollment } from '../../../helpers/util';
import { ContentRow } from '../../common/ContentRow';
import { PageBlock } from '../../common/PageBlock';
import { DescriptionFields } from './DescriptionFields';
import { FundingOrganizations } from './FundingOrganizations';
import CourseProjectsSection from '../../common/TileSlider/CourseProjectsSection';
import { RegistrationRail } from './RegistrationRail';
import { useWeekdayStartAndEndString } from '../../../helpers/dateTimeHelpers';
import { LearningGoals } from './LearningGoals';
import { Sessions } from './Sessions';
import { CourseParticipants } from './CourseParticipants';
import { CompletedDegreeCourses, CurrentDegreeCourses } from './DegreeCourses';
import PricingSummary from '../../common/PricingSummary';
import { getRegistrationTypeConfig } from './Registration/types';
import { getBackgroundImage } from '../../../helpers/imageHandling';
import { Attendances } from './Attendances';
import { CertificateDownload } from '../../common/CertificateDownload';
import Projects from './Projects';
import {
  resolveEffectiveCourseProjectSubmissionDeadline,
  getCourseProjectSubmissionDefaultSource,
  submissionDeadlineToIsoString,
} from './Projects/projectEffectiveSubmissionDeadline';
import { useIsCourseWithEnrollment } from '../../../hooks/course';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ParticipantPreviewNotice } from './ParticipantPreviewNotice';

/**
 * Page rhythm. Every vertical gap on this page comes from one of these, so a gap
 * reads as a decision rather than an accident:
 *
 *   section  space-y-16 lg:space-y-24   between top-level sections
 *   block    space-y-8                  heading -> content, sibling blocks
 *   item     space-y-4                  rows within a list
 *   gutter   PageBlock (mx-6 xl:mx-0)   the one page inset, hero title included
 */
const SECTION_RHYTHM = 'flex flex-col space-y-16 lg:space-y-24';

/**
 * The two-column body, as a grid rather than a flex row.
 *
 * The rail spans both rows on the right, so it can travel the whole height of
 * the tagline and the agenda together while `sticky` keeps it in view. Grid
 * also lets the source order be tagline -> rail -> content, which is what we
 * want stacked (and for a screen reader: facts before the detail that expands
 * them) without any of the three moving on desktop.
 */
const BODY_GRID = 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-x-6 gap-y-12 lg:gap-y-8';

/**
 * Pinned beside the content on wide screens. `self-start` is what gives sticky
 * room to work - a stretched grid item is already as tall as its area and has
 * nowhere to travel - and the max height keeps a tall card (a paid course with
 * add-ons and several instructors) from running off the bottom of the screen.
 */
const RAIL_STICKY =
  'lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-6 ' +
  'lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto';

const CourseContent: FC<{ id: number }> = ({ id }) => {
  const t = useTranslations('course');
  const tCoursePage = useTranslations('coursePage');
  const tCommon = useTranslations('common'); // Used for weekday translations
  const isLoggedIn = useIsLoggedIn();
  const userId = useUserId();
  const [resetValues, setResetValues] = useState<boolean | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [registrationSuccessWaitlist, setRegistrationSuccessWaitlist] = useState(false);
  const getWeekdayStartAndEndString = useWeekdayStartAndEndString();

  // Query for authorized course data
  const [
    getCoursesAuthorized,
    { data: authorizedCourseData, refetch: refetchCourse, loading: getCoursesAuthorizedLoading },
  ] = useLazyRoleQuery<CourseWithEnrollment>(COURSE_WITH_ENROLLMENT, {
    variables: {
      id,
      userId,
    },
    fetchPolicy: 'cache-and-network',
    onCompleted(data) {
      // Check if user has been invited to the course and the invitation has not expired
      const courseEnrollment = getCourseEnrollment(data?.Course_by_pk, userId ?? '');
      const enrollmentStatus = courseEnrollment?.status;
      if (
        enrollmentStatus === CourseEnrollmentStatus_enum.INVITED &&
        courseEnrollment?.invitationExpirationDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)
      ) {
        setResetValues(true);
      }
    },
  });

  // Query for unauthorized course data
  const [getCoursesUnauthorized, { data: unauthorizedCourseData, loading: getCoursesUnauthorizedLoading }] =
    useLazyRoleQuery<Course, CourseVariables>(COURSE_ANONYMOUS, {
      variables: {
        id,
      },
    });

  // Call the appropriate query based on user authentication status
  useEffect(() => {
    if (isLoggedIn) {
      getCoursesAuthorized();
    } else {
      getCoursesUnauthorized();
    }
  }, [isLoggedIn, getCoursesAuthorized, getCoursesUnauthorized]);

  // Extract course data from authorized or unauthorized query result
  const course = authorizedCourseData?.Course_by_pk || unauthorizedCourseData?.Course_by_pk;
  const enrollmentId = getCourseEnrollment(authorizedCourseData?.Course_by_pk, userId ?? '')?.id;

  const isCourseWithEnrollment = useIsCourseWithEnrollment(course);

  const [backgroundImage, setBackgroundImage] = useState<string>('');
  // Use useEffect to call getBackgroundImage
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      const baseLink = course?.coverImage ?? null;
      const optimalImageLink = await getBackgroundImage(baseLink);
      setBackgroundImage(optimalImageLink);
    };

    fetchBackgroundImage();
  }, [course?.coverImage]);

  // Handle registration success
  const handleRegistrationSuccess = (info?: { waitlist: boolean }) => {
    setRegistrationSuccessWaitlist(!!info?.waitlist);
    setShowSuccessSnackbar(true);
    refetchCourse();
  };

  // Get success message based on registration type (waitlist vs approval vs direct)
  const getSuccessMessage = () => {
    if (registrationSuccessWaitlist) {
      return t('modal.success_message_waitlist');
    }
    if (!course?.registrationType) return '';

    const registrationType = course.registrationType || CourseRegistrationType_enum.APPROVAL_WITH_INPUT;
    const config = getRegistrationTypeConfig(registrationType);

    return config.requiresApproval ? t('modal.success_message_approval') : t('modal.success_message_direct');
  };

  // Ensure course is defined before extracting its properties
  if (!course) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <div className="text-white">{t('general.course_not_available')}</div>
      </div>
    );
  }

  // Check if course is a degree course
  const isDegreeCourse = course.Program?.type === 'DEGREES';
  const isEventCourse = course.Program?.type === 'EVENTS';

  // Check if registration requires payment
  const registrationConfig = course.registrationType 
    ? getRegistrationTypeConfig(course.registrationType)
    : null;
  const requiresPayment = registrationConfig?.requiresPayment ?? false;

  // Map CourseAddonMappings to AddonItem format for PricingSummary
  const addonItems = course.CourseAddonMappings?.map((mapping) => ({
    id: mapping.id,
    description: mapping.description,
    validatedPrice: mapping.validatedPrice,
    currency: mapping.currency || course.currency || 'EUR',
  })) || [];

  // Get the course enrollment of the current user (necessary for admins and instructors)
  const courseEnrollment = getCourseEnrollment(course, userId ?? undefined);

  const isLoggedInParticipant =
    isLoggedIn &&
    (courseEnrollment?.status === CourseEnrollmentStatus_enum.CONFIRMED ||
      courseEnrollment?.status === CourseEnrollmentStatus_enum.COMPLETED);

  return (
    <div>
      {getCoursesAuthorizedLoading || getCoursesUnauthorizedLoading ? (
        <CircularProgress />
      ) : (
        <>
          {/* Outside the section rhythm: the notice belongs to the page chrome,
              not to the content, so it sits flush above the hero. */}
          {courseEnrollment?.isTest && <ParticipantPreviewNotice courseId={course.id} />}
        <div className={SECTION_RHYTHM}>
          <div
            className="h-96 text-white flex justify-start items-end bg-cover bg-center bg-no-repeat"
              style={
                {
                  backgroundImage: `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url("${backgroundImage}")`,
                } as React.CSSProperties
              }
            >
              {/* PageBlock rather than a padding of its own: the title has to sit
                  on the same gutter as everything below it at every width. */}
              <div className="max-w-screen-xl mx-auto w-full pb-8">
                <PageBlock>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] break-words">
                    {course.title}
                  </h1>
                </PageBlock>
              </div>
            </div>
            <div className={`max-w-screen-xl mx-auto w-full ${SECTION_RHYTHM}`}>
              {isLoggedIn && resetValues && enrollmentId != null && (
                <Onboarding
                  course={course}
                  enrollmentId={enrollmentId}
                  refetchCourse={refetchCourse}
                  setResetValues={setResetValues}
                />
              )}
              <PageBlock>
                <div className={BODY_GRID}>
                  <div className="flex min-w-0 flex-col text-white lg:col-start-1 lg:row-start-1">
                    {/* An event carries its dates in the agenda below, not here. */}
                    {!isEventCourse && course.weekDay !== 'NONE' ? (
                      <span className="text-xs mb-2">{getWeekdayStartAndEndString(course, tCommon)}</span>
                    ) : null}
                    <span className="text-xl sm:text-2xl leading-snug">{course.tagline}</span>
                  </div>

                  <div className={RAIL_STICKY}>
                    <RegistrationRail
                      course={course}
                      courseEnrollment={courseEnrollment ?? undefined}
                      isLoggedInParticipant={isLoggedInParticipant}
                      onRegistrationSuccess={handleRegistrationSuccess}
                    />
                  </div>

                  <div className="min-w-0 text-white space-y-8 lg:col-start-1 lg:row-start-2">
                    <LearningGoals learningGoals={course.learningGoals} />
                    {!isDegreeCourse ? (
                      <Sessions
                        sessions={course.Sessions}
                        courseLocations={course.CourseLocations}
                        isLoggedInParticipant={isLoggedInParticipant}
                        isEvent={isEventCourse}
                      />
                    ) : (
                      <CurrentDegreeCourses degreeCourses={course.DegreeCourses} />
                    )}
                    {/* Only asked for by someone taking part: the Hasura
                        permission returns an empty list to anyone else, so this
                        saves a pointless round trip rather than guarding it. */}
                    {isLoggedInParticipant && (
                      <CourseParticipants courseId={course.id} currentUserId={userId} />
                    )}
                    {!!(requiresPayment && (course.basePrice || course.basePrice === 0 || course.basePrice === null || addonItems.length > 0)) && (
                      <div>
                        <span className="text-3xl font-semibold block mb-6">{tCoursePage('pricing_section_title')}</span>
                        <PricingSummary
                          basePrice={course.basePrice || 0}
                          currency={course.currency || 'EUR'}
                          addons={addonItems}
                          showStripeStatus={false}
                          showTotal={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </PageBlock>
              {!isEventCourse &&
                isCourseWithEnrollment && // needed to assure the type of the course object
                courseEnrollment?.status === CourseEnrollmentStatus_enum.CONFIRMED &&
                (course.achievementCertificatePossible || course.attendanceCertificatePossible) && (
                  <>
                    {!isDegreeCourse && course.achievementCertificatePossible && (
                      <>
                        {courseEnrollment &&
                          (courseEnrollment.achievementCertificateURL ||
                            courseEnrollment.attendanceCertificateURL) && (
                            <PageBlock classname="min-w-0 text-label-primary">
                              <CertificateDownload
                                courseEnrollment={courseEnrollment}
                                className="mt-0"
                              />
                            </PageBlock>
                          )}
                        <Projects
                          courseId={course.id}
                          defaultProjectType={course.Program?.defaultProjectType ?? null}
                          effectiveSubmissionDeadline={submissionDeadlineToIsoString(
                            resolveEffectiveCourseProjectSubmissionDeadline(course)
                          )}
                          submissionDeadlineDefaultSource={getCourseProjectSubmissionDefaultSource(course)}
                          proposalsEnabled={Boolean(
                            course.projectProposalsEnabled ??
                              course.Program?.projectProposalsEnabledByDefault
                          )}
                        />
                      </>
                    )}
                    <ContentRow className="min-w-0 text-label-primary mx-6 xl:mx-0">
                      <div className="flex flex-col w-full min-w-0">
                      {!isDegreeCourse && (
                        <>
                          <Attendances course={course} />
                          {courseEnrollment &&
                            !course.achievementCertificatePossible &&
                            (courseEnrollment.achievementCertificateURL ||
                              courseEnrollment.attendanceCertificateURL) && (
                              <CertificateDownload courseEnrollment={courseEnrollment} />
                            )}
                        </>
                      )}
                      {isDegreeCourse && (
                        <>
                          <CompletedDegreeCourses degreeCourseId={course.id} />
                          {courseEnrollment && (
                            <CertificateDownload courseEnrollment={courseEnrollment} />
                          )}
                        </>
                      )}
                    </div>
                  </ContentRow>
                  </>
                )}
              <DescriptionFields course={course} />
              <FundingOrganizations courseFundingOrganizations={course.CourseFundingOrganizations ?? []} />
              <CourseProjectsSection courseId={id} />
            </div>
        </div>
        </>
      )}

      <NotificationSnackbar
        open={showSuccessSnackbar}
        onClose={() => {
          setShowSuccessSnackbar(false);
          setRegistrationSuccessWaitlist(false);
        }}
        message={getSuccessMessage()}
        duration={4000}
      />
    </div>
  );
};

export default CourseContent;
