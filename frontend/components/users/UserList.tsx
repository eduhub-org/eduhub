import { TFunction } from "next-i18next";
import { FC, useCallback, useEffect, useState } from "react";
import { useAdminQuery } from "../../hooks/authedQuery";
import { USERS_BY_LAST_NAME } from "../../queries/user";
import {
  UesrsByLastName,
  UesrsByLastNameVariables,
} from "../../queries/__generated__/UesrsByLastName";
import { StaticComponentProperty } from "../../types/UIComponents";
import { User_bool_exp } from "../../__generated__/globalTypes";
import Loading from "../courses/Loading";
import UserListHeader from "./UserListHeader";
import UserListTable from "./UserListTable";
import UserPagination from "./UserPagination";

interface IProps {
  t: TFunction;
  searchedText: string;
}
const UserList: FC<IProps> = ({ t, searchedText }) => {
  const USER_TYPE_INSTUCTOR = 1;
  const USER_TYPE_SPEAKER = 2;
  const USER_TYPE_AMIN = 3;

  const LIMIT = 20;

  const userTypes: StaticComponentProperty[] = [
    { key: USER_TYPE_INSTUCTOR, label: t("courseInstructor"), selected: true },
    { key: USER_TYPE_SPEAKER, label: t("speaker"), selected: false },
    { key: USER_TYPE_AMIN, label: t("admin"), selected: false },
  ];

  /** Filter actually works inner joining multiple tables.
   * Example: To select Course Instructors:
   * We had to do inner join of three tables (User, Expert, CourseInstructor)
   * Inner join can be done as:
   *  { Experts: { CourseInstructors: {}} }
   *
   * @param {StaticComponentProperty} uTypes usert types
   * @returns {User_bool_exp} Filter user by boolean expressions
   * */
  const filterForUserTypes = (uTypes: StaticComponentProperty[]) => {
    const uesrFilter: User_bool_exp[] = [];

    uTypes.forEach((ut) => {
      if (!ut.selected) return;

      if (ut.key === USER_TYPE_AMIN) {
        uesrFilter.push({ Admins: {} });
      }
      if (ut.key === USER_TYPE_INSTUCTOR) {
        uesrFilter.push({ Experts: { CourseInstructors: {} } });
      }
      if (ut.key === USER_TYPE_SPEAKER) {
        uesrFilter.push({ Experts: { SessionSpeakers: {} } });
      }
    });

    if (uesrFilter.length === 0) return {};

    return {
      _or: uesrFilter,
    };
  };

  const [filter, setFilter] = useState(filterForUserTypes(userTypes));
  // GRAPHQL Related part
  const makeSearchFilter = [
    { lastName: { _ilike: `%${searchedText}%` } },
    { firstName: { _ilike: `%${searchedText}%` } },
    { email: { _ilike: `%${searchedText}%` } },
  ];
  // const userFilter = filterForUserTypes(uTypes);

  /**
   * Filter:
   * User has to be Instructor/Speaker/Admin, if the respective checkbox is selected.
   * Then we have to apply, Search filter.
   */
  const userListRequest = useAdminQuery<
    UesrsByLastName,
    UesrsByLastNameVariables
  >(USERS_BY_LAST_NAME, {
    variables: {
      limit: LIMIT,
      offset: 0,
      filter: {
        _and: [
          filter,
          {
            _or: makeSearchFilter,
          },
        ],
      },
    },
  });

  /* #region Callbacks */
  const handleAddButtonClick = useCallback(() => {
    userListRequest.refetch();
  }, [userListRequest]);

  const handleCheckBoxClick = useCallback(
    (nexItems: StaticComponentProperty[]) => {
      // setOffset()
      // userListRequest.refetch(
      //   { ...userListRequest.variables, filter: updateFilter(nexItems) }
      // );
      setFilter(filterForUserTypes(nexItems));
    },
    [setFilter]
  );
  /* #endregion */

  if (userListRequest.error) {
    console.log(userListRequest.error);
  }
  const users = userListRequest.data?.User || [];

  const totalCount =
    userListRequest.data?.User_aggregate?.aggregate?.count || 0;
  console.log(totalCount);
  return (
    <div className="flex flex-col space-y-10">
      <div className="flex justify-between w-full">
        <UserListHeader
          checkBoxItems={userTypes}
          handleAddButtonClick={handleAddButtonClick}
          handleCheckBoxClick={handleCheckBoxClick}
          t={t}
        />
      </div>
      <div className="flex flex-start">
        {userListRequest.loading ? (
          <Loading />
        ) : (
          users.length > 0 && <UserListTable t={t} users={users} />
        )}
      </div>
      {userListRequest.loading ? (
        <></>
      ) : (
        totalCount > LIMIT && (
          <UserPagination
            t={t}
            records={totalCount}
            defaultLimit={LIMIT}
            userListRequest={userListRequest}
          />
        )
      )}
    </div>
  );
};

export default UserList;
