import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useEffect, useState } from 'react';

import { CourseEnrollmentStatus_enum } from '../../__generated__/globalTypes';
import { useAuthedQuery } from '../../hooks/authedQuery';
import { useUser, useUserId } from '../../hooks/user';
import { Course_Course_by_pk } from '../../queries/__generated__/Course';
import {
  CourseWithEnrollment,
  CourseWithEnrollmentVariables,
} from '../../queries/__generated__/CourseWithEnrollment';
import { COURSE_WITH_ENROLLMENT } from '../../queries/courseWithEnrollment';

import { CourseLinkInfos } from './CourseLinkInfos';
import { ApplyButtonBlock } from './ApplyButtonBlock';
import { CourseApplicationModal } from './CourseApplicationModal';
import { UserInfoModal } from './UserInfoModal';

interface IProps {
  course: Course_Course_by_pk;
}

export const EnrollmentStatus: FC<IProps> = ({ course }) => {
  const [isUserInfoModalVisible, setUserInfoModalVisible] = useState(false);
  const [isApplicationModalVisible, setApplicationModalVisible] =
    useState(false);
  const { t } = useTranslation('course-application');

  const user = useUser();
  const userId = useUserId();
  const { data } = useAuthedQuery<
    CourseWithEnrollment,
    CourseWithEnrollmentVariables
  >(COURSE_WITH_ENROLLMENT, {
    variables: {
      id: course.id,
      userId,
    },
  });

  const showModal = useCallback(() => {
    if (!user) {
      setUserInfoModalVisible(true);
    } else {
      setApplicationModalVisible(true);
    }
  }, [user]);
  const hideUserInfoModal = useCallback(
    () => setUserInfoModalVisible(false),
    []
  );
  const hideApplicationModal = useCallback(
    () => setApplicationModalVisible(false),
    []
  );

  useEffect(() => {
    if (user && isUserInfoModalVisible) {
      setUserInfoModalVisible(false);
      setApplicationModalVisible(true);
    }
  }, [user, isUserInfoModalVisible]);

  const enrollments = data?.Course_by_pk?.CourseEnrollments;

  // const onlineMeetingLink = 'https://zoom.us';

  let content = null;

  if (!enrollments || enrollments.length !== 1) {
    content = <ApplyButtonBlock course={course} onClickApply={showModal} />;
  } else {
    const status = enrollments[0].status;

    switch (status) {
      case CourseEnrollmentStatus_enum.ABORTED: {
        content = (
          <span className="bg-gray-300 p-4">{t('status.aborted')}</span>
        );
        break;
      }
      case CourseEnrollmentStatus_enum.APPLIED: {
        content = (
          <span className="bg-gray-300 p-4">{t('status.applied')}</span>
        );
        break;
      }
      case CourseEnrollmentStatus_enum.REJECTED: {
        content = (
          <span className="bg-gray-300 p-4">{t('status.rejected')}</span>
        );
        break;
      }
      case CourseEnrollmentStatus_enum.CONFIRMED: {
        content = <CourseLinkInfos course={course} />;
        break;
      }
      case CourseEnrollmentStatus_enum.COMPLETED: {
        content = <CourseLinkInfos course={course} />;
        break;
      }
      default: {
        content = null;
      }
    }
  }

  return (
    <>
      <div className="flex mx-auto mb-10">{content}</div>
      <UserInfoModal
        visible={isUserInfoModalVisible && !user}
        closeModal={hideUserInfoModal}
        course={course}
      />
      <CourseApplicationModal
        visible={isApplicationModalVisible}
        closeModal={hideApplicationModal}
        course={course}
      />
    </>
  );
};
