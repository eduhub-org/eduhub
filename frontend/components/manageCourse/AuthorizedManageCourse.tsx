import { FC, useCallback, useState } from "react";
import { useAdminQuery } from "../../hooks/authedQuery";
import { MANAGED_COURSE } from "../../queries/course";
import {
  ManagedCourse,
  ManagedCourseVariables,
  ManagedCourse_Course_by_pk,
} from "../../queries/__generated__/ManagedCourse";
import { CourseStatus_enum } from "../../__generated__/globalTypes";
import { PageBlock } from "../common/PageBlock";

interface Props {
  courseId: number;
}

const determineMaxAllowedTab = (courseStatus: CourseStatus_enum) => {
  let maxAllowedTab = 0;
  switch (courseStatus) {
    case CourseStatus_enum.READY_FOR_PUBLICATION:
      maxAllowedTab = 1;
      break;
    case CourseStatus_enum.READY_FOR_APPLICATION:
      maxAllowedTab = 2;
      break;
    case CourseStatus_enum.APPLICANTS_INVITED:
      maxAllowedTab = 3;
      break;
    case CourseStatus_enum.PARTICIPANTS_RATED:
      maxAllowedTab = 3;
      break;
  }
  return maxAllowedTab;
};

const determineTabClasses = (
  tabIndex: number,
  selectedTabIndex: number,
  courseStatus: CourseStatus_enum
) => {
  const maxAllowedTab = determineMaxAllowedTab(courseStatus);

  if (tabIndex === selectedTabIndex) {
    return "bg-edu-black text-white";
  }

  if (tabIndex <= maxAllowedTab) {
    return "bg-edu-confirmed cursor-pointer";
  }

  return "bg-edu-light-gray";
};

/**
 *
 *  Course status behavior:
 * DRAFT -> Only enable Kurzbeschreibung
 * READY_FOR_PUBLICATION -> allow to add Termine
 * READY_FOR_APPLICATION -> allow to view applications
 * APPLICANTS_INVITED/PARTICIPANTS_RATED -> allow to view everything
 *
 * the highest option available is selected by default!
 *
 * PARTICIPANTS_RATED is reached by clicking "zertifikate generieren", which is only shown in status APPLICANTS_INVITED
 *
 * @returns {any} the component
 */
export const AuthorizedManageCourse: FC<Props> = ({ courseId }) => {
  const qResult = useAdminQuery<ManagedCourse, ManagedCourseVariables>(
    MANAGED_COURSE,
    {
      variables: {
        id: courseId,
      },
    }
  );

  if (qResult.error) {
    console.log("query managed course error!", qResult.error);
  }

  console.log(qResult.data);

  const course: ManagedCourse_Course_by_pk | null =
    qResult.data?.Course_by_pk || null;

  const maxAllowedTab = determineMaxAllowedTab(
    course?.status || ("DRAFT" as any)
  );

  const [openTabIndex, setOpenTabIndex] = useState(0);
  const openTab0 = useCallback(() => {
    if (maxAllowedTab >= 0) {
      setOpenTabIndex(0);
    }
  }, [setOpenTabIndex, maxAllowedTab]);
  const openTab1 = useCallback(() => {
    if (maxAllowedTab >= 1) {
      setOpenTabIndex(1);
    }
  }, [setOpenTabIndex, maxAllowedTab]);
  const openTab2 = useCallback(() => {
    if (maxAllowedTab >= 2) {
      setOpenTabIndex(2);
    }
  }, [setOpenTabIndex, maxAllowedTab]);
  const openTab3 = useCallback(() => {
    if (maxAllowedTab >= 3) {
      setOpenTabIndex(3);
    }
  }, [setOpenTabIndex, maxAllowedTab]);

  if (course == null) {
    return <div>Kurs {courseId} wurde nicht gefunden!</div>;
  }
  return (
    <>
      <PageBlock>
        <>
          <div className="flex flex-row mb-12 mt-12">
            <h1 className="text-4xl font-bold">{course.title}</h1>
          </div>

          <div className="grid grid-cols-4 mb-20">
            <div
              className={`p-4 m-2 ${determineTabClasses(
                0,
                openTabIndex,
                course.status
              )}`}
              onClick={openTab0}
            >
              Kurzbeschreibung
            </div>

            <div
              className={`p-4 m-2 ${determineTabClasses(
                1,
                openTabIndex,
                course.status
              )}`}
              onClick={openTab1}
            >
              Termine
            </div>

            <div
              className={`p-4 m-2 ${determineTabClasses(
                2,
                openTabIndex,
                course.status
              )}`}
              onClick={openTab2}
            >
              Bewerbungen
            </div>

            <div
              className={`p-4 m-2 ${determineTabClasses(
                3,
                openTabIndex,
                course.status
              )}`}
              onClick={openTab3}
            >
              Teilnahmen & Leistungen
            </div>
          </div>

          <div className="grid grid-cols-2 ">
            <div>Kurzbeschreibung (max. 200 Zeichen)</div>
            <div>Lernziele (max. 500 Zeichen)</div>
          </div>
        </>
      </PageBlock>
    </>
  );
};
