import { FC } from "react";
import useTranslation from 'next-translate/useTranslation';

import { CourseEnrollmentStatus_enum } from "../../__generated__/globalTypes";
import { PageBlock } from "../../components/common/PageBlock";
import { CoursePageDescriptionView } from "../../components/course/CoursePageDescriptionView";
import { CoursePageStudentView } from "../../components/course/CoursePageStudentView";
import { TabSelection } from "../../components/course/TabSelection";
import { enrollmentStatusForCourse } from "../../helpers/courseHelpers";
import { useAuthedQuery } from "../../hooks/authedQuery";
import { useUserId } from "../../hooks/user";
import { CourseWithEnrollment } from "../../queries/__generated__/CourseWithEnrollment";
import { COURSE_WITH_ENROLLMENT } from "../../queries/courseWithEnrollment";

const AuthorizedCoursePage: FC<{ id: number; tab: number }> = ({ id, tab }) => {
  const { t } = useTranslation("course-page");
  const userId = useUserId();

  const {
    data: courseData,
  } = useAuthedQuery<CourseWithEnrollment>(COURSE_WITH_ENROLLMENT, {
    variables: {
      id,
      userId,
    },
  });

  const course = courseData?.Course_by_pk;

  if (!course) {
    return <div>{t("courseNotAvailable")}</div>;
  }

  const isParticipating =
    enrollmentStatusForCourse(course) ===
    CourseEnrollmentStatus_enum.CONFIRMED ||
    enrollmentStatusForCourse(course) === CourseEnrollmentStatus_enum.COMPLETED;

  return (
    <>
      {isParticipating ? (
        <PageBlock>
          <div className="py-4">
            <TabSelection
              currentTab={tab}
              tabs={[t("toCourseDescription"), t("currentCourse")]}
            />
          </div>
        </PageBlock>
      ) : null}
      {tab === 0 || !isParticipating ? (
        <CoursePageDescriptionView course={course} />
      ) : (
        <CoursePageStudentView course={course} />
      )}
    </>
  );
};

export default AuthorizedCoursePage;
