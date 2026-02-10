import { FC, useCallback, useState, useMemo } from 'react';
import { MdAddCircle } from 'react-icons/md';
import { ApolloError } from '@apollo/client';

import { useAdminMutation } from '../../../hooks/authedMutation';
import { DELETE_COURSE_INSRTRUCTOR, INSERT_A_COURSEINSTRUCTOR } from '../../../queries/mutateCourseInstructor';
import { USER_SELECTION_WITH_FILTER } from '../../../queries/user';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import {
  DeleteCourseInstructor,
  DeleteCourseInstructorVariables,
} from '../../../queries/__generated__/DeleteCourseInstructor';
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from '../../../queries/__generated__/InsertCourseInstructor';
import {
  UserSelectionWithFilter,
  UserSelectionWithFilterVariables,
  UserSelectionWithFilter_User,
} from '../../../queries/__generated__/UserSelectionWithFilter';
import { SelectUserDialog } from '../../common/dialogs/SelectUserDialog';
import { CreateUserDialog } from '../../common/dialogs/CreateUserDialog';
import EhTagStingId from '../../common/EhTagStingId';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

import { useTranslations } from 'next-intl';
import { order_by } from '../../../__generated__/globalTypes';

interface IPropsInstructorColumn {
  course: AdminCourseList_Course;
  refetchCourses: () => void;
}

export const InstructorColumn: FC<IPropsInstructorColumn> = ({ course, refetchCourses }) => {
  const [openInstructorDialog, setOpenInstructorDialog] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [searchValueForNewUser, setSearchValueForNewUser] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Helper function to extract readable error message from GraphQL errors
  const extractErrorMessage = useCallback((error: unknown): string => {
    // Check if it's an Error instance
    if (error instanceof Error) {
      return error.message;
    }
    // Check if it's an ApolloError
    if (error && typeof error === 'object' && 'graphQLErrors' in error) {
      const apolloError = error as ApolloError;
      if (apolloError.graphQLErrors && apolloError.graphQLErrors.length > 0) {
        return apolloError.graphQLErrors.map((e) => e.message).join(', ');
      }
      if (apolloError.networkError) {
        return apolloError.networkError.message || 'Network error occurred';
      }
      if (apolloError.message) {
        return apolloError.message;
      }
    }
    // Check if it's an array of errors
    if (Array.isArray(error)) {
      return error.map((e) => (e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e))).join(', ');
    }
    return 'An unexpected error occurred';
  }, []);

  // Helper function to show error dialog
  const showError = useCallback((message: string) => {
    console.error('Error:', message);
    setErrorMessage(message);
  }, []);

  // Helper function to show error snackbar
  const showErrorSnackbarMessage = useCallback((message: string) => {
    console.error('Error:', message);
    setSnackbarMessage(message);
    setShowErrorSnackbar(true);
  }, []);

  /* # region GraphQLAPIs */
  const [insertCourseInstructor] = useAdminMutation<InsertCourseInstructor, InsertCourseInstructorVariables>(
    INSERT_A_COURSEINSTRUCTOR,
    {
      onError: (error) => {
        showError(extractErrorMessage(error));
      },
    }
  );

  const [deleteInstructorAPI] = useAdminMutation<DeleteCourseInstructor, DeleteCourseInstructorVariables>(
    DELETE_COURSE_INSRTRUCTOR,
    {
      onError: (error) => {
        showError(extractErrorMessage(error));
      },
    }
  );

  const [fetchUserByEmail] = useLazyRoleQuery<UserSelectionWithFilter, UserSelectionWithFilterVariables>(
    USER_SELECTION_WITH_FILTER
  );

  /* # endregion */

  /* #region Callbacks */
  const addInstructorDialogOpener = useCallback(async () => {
    setOpenInstructorDialog(true);
  }, [setOpenInstructorDialog]);

  const deleteInstructorFromACourse = useCallback(
    async (userId: string) => {
      const response = await deleteInstructorAPI({
        variables: {
          courseId: course.id,
          userId,
        },
      });

      if (response.errors) {
        console.error('Error deleting instructor:', response.errors);
        showError(extractErrorMessage(response.errors));
        return;
      }
      refetchCourses();
    },
    [deleteInstructorAPI, refetchCourses, course, showError, extractErrorMessage]
  );

  const handleDelete = useCallback(
    (id: string) => {
      void deleteInstructorFromACourse(id).catch((err) => {
        console.error('Error deleting instructor:', err);
        showError(extractErrorMessage(err));
      });
    },
    [deleteInstructorFromACourse, showError, extractErrorMessage]
  );

  const addInstructorHandler = useCallback(
    async (confirmed: boolean, user: UserSelectionWithFilter_User | null) => {
      if (!confirmed || user == null) {
        setOpenInstructorDialog(false);
        return;
      }

      // Check if user is already an instructor for this course
      if (course.CourseInstructors.some((instructor) => instructor.User.id === user.id)) {
        setOpenInstructorDialog(false);
        return;
      }

      const response = await insertCourseInstructor({
        variables: {
          courseId: course.id,
          userId: user.id,
        },
      });
      if (response.errors) {
        console.error('Error inserting course instructor:', response.errors);
        showError(extractErrorMessage(response.errors));
        setOpenInstructorDialog(false);
        return;
      }
      refetchCourses();
      setOpenInstructorDialog(false);
    },
    [refetchCourses, course, insertCourseInstructor, showError, extractErrorMessage]
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (userId: string, _firstName: string, _lastName: string, _email: string) => {
      setCreateUserDialogOpen(false);

      // Fetch the newly created user to get the full UserSelectionWithFilter_User structure
      try {
        const { data } = await fetchUserByEmail({
          variables: {
            limit: 1,
            filter: {
              id: { _eq: userId },
            },
            order_by: [{ lastName: order_by.asc }, { firstName: order_by.asc }],
          },
        });

        const newUser = data?.User?.[0];
        if (newUser) {
          // Auto-select the new user as instructor
          await addInstructorHandler(true, newUser);
        }
      } catch (error) {
        console.error('Error fetching new user:', error);
        showErrorSnackbarMessage(extractErrorMessage(error));
      } finally {
        setSearchValueForNewUser('');
      }
    },
    [fetchUserByEmail, addInstructorHandler, showErrorSnackbarMessage, extractErrorMessage]
  );

  const parsedSearchValues = useMemo(
    () => parseSearchValue(searchValueForNewUser),
    [parseSearchValue, searchValueForNewUser]
  );
  const t = useTranslations('coursePage');
  const makeFullName = (firstName: string, lastName: string): string => {
    return `${firstName} ${lastName}`;
  };

  return (
    <div className="flex flex-row space-x-1 align-middle">
      {
        // we need to show just one instructor in main ui
        course.CourseInstructors.length > 0 && (
          <EhTagStingId
            key={`${course.id}-${course.CourseInstructors[0].User.id}`}
            requestDeleteTag={handleDelete}
            title={makeFullName(
              course.CourseInstructors[0].User.firstName,
              course.CourseInstructors[0].User.lastName ?? ' '
            )}
            id={course.CourseInstructors[0].User.id}
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

      <ErrorMessageDialog
        errorMessage={errorMessage || ''}
        open={!!errorMessage}
        onClose={() => setErrorMessage(null)}
      />

      <NotificationSnackbar
        open={showErrorSnackbar}
        onClose={() => setShowErrorSnackbar(false)}
        message={snackbarMessage}
      />
    </div>
  );
};
