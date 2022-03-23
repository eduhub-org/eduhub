import Head from "next/head";
import { FC, useCallback, useState } from "react";
import { useAdminMutation } from "../../hooks/authedMutation";
import { useAdminQuery, useAuthedQuery } from "../../hooks/authedQuery";
import { COURSE_LIST_WITH_FILTER } from "../../queries/courseList";
import {
  DELETE_A_COURSE,
  UPDATE_COURSE_PROPERTY,
} from "../../queries/mutateCourse";
import {
  CourseListWithFilter,
  CourseListWithFilterVariables,
  CourseListWithFilter_Course,
} from "../../queries/__generated__/CourseListWithFilter";
import {
  DeleteCourseByPk,
  DeleteCourseByPkVariables,
} from "../../queries/__generated__/DeleteCourseByPk";
import { ProgramListNoCourse_Program } from "../../queries/__generated__/ProgramListNoCourse";
import {
  UpdateCourseByPk,
  UpdateCourseByPkVariables,
} from "../../queries/__generated__/UpdateCourseByPk";
import EhAddButton from "../common/EhAddButton";
import ModalControl from "../common/ModalController";
import { Page } from "../Page";
import AddCourseForm from "./AddCourseForm";
import CourseOneRow from "./CourseOneRow";
import CourseListHeader from "./HeaderOptions";

const convertToILikeFilter = (input: string) => `%${input}%`;

interface IProps {
  programs: ProgramListNoCourse_Program[];
}

const CoursesDashBoard: FC<IProps> = ({ programs }) => {
  const titleOfThisPage = "List of courses";
  const titleOfAddCourseUI = "Kurs hinzufügen";
  const ADD_COURSE = "Add Course";
  const defaultProgram =
    programs.length > 0 && programs[0].shortTitle ? programs[0].shortTitle : "";
  const tableHeaders: string[] = [
    "Off.",
    "Title",
    "Kursleitung",
    "Bewerb",
    "eingeladen/ Bestätigt/ unbewertet",
    "Program",
    "Status",
  ];

  const [deleteACoursByPk] = useAdminMutation<
    DeleteCourseByPk,
    DeleteCourseByPkVariables
  >(DELETE_A_COURSE);

  /* #region callbacks */

  // Database Call
  const courseListRequest = useAdminQuery<
    CourseListWithFilter,
    CourseListWithFilterVariables
  >(COURSE_LIST_WITH_FILTER, {
    // variables: courseFilter, // state variable not rendering instantly
    variables: {
      courseTitle: convertToILikeFilter(""),
      programShortTitle: convertToILikeFilter(defaultProgram),
    },
  });

  if (courseListRequest.error) {
    console.log(courseListRequest);
  }

  const courses: CourseListWithFilter_Course[] = [
    ...(courseListRequest.data?.Course ?? []),
  ];

  // State variables
  const [courseFilter, setCourseFilter] = useState({
    courseTitle: "",
    programShortTitle: defaultProgram,
  });

  const handleRefetchRequest = useCallback(() => {
    setCourseFilter((prev) => {
      courseListRequest.refetch({
        courseTitle: convertToILikeFilter(prev.courseTitle),
        programShortTitle: convertToILikeFilter(prev.programShortTitle),
      });
      return prev;
    });
  }, [setCourseFilter, courseListRequest]);

  const [showModal, setShowModal] = useState(false);
  const openModalControl = useCallback(() => {
    setShowModal(!showModal);
  }, [showModal, setShowModal]);

  const onCloseAddCourseWindow = useCallback(
    (show: boolean) => {
      setShowModal(show);
    },
    [setShowModal]
  );

  const onSavedCourseCallback = useCallback(
    (onsuccess: boolean) => {
      if (onsuccess) {
        courseListRequest.refetch({
          courseTitle: convertToILikeFilter(courseFilter.courseTitle),
          programShortTitle: convertToILikeFilter(
            courseFilter.programShortTitle
          ),
        });
      }
      setShowModal(false);
    },
    [
      setShowModal,
      courseListRequest,
      courseFilter.programShortTitle,
      courseFilter.courseTitle,
    ]
  );

  const handleSemesterTabClick = useCallback(
    (tabID: string) => {
      setCourseFilter((prev) => {
        courseListRequest.refetch({
          courseTitle: convertToILikeFilter(prev.courseTitle),
          programShortTitle: convertToILikeFilter(tabID.trim()),
        });
        return { ...prev, programShortTitle: tabID.trim() };
      });
    },
    [setCourseFilter, courseListRequest]
  );

  const handleSearchInCourseTitle = useCallback(
    (searchedText: string) => {
      setCourseFilter((prev) => {
        courseListRequest.refetch({
          courseTitle: convertToILikeFilter(searchedText),
          programShortTitle: convertToILikeFilter(prev.programShortTitle),
        });
        return { ...prev, courseTitle: searchedText };
      });
    },
    [setCourseFilter, courseListRequest]
  );

  const handleDelete = useCallback(
    async (courseID: number) => {
      console.log(courseID);
      const response = await deleteACoursByPk({
        variables: {
          id: courseID,
        },
      });

      if (response.errors !== undefined) {
        courseListRequest.refetch({
          courseTitle: convertToILikeFilter(courseFilter.courseTitle),
          programShortTitle: convertToILikeFilter(
            courseFilter.programShortTitle
          ),
        });
      }
    },
    [
      courseListRequest,
      deleteACoursByPk,
      courseFilter.programShortTitle,
      courseFilter.courseTitle,
    ]
  );

  /* #endregion */
  return (
    <div>
      <Head>
        <title>{titleOfThisPage}</title>
      </Head>
      <Page>
        <div className="sm:px-0 w-full">
          <CourseListHeader
            programs={programs}
            onClickTab={handleSemesterTabClick}
            onSearch={handleSearchInCourseTitle}
            selectedSemester={courseFilter.programShortTitle}
          />
          <div className="bg-white py-4 flex justify-end">
            <EhAddButton
              buttonClickCallBack={openModalControl}
              text={ADD_COURSE}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap ">
              <thead>
                <tr className="focus:outline-none h-16 ">
                  {tableHeaders.map((text) => {
                    return (
                      <th key={text}>
                        <p
                          className="flex justify-start ml-5text-base 
                          font-medium leading-none text-gray-700 uppercase"
                        >
                          {text}
                        </p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <CourseOneRow
                    key={course.id}
                    course={course}
                    handleDelete={handleDelete}
                    refetchCourseList={handleRefetchRequest}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ModalControl
          modalTitle={titleOfAddCourseUI}
          onClose={onCloseAddCourseWindow}
          showModal={showModal}
        >
          <AddCourseForm
            programs={programs}
            onSavedCourse={onSavedCourseCallback}
          />
        </ModalControl>
      </Page>
    </div>
  );
};

export default CoursesDashBoard;
