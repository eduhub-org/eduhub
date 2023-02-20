import { IconButton } from '@material-ui/core';
import { FC, MutableRefObject, useCallback, useRef, useState } from 'react';
import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdDelete,
  MdOutlineCheckBoxOutlineBlank,
  MdAddCircle,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdUpload,
} from 'react-icons/md';
import { QueryResult } from '@apollo/client';

import { useAdminMutation } from '../../hooks/authedMutation';
import { SAVE_COURSE_IMAGE } from '../../queries/actions';
import {
  DELETE_A_COURSE,
  UPDATE_COURSE_PROPERTY,
} from '../../queries/mutateCourse';
import {
  DELETE_COURSE_INSRTRUCTOR,
  INSERT_A_COURSEINSTRUCTOR,
} from '../../queries/mutateCourseInstructor';
import { INSERT_EXPERT } from '../../queries/user';
import { AdminCourseList_Course } from '../../queries/__generated__/AdminCourseList';
import {
  DeleteCourseByPk,
  DeleteCourseByPkVariables,
} from '../../queries/__generated__/DeleteCourseByPk';
import {
  DeleteCourseInstructor,
  DeleteCourseInstructorVariables,
} from '../../queries/__generated__/DeleteCourseInstructor';
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from '../../queries/__generated__/InsertCourseInstructor';
import {
  InsertExpert,
  InsertExpertVariables,
} from '../../queries/__generated__/InsertExpert';
import { Programs_Program } from '../../queries/__generated__/Programs';
import {
  SaveCourseImage,
  SaveCourseImageVariables,
} from '../../queries/__generated__/SaveCourseImage';
import {
  UpdateCourseByPk,
  UpdateCourseByPkVariables,
} from '../../queries/__generated__/UpdateCourseByPk';
import { UserForSelection1_User } from '../../queries/__generated__/UserForSelection1';
import { SelectOption } from '../../types/UIComponents';
import {
  CourseEnrollmentStatus_enum,
  CourseStatus_enum,
  Course_set_input,
} from '../../__generated__/globalTypes';
import { SelectUserDialog } from '../common/dialogs/SelectUserDialog';
import EhCheckBox from '../common/EhCheckbox';
import EhSelect from '../common/EhSelect';
import EhTag from '../common/EhTag';
import { parseFileUploadEvent } from '../../helpers/filehandling';
import EhDebounceInput from '../common/EhDebounceInput';

import useTranslation from 'next-translate/useTranslation';
import draftPie from '../../public/images/course/status/draft.svg';
import readyForPublicationPie from '../../public/images/course/status/ready-for-publication.svg';
import readyForApplicationPie from '../../public/images/course/status/ready-for-application.svg';
import applicantsInvitedPie from '../../public/images/course/status/applicants-invited.svg';
import participantsRatedPie from '../../public/images/course/status/participants-rated.svg';
import { CourseList_Course } from 'apps/edu-hub/queries/__generated__/CourseList';

interface IPropsInstructorColumn {
  programs: Programs_Program[];
  course: AdminCourseList_Course;
  t: any;
  qResult: QueryResult<any>;
  refetchCourses: () => void;
}

export const InstructorColumn: FC<IPropsInstructorColumn> = ({
  course,
  refetchCourses,
}) => {
  const [openInstructorDialog, setOpenInstructorDialog] = useState(false);

  /* # region GraphQLAPIs */
  const [insertCourseInstructor] = useAdminMutation<
    InsertCourseInstructor,
    InsertCourseInstructorVariables
  >(INSERT_A_COURSEINSTRUCTOR);

  const [deleteInstructorAPI] = useAdminMutation<
    DeleteCourseInstructor,
    DeleteCourseInstructorVariables
  >(DELETE_COURSE_INSRTRUCTOR);

  const [insertExpertMutation] = useAdminMutation<
    InsertExpert,
    InsertExpertVariables
  >(INSERT_EXPERT);

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
    async (confirmed: boolean, user: UserForSelection1_User | null) => {
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
      if (
        course.CourseInstructors.some((expert) => expert.Expert.id === expertId)
      ) {
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
        />
      )}
    </div>
  );
};
