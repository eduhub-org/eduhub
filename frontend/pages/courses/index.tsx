import Head from "next/head";
import { FC, useState } from "react";
import CourseOneRow from "../../components/courses/CourseOneRow";
import CourseListHeader from "../../components/courses/HeaderOptions";
import { Page } from "../../components/Page";
import { useAuthedQuery } from "../../hooks/authedQuery";
import { COURSE_INSTRUCTOR_LIST } from "../../queries/courseInstructorList";
import { ADMIN_COURSE_LIST } from "../../queries/courseList";
import { PROGRAM_LIST } from "../../queries/programList";
import { AdminCourseList } from "../../queries/__generated__/AdminCourseList";

const Courses: FC = () => {
  const result = useAuthedQuery<AdminCourseList>(ADMIN_COURSE_LIST);

  if (result.loading) {
    return (
      <Head>
        <title> Loading courses!</title>
      </Head>
    );
  }

  const thTextStyle =
    "flex justify-start ml-5 text-base font-medium leading-none text-gray-700 uppercase";
  const tableHeaders: string[] = [
    "Off.",
    "Title",
    "Kursleitung",
    "Bewerb",
    "eingeladen/ Bestätigt/ unbewertet",
    "Program",
    "Status",
  ];

  return (
    <div>
      <Head>
        <title>List of courses</title>
      </Head>
      <Page>
        <div className="sm:px-0 w-full">
          <CourseListHeader />
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
                {result.data?.Course.map((course) => (
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
