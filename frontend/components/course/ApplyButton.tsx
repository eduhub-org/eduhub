import { FC, useState } from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { Button } from "../common/Button";

import { CourseApplicationModal } from "./CourseApplicationModal";

interface IProps {
  course: Course_Course_by_pk;
}

export const ApplyButton: FC<IProps> = ({ course }) => {
  const { t } = useTranslation("course-application");
  const [isModalVisible, setModalVisible] = useState(false);
  return (
    <>
      <div className="cursor-pointer">
        <Button filled onClick={() => setModalVisible(!isModalVisible)}>
          {t("applyNow")}
        </Button>
      </div>
      <CourseApplicationModal
        visible={isModalVisible}
        closeModal={() => setModalVisible(false)}
        course={course}
      />
    </>
  );
};
