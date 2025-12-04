import { FC, useCallback, useState } from 'react';
import { MdAddCircle } from 'react-icons/md';
import { QueryResult } from '@apollo/client';

import { useAdminMutation } from '../../../hooks/authedMutation';
import { DELETE_COURSE_INSRTRUCTOR, INSERT_A_COURSEINSTRUCTOR } from '../../../queries/mutateCourseInstructor';
import { INSERT_EXPERT, USER_SELECTION_WITH_FILTER } from '../../../queries/user';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import {
  DeleteCourseInstructor,
  DeleteCourseInstructorVariables,
} from '../../../queries/__generated__/DeleteCourseInstructor';
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from '../../../queries/__generated__/InsertCourseInstructor';
import { InsertExpert, InsertExpertVariables } from '../../../queries/__generated__/InsertExpert';
import { Programs_Program } from '../../../queries/__generated__/Programs';
import { UserSelectionWithFilter_User } from '../../../queries/__generated__/UserSelectionWithFilter';
import {
  UserSelectionWithFilter,
  UserSelectionWithFilterVariables,
} from '../../../queries/__generated__/UserSelectionWithFilter';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import { CreateUserDialog } from '../../common/dialogs/CreateUserDialog';
import EhTag from '../../common/EhTag';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';

import useTranslation from 'next-translate/useTranslation';
import { order_by } from '../../../__generated__/globalTypes';

interface IPropsInstructorColumn {
  programs: Programs_Program[];
  course: AdminCourseList_Course;
  t: any;
  qResult: QueryResult<any>;
  refetchCourses: () => void;
}

export const InstructorColumn: FC<IPropsInstructorColumn> = ({ course, refetchCourses }) => {
  const [openInstructorDialog, setOpenInstructorDialog] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [searchValueForNewUser, setSearchValueForNewUser] = useState('');

  /* # region GraphQLAPIs */
  const [insertCourseInstructor] = useAdminMutation<InsertCourseInstructor, InsertCourseInstructorVariables>(
    INSERT_A_COURSEINSTRUCTOR
  );

  const [deleteInstructorAPI] = useAdminMutation<DeleteCourseInstructor, DeleteCourseInstructorVariables>(
    DELETE_COURSE_INSRTRUCTOR
  );

  const [insertExpertMutation] = useAdminMutation<InsertExpert, InsertExpertVariables>(INSERT_EXPERT);

  const [fetchUserByEmail] = useLazyRoleQuery<UserSelectionWithFilter, UserSelectionWithFilterVariables>(
    USER_SELECTION_WITH_FILTER
  );

  /* # endregion */

  /* #region Callbacks */
  const addInstructorDialogOpener = useCallback(async () => {
    setOpenInstructorDialog(true);
  }, [setOpenInstructorDialog]);

  const deleteInstructorFromACourse = useCallback(
    async (id: number) => {
      const response = await deleteInstructorAPI({
        variables: {
          courseId: course.id,
          expertId: id,
        },
      });

      if (response.errors) {
        console.log(response.errors);
        return;
      }
      refetchCourses();
    },
    [deleteInstructorAPI, refetchCourses, course]
  );

  const addInstructorHandler = useCallback(
    async (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      if (!confirmed || user == null) {
        setOpenInstructorDialog(false);
        return;
      }

      let expertId = -1;
      if (user.Experts.length > 0) {
        expertId = user.Experts[0].id;
      } else {
        const newExpert = await insertExpertMutation({
          variables: {
            userId: user.id,
          },
        });
        if (newExpert.errors) {
          console.log(newExpert.errors);
          setOpenInstructorDialog(false);
          return;
        }
        expertId = newExpert.data?.insert_Expert?.returning[0]?.id || -1;
      }

      if (expertId === -1) {
        setOpenInstructorDialog(false);
        return;
      }
      if (course.CourseInstructors.some((expert) => expert.Expert.id === expertId)) {
        setOpenInstructorDialog(false);
        return;
      }
      const response = await insertCourseInstructor({
        variables: {
          courseId: course.id,
          expertId,
        },
      });
      if (response.errors) {
        console.log(response.errors);
        setOpenInstructorDialog(false);
        return;
      }
      refetchCourses();
      setOpenInstructorDialog(false);
    },
    [insertExpertMutation, refetchCourses, course, insertCourseInstructor]
  );

  const handleAddNewUser = useCallback(
    (searchValue: string) => {
      setSearchValueForNewUser(searchValue);
      setOpenInstructorDialog(false);
      setCreateUserDialogOpen(true);
    },
    []
  );

  const parseSearchValue = useCallback((searchValue: string) => {
    const trimmed = searchValue.trim();
    const parts = trimmed.split(' ');
    if (parts.length >= 2) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
        email: '',
      };
    } else if (trimmed.includes('@')) {
      return {
        firstName: '',
        lastName: '',
        email: trimmed,
      };
    } else {
      return {
        firstName: trimmed,
        lastName: '',
        email: '',
      };
    }
  }, []);

  const handleUserCreated = useCallback(
    async (userId: string, firstName: string, lastName: string, email: string) => {
      setCreateUserDialogOpen(false);

      // Fetch the newly created user to get the full UserSelectionWithFilter_User structure
      try {
        const { data } = await fetchUserByEmail({
          variables: {
            limit: 100,
            filter: {
              _or: [{ id: { _eq: userId } }, { email: { _ilike: `%${email}%` } }],
            },
            order_by: [{ lastName: order_by.asc }, { firstName: order_by.asc }],
          },
        });

        const newUser = data?.User?.find((u) => u.id === userId);
        if (newUser) {
          // Auto-select the new user as instructor
          await addInstructorHandler(true, newUser);
        }
      } catch (error) {
        console.error('Error fetching new user:', error);
      } finally {
        setSearchValueForNewUser('');
      }
    },
    [fetchUserByEmail, addInstructorHandler]
  );

  const parsedSearchValues = parseSearchValue(searchValueForNewUser);
  const { t } = useTranslation('course-page');
  const makeFullName = (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`;
  };

  return (
    <div className="flex flex-row space-x-1 align-middle">
      {
        // we need to show just one instructore in main ui
        course.CourseInstructors.length > 0 && (
          <EhTag
            key={`${course.id}-${course.CourseInstructors[0].Expert.id}`}
            requestDeleteTag={deleteInstructorFromACourse}
            tag={{
              display: makeFullName(
                course.CourseInstructors[0].Expert.User.firstName,
                course.CourseInstructors[0].Expert.User.lastName ?? ' '
              ),
              id: course.CourseInstructors[0].Expert.id,
            }}
          />
        )
      }
      <div className="">
        <MdAddCircle
          className="cursor-pointer inline-block align-middle stroke-cyan-500"
          onClick={addInstructorDialogOpener}
        />
      </div>
      {openInstructorDialog && (
        <SelectUserDialog
          onClose={addInstructorHandler}
          open={openInstructorDialog}
          title={t('add-instructors')}
          onAddNewUser={handleAddNewUser}
          showAddNewUserOption={true}
        />
      )}

      <CreateUserDialog
        open={createUserDialogOpen}
        onClose={() => {
          setCreateUserDialogOpen(false);
          setSearchValueForNewUser('');
        }}
        onSuccess={() => {
          // Refetch handled in handleUserCreated
        }}
        onUserCreated={handleUserCreated}
        initialFirstName={parsedSearchValues.firstName}
        initialLastName={parsedSearchValues.lastName}
        initialEmail={parsedSearchValues.email}
      />
    </div>
  );
};
