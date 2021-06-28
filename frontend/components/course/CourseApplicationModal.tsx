import { Modal } from "@material-ui/core";
import Fade from "@material-ui/core/Fade";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import { FC, useCallback, useState } from "react";

import { EnrollmentStatus_enum } from "../../__generated__/globalTypes";
import { enrollmentStatusForCourse } from "../../helpers/courseHelpers";
import { useAuthedMutation } from "../../hooks/authedMutation";
import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { CourseWithEnrollment_Course_by_pk } from "../../queries/__generated__/CourseWithEnrollment";
import { InsertEnrollment } from "../../queries/__generated__/InsertEnrollment";
import { INSERT_ENROLLMENT } from "../../queries/insertEnrollment";

import { CourseApplicationModalFormContent } from "./CourseApplicationModalFormContent";
import { CourseApplicationModalSuccessContent } from "./CourseApplicationModalSuccessContent";

interface IProps {
  closeModal: () => void;
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk;
  visible: boolean;
}

export const CourseApplicationModal: FC<IProps> = ({
  closeModal,
  course,
  visible,
}) => {
  const [text, setText] = useState("");

  const onChangeText = useCallback((event) => {
    setText(event.target.value);
  }, []);

  const [
    insertMutation,
    { data, loading, error },
  ] = useAuthedMutation<InsertEnrollment>(INSERT_ENROLLMENT);

  const applyForCourse = useCallback(() => {
    insertMutation({
      variables: {
        courseId: course.Id,
        participantId: 7061,
        motivationLetter: text,
      },
    });
  }, [course.Id, insertMutation, text]);

  const status = enrollmentStatusForCourse(course);

  return (
    <Modal
      open={visible}
      onClose={closeModal}
      className="flex justify-center items-center border-none"
      disableEnforceFocus
      disableBackdropClick={text.length > 0}
      closeAfterTransition
    >
      <Fade in={visible}>
        <div className="w-full sm:w-auto h-full sm:h-auto sm:m-16 sm:rounded bg-white">
          <div className="flex">
            <div className="flex p-6 cursor-pointer" onClick={closeModal}>
              <Image
                src="/images/common/x-calibur.svg"
                width={22}
                height={21}
              />
            </div>
          </div>
          <div className="flex flex-col mt-4 mx-6 sm:mx-20">
            {status === "NOT_APPLIED" ? (
              <CourseApplicationModalFormContent
                applyForCourse={applyForCourse}
                course={course}
                setText={onChangeText}
                text={text}
              />
            ) : status === EnrollmentStatus_enum.APPLIED ? (
              <CourseApplicationModalSuccessContent closeModal={closeModal} />
            ) : null}
          </div>
        </div>
      </Fade>
    </Modal>
  );
};
