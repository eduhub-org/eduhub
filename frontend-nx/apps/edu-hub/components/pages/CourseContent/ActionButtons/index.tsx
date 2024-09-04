import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';

import { CourseEnrollmentStatus_enum } from '../../../../__generated__/globalTypes';
import { useUser } from '../../../../hooks/user';
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from '../../../../queries/__generated__/CourseWithEnrollment';

import { ApplyButton } from './ApplyButton';
import { ApplicationModal } from './ApplicationModal';

import { Button } from '../../../common/Button';

import { Course_Course_by_pk } from '../../../../queries/__generated__/Course';
import { useIsLoggedIn } from '../../../../hooks/authentication';
import { signIn } from 'next-auth/react';

interface CourseLinkInfosProps {
  course: Course_Course_by_pk;
}

const CourseLinkInfos: FC<CourseLinkInfosProps> = ({ course }) => {
  const { t } = useTranslation();

  const onlineLocation = course.CourseLocations.find((location) => location.locationOption === 'ONLINE');

  return (
    <div className="flex flex-col justify-between items-center">
      <div className="mb-10 ">
        <Button className=" bg-blue-200" as="a" href={course.chatLink} filled inverted>
          {t('course:toCourseChat')}
        </Button>
      </div>
      {onlineLocation && onlineLocation.defaultSessionAddress && (
        <div className="">
          <Button className=" bg-blue-200" as="a" href={onlineLocation.defaultSessionAddress} filled inverted>
            {t('course:toOnlineMeeting')}
          </Button>
        </div>
      )}
    </div>
  );
};

interface ActionButtonsProps {
  course: Course_Course_by_pk;
  courseEnrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments;
  // setOnboardingModalOpen: Dispatch<SetStateAction<boolean>>;
}

export const ActionButtons: FC<ActionButtonsProps> = ({ course, courseEnrollment }) => {
  const [isApplicationModalVisible, setApplicationModalVisible] = useState(false);
  const { t } = useTranslation('course-application');
  const isLoggedIn = useIsLoggedIn();

  const user = useUser();

  const showModal = useCallback(() => {
    if (user) {
      setApplicationModalVisible(true);
    }
  }, [user]);
  const hideApplicationModal = useCallback(() => setApplicationModalVisible(false), []);

  let content = null;

  if (!courseEnrollment) {
    content = <ApplyButton course={course} onClickApply={showModal} />;
  } else {
    const status = courseEnrollment.status;

    switch (status) {
      case CourseEnrollmentStatus_enum.ABORTED: {
        content = <span className="bg-gray-300 p-4">{t('status.aborted')}</span>;
        break;
      }
      case CourseEnrollmentStatus_enum.APPLIED: {
        content = <span className="bg-gray-300 p-4">{t('status.applied')}</span>;
        break;
      }
      case CourseEnrollmentStatus_enum.REJECTED: {
        content = <span className="bg-gray-300 p-4">{t('status.rejected')}</span>;
        break;
      }
      case CourseEnrollmentStatus_enum.CANCELLED: {
        content = <span className="bg-gray-300 p-4">{t('status.cancelled')}</span>;
        break;
      }
      // case CourseEnrollmentStatus_enum.INVITED: {
      //   if (courseEnrollment.invitationExpirationDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)) {
      //     content = (
      //       <div className="flex flex-col sm:flex-row sm:items-center">
      //         <div className="bg-gray-300 p-4 mb-6 sm:mb-0 sm:w-2/3 sm:mr-5">{t('status.invited')}</div>
      //         <Button
      //           filled
      //           inverted
      //           onClick={() => setOnboardingModalOpen(true)}
      //           className="bg-edu-course-current sm:w-1/3"
      //         >
      //           {t('acceptInvitation')}
      //         </Button>
      //       </div>
      //     );
      //   } else {
      //     content = <span className="bg-gray-300 p-4">{t('status.invitation_expired')}</span>;
      //   }
      //   break;
      // }
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

  const signInHandler = () => {
    console.log('signIN!');
    return signIn('keycloak');
  };

  const hasExternalRegistration = course.externalRegistrationLink !== null && course.externalRegistrationLink !== '';
  const eventHandler = () => {
    window.open(course.externalRegistrationLink, '_blank');
  };

  return (
    <>
      <div className="flex mx-auto mb-10">
        {hasExternalRegistration ? (
          <div className="mx-auto mb-10">
            <ApplyButton course={course} onClickApply={eventHandler} />
          </div>
        ) : isLoggedIn && !hasExternalRegistration ? (
          content
        ) : (
          <div className="mx-auto mb-10">
            <ApplyButton course={course} onClickApply={signInHandler} />
          </div>
        )}
      </div>
      <ApplicationModal visible={isApplicationModalVisible} closeModal={hideApplicationModal} course={course} />
    </>
  );
};
