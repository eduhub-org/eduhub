import Head from "next/head";
import { FC } from "react";
import CourseOneRow from "../../components/courses/CourseOneRow";
import CourseListHeader from "../../components/courses/HeaderOptions";
import { Page } from "../../components/Page";
import { useAuthedQuery } from "../../hooks/authedQuery";
import { useIsLoggedIn } from "../../hooks/authentication";
import { ADMIN_COURSE_LIST, COURSE_LIST } from "../../queries/courseList";
import { COURSE_LIST_WITH_ENROLLMENT } from "../../queries/courseListWithEnrollment";
import { CourseList } from "../../queries/__generated__/CourseList";
import { CourseListWithEnrollments } from "../../queries/__generated__/CourseListWithEnrollments";

const Courses: FC = () => {
  // Constants
  const thTextStyle =
    "flex justify-start ml-5 text-base font-medium leading-none text-gray-700 uppercase";
  const isLoggedIn = useIsLoggedIn();
  const tableHeaders: string[] = [
    "Off.",
    "Title",
    "Kursleitung",
    "Bewerb",
    "eingeladen/ Bestätigt/ unbewertet",
    "Program",
    "Status",
  ];
  const semesters: string[] = ["SOSE21", "WINSE21", "SOSE20", "WINSE20", "All"];
  const { data: courses, loading, error } = useAuthedQuery<CourseList>(
    ADMIN_COURSE_LIST
  );

  if (!courses) {
    return (
      <Head>
        <title>No courses!</title>
      </Head>
    );
  }

  return (
    <div>
      <Head>
        <title>List of courses</title>
      </Head>
      <Page>
        <div className="sm:px-0 w-full">
          <CourseListHeader semesters={semesters} />
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="focus:outline-none h-16 ">
                  {tableHeaders.map((text) => {
                    return (
                      <th key={text}>
                        <p className={thTextStyle}>{text}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {courses.Course.map((course) => (
                  <CourseOneRow key={course.id} course={course} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Page>
    </div>
  );
};

export default Courses;
