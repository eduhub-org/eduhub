import useTranslation from 'next-translate/useTranslation';
import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { CourseEnrollmentStatus_enum } from '../../../__generated__/globalTypes';
import { useUser } from '../../../hooks/user';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../queries/__generated__/CourseWithEnrollment';

import { ApplyButton } from '../ApplyButton';
import { ApplicationModal } from './ApplicationModal';

import { Button } from '../../common/Button';

import { Course_Course_by_pk } from '../../../queries/__generated__/Course';

interface CourseLinkInfosProps {
  course: Course_Course_by_pk;
}

const CourseLinkInfos: FC<CourseLinkInfosProps> = ({ course }) => {
  const { t } = useTranslation();

  const onlineLocation = course.CourseLocations.find(
    (location) => location.locationOption === 'ONLINE'
  );

  return (
    <div className="flex justify-center items-center">
      {onlineLocation && onlineLocation.defaultSessionAddress && (
        <div className="mx-4">
          {/* <a
            href={onlineLocation.defaultSessionAddress}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white inline-block max-w-[100px]"
          >
            {t('course-page:to-online-meeting')}
          </a> */}
          <Button
            as="a"
            href={onlineLocation.defaultSessionAddress}
            filled
            inverted
            // className="bg-edu-course-current"
          >
            {t('course-page:to-online-meeting')}
          </Button>
        </div>
      )}{' '}
      <div className="mx-4">
        <Button
          as="a"
          href={course.chatLink}
          filled
          inverted
          // className="bg-edu-course-current"
        >
          {t('course-page:to-chat')}
        </Button>
      </div>
    </div>
  );
};

interface IProps {
  course: Course_Course_by_pk;
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  setOnboardingModalOpen: Dispatch<SetStateAction<boolean>>;
}

export const EnrollmentUIController: FC<IProps> = ({
  course,
  courseEnrollment,
  setOnboardingModalOpen,
}) => {
  const [isApplicationModalVisible, setApplicationModalVisible] =
    useState(false);
  const { t } = useTranslation('course-application');

  const user = useUser();

  const showModal = useCallback(() => {
    if (user) {
      setApplicationModalVisible(true);
    }
  }, [user]);
  const hideApplicationModal = useCallback(
    () => setApplicationModalVisible(false),
    []
  );

  useEffect(() => {
    if (user) {
      setApplicationModalVisible(true);
    }
  }, [user]);

  console.log(`ApplicationModalVisible: `, isApplicationModalVisible);

  let content = null;

  if (!courseEnrollment) {
    content = <ApplyButton course={course} onClickApply={showModal} />;
  } else {
    const status = courseEnrollment.status;

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
        if (
          courseEnrollment.invitationExpirationDate.setHours(0, 0, 0, 0) >=
          new Date().setHours(0, 0, 0, 0)
        ) {
          content = (
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="bg-gray-300 p-4 mb-6 sm:mb-0 sm:w-2/3 sm:mr-5">
                {t('status.invited')}
              </div>
              <Button
                filled
                inverted
                onClick={() => setOnboardingModalOpen(true)}
                className="bg-edu-course-current sm:w-1/3"
              >
                {t('acceptInvitation')}
              </Button>
            </div>
          );
        } else {
          content = (
            <span className="bg-gray-300 p-4">
              {t('status.invitation_expired')}
            </span>
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
      <ApplicationModal
        visible={isApplicationModalVisible}
        closeModal={hideApplicationModal}
        course={course}
      />
    </>
  );
};
