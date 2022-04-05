import { FC, useCallback, useState } from "react";
import { MdAddCircle } from "react-icons/md";
import { useAdminMutation } from "../../hooks/authedMutation";
import {
  DELETE_COURSE_INSRTRUCTOR,
  INSERT_A_COURSEINSTRUCTOR,
} from "../../queries/mutateCourseInstructor";
import { INSERT_EXPERT } from "../../queries/user";
import { CourseListWithFilter_Course } from "../../queries/__generated__/CourseListWithFilter";
import {
  DeleteCourseInstructor,
  DeleteCourseInstructorVariables,
} from "../../queries/__generated__/DeleteCourseInstructor";
import {
  InsertCourseInstructor,
  InsertCourseInstructorVariables,
} from "../../queries/__generated__/InsertCourseInstructor";
import {
  InsertExpert,
  InsertExpertVariables,
} from "../../queries/__generated__/InsertExpert";
import { UserForSelection1_User } from "../../queries/__generated__/UserForSelection1";
import { SelectUserDialog } from "../common/dialogs/SelectUserDialog";
import EhTagEditTag from "../common/EhTagEditTag";

const makeFullName = (firstName: string, lastName: string) =>
  `${firstName} ${lastName}`;

interface IProps {
  course: CourseListWithFilter_Course;
  refetchData: () => void;
}
const InstructorInARow: FC<IProps> = ({ course, refetchData }) => {
  /* #region */
  const [openInstructorDialog, setOpenInstructorDialog] = useState(false);
  /* #endregion */

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

  const isAlreadExistExpert = (expertId: number) => {
    return course.CourseInstructors.some(
      (expert) => expert.Expert.id === expertId
    );
  };

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
      refetchData();
    },
    [deleteInstructorAPI, refetchData, course]
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
      refetchData();
      setOpenInstructorDialog(false);
    },
    [insertExpertMutation, refetchData, course, insertCourseInstructor]
  );
  /* #endregion */

  /* #endregion */
  return (
    <div className="flex flex-row space-x-1 align-middle">
      {
        // we need to show just one instructore in main ui
        course.CourseInstructors.length > 0 && (
          <EhTagEditTag
            key={`${course.id}-${course.CourseInstructors[0].Expert.id}`}
            requestDeleteTag={deleteInstructorFromACourse}
            tag={{
              display: makeFullName(
                course.CourseInstructors[0].Expert.User.firstName,
                course.CourseInstructors[0].Expert.User.lastName ?? " "
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
      <SelectUserDialog
        onClose={addInstructorHandler}
        open={openInstructorDialog}
        title={"Add Instructor"}
      />
    </div>
  );
};

export default InstructorInARow;
