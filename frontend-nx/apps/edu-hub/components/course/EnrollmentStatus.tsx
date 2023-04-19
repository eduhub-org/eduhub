import useTranslation from 'next-translate/useTranslation';
import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';

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
import { Button } from '../common/Button';

interface IProps {
  course: Course_Course_by_pk;
  setInvitationModalOpen: Dispatch<SetStateAction<boolean>>;
}

export const EnrollmentStatus: FC<IProps> = ({
  course,
  setInvitationModalOpen,
}) => {
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

  if (!enrollments || enrollments.length < 1) {
    // check if current date is after application deadline
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (course.applicationEnd <= currentDate) {
      content = (
        <span className="bg-gray-300 p-4">
          {t('status.applicationPeriodEnded')}
        </span>
      );
    } else {
      content = <ApplyButtonBlock course={course} onClickApply={showModal} />;
    }
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
      case CourseEnrollmentStatus_enum.CANCELLED: {
        content = (
          <span className="bg-gray-300 p-4">{t('status.cancelled')}</span>
        );
        break;
      }
      case CourseEnrollmentStatus_enum.INVITED: {
        if (enrollments[0].invitationExpirationDate.setHours(0, 0, 0, 0) > new Date().setHours(0, 0, 0, 0)) { 
          content = (
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="bg-gray-300 p-4 mb-6 sm:mb-0 sm:w-2/3 sm:mr-5">
                {t('status.invited')}
              </div>
              <Button
                filled
                inverted
                onClick={() => setInvitationModalOpen(true)}
                className="bg-edu-course-current sm:w-1/3"
              >
                {t('acceptInvitation')}
              </Button>
            </div>
          );
        } else {
          content = (
            <span className="bg-gray-300 p-4">{t('status.invitation_expired')}</span>
          );
        }
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
