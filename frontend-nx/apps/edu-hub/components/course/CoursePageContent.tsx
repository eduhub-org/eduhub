import { FC, useState, useEffect } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@material-ui/core';

import { CoursePageDescriptionView } from './CoursePageDescriptionView';
import InvitationModal from './InvitationModal';
import { useLazyRoleQuery } from '../../hooks/authedQuery';
import { useUserId } from '../../hooks/user';
import { CourseWithEnrollment } from '../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../queries/courseWithEnrollment';
import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';
import { useIsLoggedIn } from '../../hooks/authentication';
import { COURSE } from '../../queries/course';
import { Course, CourseVariables } from '../../queries/__generated__/Course';

const CoursePageContent: FC<{ id: number }> = ({ id }) => {
  const { t } = useTranslation();
  const isLoggedIn = useIsLoggedIn();
  const userId = useUserId();
  const [modalOpen, setModalOpen] = useState(false);
  const [resetValues, setResetValues] = useState(null);

  const [
    getCoursesAuthorized,
    {
      data: authorizedCourseData,
      refetch: refetchCourse,
      loading: getCoursesAuthorizedLoading,
    },
  ] = useLazyRoleQuery<CourseWithEnrollment>(COURSE_WITH_ENROLLMENT, {
    variables: {
      id,
      userId,
    },
    async onCompleted(data) {
      const enrollmentStatus = data?.Course_by_pk?.CourseEnrollments[0]?.status;
      if (
        enrollmentStatus === CourseEnrollmentStatus_enum.INVITED &&
        data?.Course_by_pk?.CourseEnrollments[0]?.invitationExpirationDate.setHours(
          0,
          0,
          0,
          0
        ) >= new Date().setHours(0, 0, 0, 0)
      ) {
        setResetValues(true);
      }
    },
  });

  const [
    getCoursesUnauthorized,
    { data: unauthorizedCourseData, loading: getCoursesUnauthorizedLoading },
  ] = useLazyRoleQuery<Course, CourseVariables>(COURSE, {
    variables: {
      id,
    },
  });

  useEffect(() => {
    if (isLoggedIn) {
      getCoursesAuthorized();
    } else {
      getCoursesUnauthorized();
    }
  }, [isLoggedIn, getCoursesAuthorized, getCoursesUnauthorized]);

  const course =
    authorizedCourseData?.Course_by_pk || unauthorizedCourseData?.Course_by_pk;
  const enrollmentId =
    authorizedCourseData?.Course_by_pk?.CourseEnrollments[0]?.id;

  if (!course) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <div className="text-white">{t('course-page:courseNotAvailable')}</div>
      </div>
    );
  }

  return (
    <div>
      {getCoursesAuthorizedLoading || getCoursesUnauthorizedLoading ? (
        <CircularProgress />
      ) : (
        <>
          <CoursePageDescriptionView
            course={course}
            setInvitationModalOpen={setModalOpen}
          />
          {isLoggedIn && (
            <InvitationModal
              course={course}
              enrollmentId={enrollmentId}
              open={modalOpen}
              resetValues={resetValues}
              setModalOpen={setModalOpen}
              refetchCourse={refetchCourse}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CoursePageContent;
