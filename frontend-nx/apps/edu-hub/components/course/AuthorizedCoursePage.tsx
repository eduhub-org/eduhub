import { FC, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';

import { CoursePageDescriptionView } from '../../components/course/CoursePageDescriptionView';
import InvitationModal from './InvitationModal';
import { useRoleQuery } from '../../hooks/authedQuery';
import { useUserId } from '../../hooks/user';
import { CourseWithEnrollment } from '../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../queries/courseWithEnrollment';
import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';

const AuthorizedCoursePage: FC<{ id: number }> = ({ id }) => {
  const { t } = useTranslation();
  const userId = useUserId();
  const [modalOpen, setModalOpen] = useState(false);
  const [resetValues, setResetValues] = useState(null);

  console.log('userId Logged in', userId);


  const { data: courseData, refetch: refetchCourse } =
    useRoleQuery<CourseWithEnrollment>(COURSE_WITH_ENROLLMENT, {
      variables: {
        id,
        userId,
      },
      async onCompleted(data) {
        const enrollmentStatus =
          data?.Course_by_pk?.CourseEnrollments[0]?.status;
        if ((enrollmentStatus === CourseEnrollmentStatus_enum.INVITED) && (data?.Course_by_pk?.CourseEnrollments[0]?.invitationExpirationDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0))) {
          setResetValues(true);
        }
      },
    });

  const course = courseData?.Course_by_pk;
  const enrollmentId = courseData?.Course_by_pk?.CourseEnrollments[0]?.id;

  if (!course) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <div className="text-white">{t('course-page:courseNotAvailable')}</div>
      </div>
    );
  }

  return (
    <div>
      <CoursePageDescriptionView
        course={course}
        setInvitationModalOpen={setModalOpen}
      />
      <InvitationModal
        course={course}
        enrollmentId={enrollmentId}
        open={modalOpen}
        resetValues={resetValues}
        setModalOpen={setModalOpen}
        refetchCourse={refetchCourse}
      />
    </div>
  );
};

export default AuthorizedCoursePage;
