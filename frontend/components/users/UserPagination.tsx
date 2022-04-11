import { QueryResult } from "@apollo/client";
import { TFunction } from "next-i18next";
import { FC, useCallback, useEffect, useState } from "react";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import {
  UesrsByLastName,
  UesrsByLastNameVariables,
} from "../../queries/__generated__/UesrsByLastName";

interface IProps {
  t: TFunction;
  defaultLimit: number;
  records: number;
  userListRequest: QueryResult<UesrsByLastName, UesrsByLastNameVariables>;
}
const UserPagination: FC<IProps> = ({
  t,
  defaultLimit,
  records,
  userListRequest,
}) => {
  const limit = defaultLimit;
  const pages = Math.ceil(records / limit);
  const [current_page, setCurrentPage] = useState(1);

  const calculateOffset = useCallback(
    (pageNumber: number) => {
      return pageNumber * limit - limit;
    },
    [limit]
  );

  const handlePrevious = useCallback(() => {
    setCurrentPage((prev) => {
      const currentPage = prev - 1;
      userListRequest.refetch({
        ...userListRequest.variables,
        offset: calculateOffset(currentPage),
      });
      return currentPage;
    });
  }, [setCurrentPage, calculateOffset, userListRequest]);

  const handleNext = useCallback(() => {
    setCurrentPage((prev) => {
      const currentPage = prev + 1;
      userListRequest.refetch({
        ...userListRequest.variables,
        offset: calculateOffset(currentPage),
      });
      return currentPage;
    });
  }, [setCurrentPage, calculateOffset, userListRequest]);

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

export default UserPagination;
