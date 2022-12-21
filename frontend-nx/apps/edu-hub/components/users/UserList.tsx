import { QueryResult } from "@apollo/client";
import { FC, useCallback, useEffect, useState } from "react";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { useAdminQuery } from "../../hooks/authedQuery";
import { USERS_BY_LAST_NAME } from "../../queries/user";
import {
  UesrsByLastName,
  UesrsByLastNameVariables,
  UesrsByLastName_User,
} from "../../queries/__generated__/UesrsByLastName";
import { StaticComponentProperty } from "../../types/UIComponents";
import { User_bool_exp } from "../../__generated__/globalTypes";
import EhAddButton from "../common/EhAddButton";
import EhCheckBox2 from "../common/EhCheckBox2";
import ModalControl from "../common/ModalController";
import Loading from "../courses/Loading";
import AddUser from "./AddUser";

interface IProps {
  t: any;
  searchedText: string;
}
const UserList: FC<IProps> = ({ t, searchedText }) => {
  const USER_TYPE_INSTUCTOR = 1;
  const USER_TYPE_SPEAKER = 2;
  const USER_TYPE_AMIN = 3;

  const LIMIT = 15;

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

  const handleCheckBoxClick = useCallback(
    (nexItems: StaticComponentProperty[]) => {
      setFilter(filterForUserTypes(nexItems));
    },
    [setFilter]
  );
  /* #endregion */

  if (userListRequest.error) {
    console.log(userListRequest.error);
  }
  const users = [...(userListRequest.data?.User || [])];

  const totalCount =
    userListRequest.data?.User_aggregate?.aggregate?.count || 0;
  return (
    <div className="flex flex-col space-y-10">
      <div className="flex justify-between w-full">
        <Header
          checkBoxItems={userTypes}
          handleCheckBoxClick={handleCheckBoxClick}
          t={t}
        />
      </div>
      <div className="flex flex-start">
        {userListRequest.loading ? (
          <Loading />
        ) : (
          users.length > 0 && <TableContent t={t} users={users} />
        )}
      </div>
      {userListRequest.loading ? (
        <></>
      ) : (
        totalCount > LIMIT && (
          <Pagination
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

interface IHeaderProps {
  t: any;
  checkBoxItems: StaticComponentProperty[];
  handleCheckBoxClick: (changedItems: StaticComponentProperty[]) => void;
}

const Header: FC<IHeaderProps> = ({
  t,
  checkBoxItems,
  handleCheckBoxClick,
}) => {
  const [menuItems, setMenuItems] = useState(checkBoxItems);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const handCheckBoxClick = useCallback(
    (obj: StaticComponentProperty) => {
      const newItems = menuItems.map((item) => {
        if (obj.key === item.key) return { ...item, selected: !obj.selected };
        return item;
      });
      setMenuItems(newItems);
      handleCheckBoxClick(newItems);
    },
    [setMenuItems, handleCheckBoxClick, menuItems]
  );

  const onCloseAddCourseWindow = useCallback(() => {
    setShowAddUserForm(false);
  }, [setShowAddUserForm]);

  const onAddUserClick = useCallback(() => {
    setShowAddUserForm(true);
  }, [setShowAddUserForm]);

  const handleCancleOfAddUserForm = useCallback(
    (success: boolean) => {
      setShowAddUserForm(false);
      if (success) {
        // refetch userlist
      }
    },
    [setShowAddUserForm]
  );

  return (
    <>
      <div className="grid content-center">
        <div className="flex space-x-5 flex-row">
          {menuItems.map((item) => (
            <EhCheckBox2
              key={item.key}
              onClickHandler={handCheckBoxClick}
              property={item}
            />
          ))}
        </div>
      </div>

      <div className="flex-end">
        <EhAddButton
          buttonClickCallBack={onAddUserClick}
          text={t("addUserButtonText")}
        />
      </div>
      <ModalControl
        modalTitle={t("addUserFormTitle")}
        onClose={onCloseAddCourseWindow}
        showModal={showAddUserForm}
      >
        <AddUser handleCancel={handleCancleOfAddUserForm} t={t} />
      </ModalControl>
    </>
  );
};

interface ITableContentProps {
  t: any;
  users: UesrsByLastName_User[];
}
const TableContent: FC<ITableContentProps> = ({ t, users }) => {
  const tableHeaders: StaticComponentProperty[] = [
    { key: 0, label: t("firstName") },
    { key: 1, label: t("lastName") },
    { key: 2, label: t("email") },
  ];
  return (
    <div className="overflow-x-auto transition-[height] w-full">
      <table className="w-full">
        <thead>
          <tr className="focus:outline-none">
            {tableHeaders.map((component) => {
              return (
                <th key={component.key} className="py-2 px-5">
                  <p className="flex justify-start font-medium text-gray-700 uppercase">
                    {component.label}
                  </p>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserOneRow key={user.id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Details of Row */
interface IPropsUser {
  user: UesrsByLastName_User;
}

const UserOneRow: FC<IPropsUser> = ({ user }) => {
  const pStyle = "text-gray-700 truncate font-medium max-w-xs";
  const tdStyple = "pl-5";

  return (
    <>
      <tr className="font-medium bg-edu-course-list h-12">
        <td className={tdStyple}>
          <p className={pStyle}>{user.firstName}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyle}>{user.lastName}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyle}>{user.email}</p>
        </td>
      </tr>
      <tr className="h-1" />
    </>
  );
};

interface IPaginationProps {
  t: any;
  defaultLimit: number;
  records: number;
  userListRequest: QueryResult<UesrsByLastName, UesrsByLastNameVariables>;
}
const Pagination: FC<IPaginationProps> = ({
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
          {/* @ts-ignore: https://github.com/i18next/react-i18next/issues/1543 */}
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
