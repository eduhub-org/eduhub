import { Modal } from '@material-ui/core';
import Fade from '@material-ui/core/Fade';
import Image from 'next/image';
import { ChangeEvent, FC, useCallback, useState } from 'react';

import { CourseEnrollmentStatus_enum } from '../../../../../__generated__/globalTypes';
// import { enrollmentStatusForCourse } from '../../../../../../helpers/courseHelpers';
import { useAuthedMutation } from '../../../../../hooks/authedMutation';
import { useUserId } from '../../../../../hooks/user';
import xIcon from '../../../../../public/images/common/x-calibur-black.svg';
import { Course_Course_by_pk } from '../../../../../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk } from '../../../../../queries/__generated__/CourseWithEnrollment';
import { InsertEnrollment, InsertEnrollmentVariables } from '../../../../../queries/__generated__/InsertEnrollment';
import { INSERT_ENROLLMENT } from '../../../../../queries/insertEnrollment';

import { CourseApplicationModalFormContent } from './FormContent';
import { ApplicationSuccessMessage } from './ApplicationSuccessMessage';
import { getCourseEnrollment } from '../../../../../helpers/util';

interface IProps {
  closeModal: () => void;
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk;
  visible: boolean;
}

export const ApplicationModal: FC<IProps> = ({ closeModal, course, visible }) => {
  const [text, setText] = useState('');
  const userId = useUserId();

  const onChangeText = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  }, []);

  const [insertMutation] = useAuthedMutation<InsertEnrollment, InsertEnrollmentVariables>(INSERT_ENROLLMENT);

  const applyForCourse = useCallback(() => {
    if (!userId) {
      // eslint-disable-next-line no-console
      console.log('Missing user data.');
      return;
    }

    insertMutation({
      variables: {
        courseId: course.id,
        userId,
        motivationLetter: text,
      },
    });
  }, [course.id, insertMutation, text, userId]);

  const status = getCourseEnrollment(course, userId)?.status || 'NOT_APPLIED';

  return (
    <Modal
      open={visible}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          closeModal();
        }
      }}
      className="flex justify-center items-center border-none"
      disableEnforceFocus
      closeAfterTransition
    >
      <Fade in={visible}>
        <div className="w-full sm:w-auto h-full sm:h-auto sm:m-16 sm:rounded bg-white overflow-auto">
          <div className="flex">
            <div className="flex p-6 cursor-pointer" onClick={closeModal}>
              <Image src={xIcon} width={22} height={21} alt="close icon" />
            </div>
          </div>
          <div className="flex flex-col mt-4 mx-6 sm:mx-20">
            {status === 'NOT_APPLIED' ? (
              <CourseApplicationModalFormContent
                applyForCourse={applyForCourse}
                course={course}
                setText={onChangeText}
                text={text}
              />
            ) : status === CourseEnrollmentStatus_enum.APPLIED ? (
              <ApplicationSuccessMessage closeModal={closeModal} />
            ) : null}
          </div>
        </div>
      </Fade>
    </Modal>
  );
};
