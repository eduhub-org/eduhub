import { Modal } from "@material-ui/core";
import Fade from "@material-ui/core/Fade";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import { FC, useCallback, useState } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { Button } from "../common/Button";

interface IProps {
  closeModal: () => void;
  course: Course_Course_by_pk;
  visible: boolean;
}

export const CourseApplicationModal: FC<IProps> = ({
  closeModal,
  course,
  visible,
}) => {
  const { t } = useTranslation("course-application");
  const [text, setText] = useState("");

  const onChangeText = useCallback((event) => {
    setText(event.target.value);
  }, []);

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
            <span className="text-base mb-2">{t("applicationFor")}</span>
            <span className="text-3xl font-semibold">{course.Name}</span>
            <span className="text-base">Anforderungen</span>
            <span className="text-sm">
              Anforderungen Hier ein Text über die Anforderungen für den Kurs.
              Wie lang ist der Text tatsächlich?
            </span>
            <span className="font-semibold mt-12">{t("motivationalText")}</span>
            <textarea
              onChange={onChangeText}
              className="h-48 mt-3 bg-gray-100 focus:border-none"
              value={text}
              placeholder={t("motivationalTextPlaceholder")}
            />
            <div className="flex justify-center my-6">
              <Button filled>{t("sendApplication")}</Button>
            </div>
          </div>
        </div>
      </Fade>
    </Modal>
  );
};
