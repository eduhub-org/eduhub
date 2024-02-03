import { FC, useState, useEffect } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@material-ui/core';

import OnboardingModal from './OnboardingModal';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { useUserId } from '../../../hooks/user';
import { CourseWithEnrollment } from '../../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../../queries/courseWithEnrollment';
import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';
import { useIsLoggedIn } from '../../../hooks/authentication';
import { COURSE } from '../../../queries/course';
import { Course, CourseVariables } from '../../../queries/__generated__/Course';
import { getCourseEnrollment } from '../../../helpers/util';
import { ContentRow } from '../../common/ContentRow';
import { PageBlock } from '../../common/PageBlock';
import { DescriptionFields } from './DescriptionFields';
import { TimeLocationLanguageInstructors } from './TimeLocationLanguageInstructors';
import { getWeekdayStartAndEndString } from '../../../helpers/dateHelpers';
import { LearningGoals } from './LearningGoals';
import { Sessions } from './Sessions';
import { CompletedDegreeCourses, CurrentDegreeCourses } from './DegreeCourses';
import { ActionButtons } from './ActionButtons';
import { getBackgroundImage } from '../../../helpers/imageHandling';
import { Attendances } from './Attendances';
import { CertificateDownload } from '../../common/CertificateDownload';
import AchievementRecord from './AchievementRecord';
import { useIsCourseWithEnrollment } from '../../../hooks/course';

const CourseContent: FC<{ id: number }> = ({ id }) => {
  const { t, lang } = useTranslation();
  const isLoggedIn = useIsLoggedIn();
  const userId = useUserId();
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [resetValues, setResetValues] = useState(null);

  // Query for authorized course data
  const [
    getCoursesAuthorized,
    { data: authorizedCourseData, refetch: refetchCourse, loading: getCoursesAuthorizedLoading },
  ] = useLazyRoleQuery<CourseWithEnrollment>(COURSE_WITH_ENROLLMENT, {
    variables: {
      id,
      userId,
    },
    async onCompleted(data) {
      // Check if user has been invited to the course and the invitation has not expired
      const courseEnrollment = getCourseEnrollment(data?.Course_by_pk, userId);
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
    useLazyRoleQuery<Course, CourseVariables>(COURSE, {
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
  const enrollmentId = getCourseEnrollment(authorizedCourseData?.Course_by_pk, userId)?.id;

  const isCourseWithEnrollment = useIsCourseWithEnrollment(course);

  const [backgroundImage, setBackgroundImage] = useState<string>('');
  // Use useEffect to call getBackgroundImage
  useEffect(() => {
    const fetchBackgroundImage = async () => {
      const baseLink = course?.coverImage;
      const optimalImageLink = await getBackgroundImage(baseLink);
      setBackgroundImage(optimalImageLink);
      console.log('optimalImageLink: ', optimalImageLink);
    };

    fetchBackgroundImage();
  }, [course?.coverImage]);

  // Check if course is a degree course
  const isDegreeCourse = course?.Program?.shortTitle === 'DEGREES';
  const isEventCourse = course?.Program?.shortTitle === 'EVENTS';

  // Ensure course is defined before extracting its properties
  if (!course) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <div className="text-white">{t('course-page:courseNotAvailable')}</div>
      </div>
    );
  }

  // Get the course enrollment of the current user (necessary for admins and instructors)
  const courseEnrollment = getCourseEnrollment(course, userId);

  const isLoggedInParticipant =
    isLoggedIn &&
    (courseEnrollment?.status === CourseEnrollmentStatus_enum.CONFIRMED ||
      courseEnrollment?.status === CourseEnrollmentStatus_enum.COMPLETED);

  return (
    <div>
      {getCoursesAuthorizedLoading || getCoursesUnauthorizedLoading ? (
        <CircularProgress />
      ) : (
        <div className="flex flex-col space-y-24">
          <div className="flex flex-col space-y-24">
            <div
              className="h-96 p-3 text-3xl text-white flex justify-start items-end bg-cover bg-center bg-no-repeat"
              style={
                {
                  backgroundImage: `linear-gradient(51.32deg, rgba(0, 0, 0, 0.7) 17.57%, rgba(0, 0, 0, 0) 85.36%), url(${backgroundImage})`,
                } as React.CSSProperties
              }
            >
              <div className="max-w-screen-xl mx-auto w-full">{course.title}</div>
            </div>
            <div className="max-w-screen-xl mx-auto w-full">
              <PageBlock>
                <ContentRow className="items-center">
                  <div className="flex flex-1 flex-col text-white mb-20">
                    {course.weekDay !== 'NONE' ? (
                      <span className="text-xs">{getWeekdayStartAndEndString(course, lang, t)}</span>
                    ) : null}
                    <span className="text-2xl mt-2">{course.tagline}</span>
                  </div>
                  <div className="flex flex-1 lg:max-w-md">
                    <ActionButtons
                      course={course}
                      courseEnrollment={courseEnrollment}
                      setOnboardingModalOpen={setOnboardingModalOpen}
                    />
                  </div>
                </ContentRow>
              </PageBlock>
              {!isEventCourse &&
                isCourseWithEnrollment && // needed to assure the type of the course object
                courseEnrollment?.status === CourseEnrollmentStatus_enum.CONFIRMED &&
                (course.achievementCertificatePossible || course.attendanceCertificatePossible) && (
                  // <div className="mx-auto">
                  <ContentRow className="my-24 text-edu-black bg-white px-8 py-8">
                    {!isDegreeCourse && (
                      <>
                        <Attendances course={course} />
                        {!courseEnrollment?.achievementCertificateURL && (
                          <AchievementRecord
                            courseId={course.id}
                            achievementRecordUploadDeadline={course.Program.achievementRecordUploadDeadline}
                            courseTitle={course.title}
                          />
                        )}
                      </>
                    )}
                    {isDegreeCourse && <CompletedDegreeCourses degreeCourseId={course.id} />}
                    <CertificateDownload courseEnrollment={courseEnrollment} />
                  </ContentRow>
                  // </div>
                )}
              <ContentRow className="flex">
                <PageBlock classname="flex-1 text-white space-y-6">
                  <LearningGoals learningGoals={course.learningGoals} />
                  {!isDegreeCourse ? (
                    <Sessions sessions={course.Sessions} isLoggedInParticipant={isLoggedInParticipant} />
                  ) : (
                    <CurrentDegreeCourses degreeCourses={course.DegreeCourses} />
                  )}
                </PageBlock>
                <div className="pr-0 lg:pr-6 xl:pr-0">
                  <TimeLocationLanguageInstructors course={course} />
                </div>
              </ContentRow>
              <DescriptionFields course={course} />
            </div>
          </div>
          {isLoggedIn && (
            <OnboardingModal
              course={course}
              enrollmentId={enrollmentId}
              open={onboardingModalOpen}
              resetValues={resetValues}
              setModalOpen={setOnboardingModalOpen}
              refetchCourse={refetchCourse}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CourseContent;
