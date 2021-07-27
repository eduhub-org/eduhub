import { useTranslation } from "next-i18next";
import { FC, useCallback, useState } from "react";

import { EnrollmentStatus_enum } from "../../__generated__/globalTypes";
import { useAuthedQuery } from "../../hooks/authedQuery";
import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { CourseWithEnrollment } from "../../queries/__generated__/CourseWithEnrollment";
import { COURSE_WITH_ENROLLMENT } from "../../queries/courseWithEnrollment";

import { ApplyButtonBlock } from "./ApplyButtonBlock";
import { CourseApplicationModal } from "./CourseApplicationModal";

interface IProps {
  course: Course_Course_by_pk;
}

export const EnrollmentStatus: FC<IProps> = ({ course }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation("course-application");

  const { data, loading, error } = useAuthedQuery<CourseWithEnrollment>(
    COURSE_WITH_ENROLLMENT,
    {
      variables: {
        id: course.Id,
      },
    }
  );

  const showModal = useCallback(() => setModalVisible(true), []);
  const hideModal = useCallback(() => setModalVisible(false), []);

  const enrollments = data?.Course_by_pk?.Enrollments;

  let content = null;

  if (!enrollments || enrollments.length !== 1) {
    content = <ApplyButtonBlock course={course} onClickApply={showModal} />;
  } else {
    const status = enrollments[0].Status;

    switch (status) {
      case EnrollmentStatus_enum.APPLIED: {
        content = (
          <span className="bg-gray-300 p-4">{t("status.applied")}</span>
        );
        break;
      }
      case EnrollmentStatus_enum.REJECTED: {
        content = (
          <span className="bg-gray-300 p-4">{t("status.rejected")}</span>
        );
        break;
      }
      default: {
        content = null;
      }
    }
  }

  return (
    <>
      {content}
      <CourseApplicationModal
        visible={isModalVisible}
        closeModal={hideModal}
        course={course}
      />
    </>
  );
};
