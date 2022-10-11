import { TFunction } from "next-i18next";
import { FC, useCallback, useState } from "react";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { QUERY_LIMIT } from "../../pages/courses";
import {
  AdminCourseListVariables,
  AdminCourseList_Course,
} from "../../queries/__generated__/AdminCourseList";
import { Programs_Program } from "../../queries/__generated__/Programs";
import SingleCourseRow from "./SingleCourseRow";

interface IProps {
  t: TFunction;
  programs: Programs_Program[];
  courseListRequest: any;
  updateFilter: (newState: AdminCourseListVariables) => void;
}
const CourseListTable: FC<IProps> = ({
  courseListRequest,
  programs,
  t,
  updateFilter,
}) => {
  const tableHeaders: string[] = [
    t("tableHeaderOff"),
    t("tableHeaderTitle"),
    t("tableHeaderInstructor"),
    t("tableHeaderBewerb"),
    t("tableHeaderEingeladenOptions"),
    t("tableHeaderProgram"),
    t("tableHeaderStatus"),
  ];
  const courses: AdminCourseList_Course[] = [
    ...(courseListRequest.data?.Course ?? []),
  ];
  const refetchCourses = useCallback(() => {
    courseListRequest.refetch();
  }, [courseListRequest]);

  const count = courseListRequest.data?.Course_aggregate?.aggregate?.count || 0;
  return (
    <>
      <div className="flex flex-col space-y-10">
        <div className="overflow-x-auto transition-[height]">
          <table className="w-full">
            <thead>
              <tr>
                {tableHeaders.map((text) => {
                  return (
                    <th key={text} className="py-2 px-5">
                      <p className="flex justify-start font-medium text-gray-700 uppercase">
                        {text}
                      </p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <SingleCourseRow
                  key={course.id}
                  course={course}
                  programs={programs}
                  refetchCourses={refetchCourses}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
        {count > QUERY_LIMIT && (
          <Pagination
            courseListRequest={courseListRequest}
            programs={programs}
            updateFilter={updateFilter}
            t={t}
            count={count}
          />
        )}
      </div>
    </>
  );
};

export default CourseListTable;

/* #region Pagination */
interface IPageProps extends IProps {
  count: number;
}

const Pagination: FC<IPageProps> = ({
  t,
  courseListRequest,
  count,
  updateFilter,
}) => {
  const limit = QUERY_LIMIT;
  const pages = Math.ceil(count / QUERY_LIMIT);
  const [current_page, setCurrentPage] = useState(1);

  const calculateOffset = useCallback(
    (pageNumber: number) => {
      if (count <= limit) return 0;
      return pageNumber * limit - limit;
    },
    [limit, count]
  );

  const handlePrevious = useCallback(() => {
    setCurrentPage((prev) => {
      const currentPage = prev - 1;
      courseListRequest.refetch({
        ...courseListRequest.variables,
        offset: calculateOffset(currentPage),
      });
      return currentPage;
    });
  }, [setCurrentPage, calculateOffset, courseListRequest]);

  const handleNext = useCallback(() => {
    setCurrentPage((prev) => {
      const currentPage = prev + 1;
      courseListRequest.refetch({
        ...courseListRequest.variables,
        offset: calculateOffset(currentPage),
      });
      return currentPage;
    });
  }, [setCurrentPage, calculateOffset, courseListRequest]);

  return (
    <div className="flex justify-end pb-10">
      <div className="flex flex-row space-x-5">
        {current_page > 1 && (
          <MdArrowBack
            className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
            size={40}
            onClick={handlePrevious}
          />
        )}
        <p className="font-medium">
          {/* @ts-ignore */}
          {t("paginationText", { currentPage: current_page, totalPage: pages })}
        </p>

        {current_page < pages && (
          <MdArrowForward
            className="border-2 rounded-full cursor-pointer hover:bg-indigo-100"
            size={40}
            onClick={handleNext}
          />
        )}
      </div>
    </div>
  );
};
/* #endregion */
