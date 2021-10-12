import Image from "next/image";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { getWeekdayString } from "../../helpers/dateHelpers";
import mysteryImg from "../../public/images/common/mystery.svg";
import languageIcon from "../../public/images/course/language.svg";
import pinIcon from "../../public/images/course/pin.svg";
import { Course_Course_by_pk } from "../../queries/__generated__/Course";

import { CourseCost } from "./CourseCost";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseMetaInfos: FC<IProps> = ({ course }) => {
  const { t, i18n } = useTranslation("course-page");
  const { t: tLanguage } = useTranslation("common");

  const startTime =
    course.startTime?.toLocaleTimeString(i18n.languages, {
      hour: "numeric",
      minute: "numeric",
    }) ?? "";
  const endTime =
    course.endTime?.toLocaleTimeString(i18n.languages, {
      hour: "numeric",
      minute: "numeric",
    }) ?? "";

  const instructor =
    course.CourseInstructors.length > 0
      ? course.CourseInstructors[0].Expert
      : undefined;

  const instructorName = `${instructor?.User?.firstName ?? ""} ${
    instructor?.User?.lastName ?? ""
  }`;
  const instructorAvatar = instructor?.User.picture;
  const instructorDescription = instructor?.description ?? "";

  return (
    <div className="flex flex-1 flex-col justify-center items-center lg:max-w-md bg-gray-100 p-12 sm:p-24">
      <div className="grid grid-cols-2 gap-x-8">
        {/* <div className="flex justify-center">
          <Image
            src="/images/course/difficulty-easy.svg"
            alt="Difficulty"
            width={35}
            height={26}
          />
        </div> */}
        <span className="text-lg mt-2 text-center">
          {getWeekdayString(course, tLanguage, true, true)}
        </span>
        {/* <span className="text-lg mt-2 text-center">
          {(course.Duration ?? 0) / 60}
        </span> */}
        {/* <span className="text-sm mt-2 text-center mb-12">
          {course.Difficulty}
        </span> */}
        <span className="text-lg mt-2 text-center">{course.ects}</span>
        <span className="text-sm mt-2 text-center mb-12">
          {startTime}
          {endTime ? <span> - {endTime}</span> : ""}
        </span>
        <span className="text-sm mt-2 text-center">{t("ects")}</span>
        {/* <span className="text-sm mt-2 text-center mb-12"> h/Woche</span> */}
        <div className="flex justify-center">
          <Image src={pinIcon} alt="Location" width={32} height={43} />
        </div>
        <div className="flex justify-center">
          <Image src={languageIcon} alt="Language" width={47} height={40} />
        </div>
        <span className="text-sm mt-2 text-center">
          {"Wo zur Hölle? Online?"}
        </span>
        <span className="text-sm mt-2 text-center">
          {tLanguage(course.language || "de")}
        </span>
      </div>
      <span className="my-12 sm:my-24">
        <CourseCost course={course} />
      </span>
      <div className="flex">
        <div className="flex flex-shrink-0 items-start mr-4">
          <Image
            src={instructorAvatar || mysteryImg}
            alt="Image of the course instructor"
            width={68}
            height={68}
            className="rounded-full overflow-hidden"
            objectFit="cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-base mb-1">{instructorName}</span>
          <span className="text-sm">{instructorDescription}</span>
        </div>
      </div>
    </div>
  );
};
