import { QueryResult } from '@apollo/client';
import { FC, useCallback, useState, useEffect } from 'react';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';
import { useAdminQuery } from '../../hooks/authedQuery';
import { USERS_BY_LAST_NAME } from '../../queries/user';
import {
  UsersByLastName,
  UsersByLastNameVariables,
  UsersByLastName_User,
} from '../../queries/__generated__/UsersByLastName';
import { StaticComponentProperty } from '../../types/UIComponents';
import EhAddButton from '../common/EhAddButton';
import EhCheckBox2 from '../common/EhCheckBox2';
import ModalControl from '../common/Modal';
import Loading from '../common/Loading';
import AddUser from './AddUser';

import { PROGRAMS_WITH_MINIMUM_PROPERTIES } from '../../queries/programList';
import { Programs } from '../../queries/__generated__/Programs';
import { Programs_Program } from '../../queries/__generated__/Programs';

import {
  User_bool_exp,
  CourseEnrollmentStatus_enum,
} from '../../__generated__/globalTypes';
import useTranslation from 'next-translate/useTranslation';

interface IProps {
  t: any;
  searchedText: string;
}
const UserList: FC<IProps> = ({ t, searchedText }) => {
  const [selectedProgram, setSelectedProgram] =
    useState<Programs_Program | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Fetch the list of programs to display in the filter dropdown
  const programsRequest = useAdminQuery<Programs>(
    PROGRAMS_WITH_MINIMUM_PROPERTIES
  );

  const USER_TYPE_INSTUCTOR = 1;
  const USER_TYPE_SPEAKER = 2;
  const USER_TYPE_AMIN = 3;

  const LIMIT = 15;

  const userTypes: StaticComponentProperty[] = [
    { key: USER_TYPE_INSTUCTOR, label: t('courseInstructor'), selected: false },
    { key: USER_TYPE_SPEAKER, label: t('speaker'), selected: false },
    { key: USER_TYPE_AMIN, label: t('admin'), selected: false },
  ];

  useEffect(() => {
    setFilter(filterForUserTypes(userTypes));
  }, [selectedProgram, selectedStatuses, userTypes]);

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
    const userFilter: User_bool_exp[] = [];

    uTypes.forEach((ut) => {
      if (!ut.selected) return;

      if (ut.key === USER_TYPE_AMIN) {
        userFilter.push({ Admins: {} });
      }
      if (ut.key === USER_TYPE_INSTUCTOR) {
        userFilter.push({ Experts: { CourseInstructors: {} } });
      }
      if (ut.key === USER_TYPE_SPEAKER) {
        userFilter.push({ Experts: { SessionSpeakers: {} } });
      }
    });
    if (selectedProgram) {
      userFilter.push({
        CourseEnrollments: {
          Course: { programId: { _eq: selectedProgram.id } },
        },
      });
    }

    if (selectedStatuses.length > 0) {
      userFilter.push({
        CourseEnrollments: {
          status: { _in: selectedStatuses as CourseEnrollmentStatus_enum[] },
        },
      });
    }

    if (userFilter.length === 0) return {};
    return {
      _or: userFilter,
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
    UsersByLastName,
    UsersByLastNameVariables
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

  // Add a new callback for handling the program filter change
  const handleProgramFilterChange = useCallback(
    (program: Programs_Program | null) => {
      setSelectedProgram(program);
    },
    [setSelectedProgram]
  );

  // Add a new callback for handling the enrollment status filter change
  const handleStatusFilterChange = useCallback(
    (statuses: string[]) => {
      setSelectedStatuses(statuses);
    },
    [setSelectedStatuses]
  );

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
    <div className="flex flex-col space-y-10 text-white">
      <div className="flex justify-between w-full">
        <Header
          checkBoxItems={userTypes}
          handleCheckBoxClick={handleCheckBoxClick}
          t={t}
          programs={programsRequest.data?.Program || []}
          handleProgramFilterChange={handleProgramFilterChange}
          handleStatusFilterChange={handleStatusFilterChange}
        />
        ;
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
  programs: Programs_Program[];
  handleProgramFilterChange: (program: Programs_Program | null) => void;
  handleStatusFilterChange: (statuses: string[]) => void;
}
const Header: FC<IHeaderProps> = ({
  t,
  checkBoxItems,
  handleCheckBoxClick,
  programs,
  handleProgramFilterChange,
  handleStatusFilterChange,
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

  const handleCancelOfAddUserForm = useCallback(
    (success: boolean) => {
      setShowAddUserForm(false);
      if (success) {
        // refetch userlist
      }
    },
    [setShowAddUserForm]
  );

  // Callback for the program filter change
  const onProgramFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedProgramId = parseInt(event.target.value, 10);
      const selectedProgram = programs.find(
        (program) => program.id === selectedProgramId
      );
      handleProgramFilterChange(selectedProgram || null);
    },
    [programs, handleProgramFilterChange]
  );

  // Callback for the enrollment status filter change
  /*  const onStatusFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(
        event.target.selectedOptions,
        (option) => option.value
      );
      handleStatusFilterChange(selectedOptions);
    },
    [handleStatusFilterChange]
  );*/

  return (
    <>
      <div className="flex space-x-5">
        <label>
          {t('users:filterByProgram')}:&nbsp;
          <select onChange={onProgramFilterChange} className="text-gray-800">
            <option value="">{t('users:allPrograms')}</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </label>
        {/* <label>
          {t('filterByStatus')}
          <select onChange={onStatusFilterChange} className="text-gray-800">
            <option value="CONFIRMED">{t('confirmed')}</option>
            <option value="COMPLETED">{t('completed')}</option>
            <option value="INVITED">{t('invited')}</option>
            <option value="CANCELLED">{t('cancelled')}</option>
            <option value="">{t('completed')}</option>
          </select>
        </label> */}
      </div>

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

      <div className="flex-end text-white">
        <EhAddButton
          buttonClickCallBack={onAddUserClick}
          text={t('addUserButtonText')}
        />
      </div>
      <ModalControl
        close={onCloseAddCourseWindow}
        isOpen={showAddUserForm}
        title={t('addUserFormTitle')}
      >
        <AddUser handleCancel={handleCancelOfAddUserForm} t={t} />
      </ModalControl>
    </>
  );
};

interface ITableContentProps {
  t: any;
  users: UsersByLastName_User[];
}
const TableContent: FC<ITableContentProps> = ({ t, users }) => {
  const tableHeaders: StaticComponentProperty[] = [
    { key: 0, label: t('firstName') },
    { key: 1, label: t('lastName') },
    { key: 2, label: t('email') },
  ];
  return (
    <div className="overflow-x-auto transition-[height] w-full">
      <table className="w-full">
        <thead>
          <tr className="focus:outline-none">
            {tableHeaders.map((component) => {
              return (
                <th key={component.key} className="py-2 px-5">
                  <p className="flex justify-start font-medium text-gray-400 uppercase">
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
  user: UsersByLastName_User;
}

const UserOneRow: FC<IPropsUser> = ({ user }) => {
  const pStyle = 'text-gray-700 font-bold truncate max-w-xs';
  const pStyleSub = 'text-gray-700 truncate font-medium max-w-xs';
  const tdStyple = 'pl-5';
  const enrollmentPStyle = 'text-gray-600 truncate text-sm max-w-xs';

  const { t } = useTranslation();

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
      <tr className="font-medium bg-edu-course-list h-12">
        <td className={tdStyple}>
          <p className={pStyleSub}>{`${t('status')}: ${
            user.employment ? t(user.employment) : "-"
          }`}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyleSub}>{`${t('matriculation-number')}: ${
           user.matriculationNumber ? user.matriculationNumber : "-"
          }`}</p>
        </td>
        <td className={tdStyple}>
          <p className={pStyleSub}>{`${t('university')}: ${
            user.university ? t(user.university) : "-"
          }`}</p>
        </td>
      </tr>
      <tr className="font-medium bg-edu-course-list h-12">
        <td className={tdStyple} colSpan={3}>
          {user.CourseEnrollments.map((enrollment, index) => (
            <p key={index} className={enrollmentPStyle}>
            {enrollment.Course.title} ({enrollment.Course.Program.shortTitle}) - {enrollment.status}
          </p>
          ))}
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
  userListRequest: QueryResult<UsersByLastName, UsersByLastNameVariables>;
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
          {t('paginationText', { currentPage: current_page, totalPage: pages })}
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
