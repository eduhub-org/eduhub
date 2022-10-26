import { FC, useCallback, useReducer, useState } from "react";
import {
  MdAddCircle,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
} from "react-icons/md";
import {
  buildAchievementDocumentationTemplatePath,
  buildAchievementEvaluationScriptTemplatePath,
} from "../../helpers/filehandling";
import { makeFullName } from "../../helpers/util";
import { useAdminMutation } from "../../hooks/authedMutation";
import {
  DELETE_AN_ACHIEVEMENT_OPTION_COURSE,
  DELETE_AN_ACHIEVEMENT_OPTION_MENTOR,
  INSERT_AN_ACHIEVEMENT_OPTION,
  INSERT_AN_ACHIEVEMENT_OPTION_COURSE,
  INSERT_AN_ACHIEVEMENT_OPTION_MENTOR,
  UPDATE_AN_ACHIEVEMENT_OPTION,
} from "../../queries/mutateAchievement";
import { AchievementOptionList_AchievementOption } from "../../queries/__generated__/AchievementOptionList";
import { AdminCourseList_Course } from "../../queries/__generated__/AdminCourseList";
import {
  DeleteAnAchievementOptionCourse,
  DeleteAnAchievementOptionCourseVariables,
} from "../../queries/__generated__/DeleteAnAchievementOptionCourse";
import {
  DeleteAnAchievementOptionMentor,
  DeleteAnAchievementOptionMentorVariables,
} from "../../queries/__generated__/DeleteAnAchievementOptionMentor";
import { ExpertList_Expert } from "../../queries/__generated__/ExpertList";
import {
  InsertAnAchievementOption,
  InsertAnAchievementOptionVariables,
} from "../../queries/__generated__/InsertAnAchievementOption";
import {
  InsertAnAchievementOptionCourse,
  InsertAnAchievementOptionCourseVariables,
} from "../../queries/__generated__/InsertAnAchievementOptionCourse";
import {
  InsertAnAchievementOptionMentor,
  InsertAnAchievementOptionMentorVariables,
} from "../../queries/__generated__/InsertAnAchievementOptionMentor";
import {
  UpdateAnAchievementOption,
  UpdateAnAchievementOptionVariables,
} from "../../queries/__generated__/UpdateAnAchievementOption";
import {
  AchievementOption_set_input,
  AchievementRecordType_enum,
} from "../../__generated__/globalTypes";
import { Button } from "../common/Button";
import ExpertsDialog from "../common/dialogs/ExpertsDialog";
import EhInputWithTitle from "../common/EhInputWithTitle";
import EhSelectForEnum from "../common/EhSelectForEnum";
import TagWithTwoText from "../common/TagWithTwoText";
import { UiFileInputButton } from "../common/UiFileInputButton";
import CourseListDialog from "../courses/CoureListDialog";
import EhTag from "../common/EhTag";
import { UsersWithExpertId_User } from "../../queries/__generated__/UsersWithExpertId";

/* #region Local intefaces */
interface IProps {
  achievementRecordTypes: string[];
  onSuccess: (success: boolean) => void;
  achievementOption?: AchievementOptionList_AchievementOption;
  course?: AdminCourseList_Course;
  userDetails: UsersWithExpertId_User | undefined;
}

interface TempAchievementOptionMentor {
  id: number; // Table ID of AchievementOptionMentor
  expertId: number;
  firstName: string;
  lastName: string;
}
interface TempAchievementOptionCourse {
  id: number; // Table ID of AchievementOptionCourse
  courseId: number;
  title: string;
  programShortName: string;
}
interface IData extends AchievementOption_set_input {
  showMentorDialog: boolean;
  showCourseListDialog: boolean;
  documentationTemplateName: string;
  evaluationScriptName: string;
  experts: TempAchievementOptionMentor[];
  courses: TempAchievementOptionCourse[];
}
/* #endregion */

interface IPayload {
  key: string;
  value: any;
}

const AddEditAchievementOption: FC<IProps> = (props) => {
  const initializeData = () => {
    if (props.achievementOption) {
      const ao = props.achievementOption;
      return {
        id: ao.id,
        title: ao.title,
        description: ao.description,
        documentationTemplateName:
          ao.documentationTemplateUrl.trim().length > 0
            ? ao.documentationTemplateUrl.split("/")[2]
            : "",
        recordType: ao.recordType,
        evaluationScriptName:
          ao.evaluationScriptUrl.trim().length > 0
            ? ao.evaluationScriptUrl.split("/")[2]
            : "",
        evaluationScriptUrl: ao.evaluationScriptUrl,
        showCourseListDialog: false,
        showMentorDialog: false,
        documentationTemplateUrl: ao.documentationTemplateUrl,
        experts: ao.AchievementOptionMentors.map(
          (m) =>
            ({
              id: m.id,
              expertId: m.expertId,
              firstName: m.Expert.User.firstName,
              lastName: m.Expert.User.lastName,
            } as TempAchievementOptionMentor)
        ),
        courses: ao.AchievementOptionCourses.map(
          (c) =>
            ({
              id: c.id,
              courseId: c.courseId,
              programShortName: c.Course.Program
                ? c.Course.Program.shortTitle
                : "",
              title: c.Course.title,
            } as TempAchievementOptionCourse)
        ),
      } as IData;
    }

    return {
      title: "",
      description: "",
      documentationTemplateName: "",
      documentationTemplateUrl: "",
      evaluationScriptName: "",
      evaluationScriptUrl: "",
      showCourseListDialog: false,
      showMentorDialog: false,
      recordType: props.achievementRecordTypes[0],
      experts: props.userDetails
        ? props.userDetails.Experts.length > 0
          ? new Array({
              expertId: props.userDetails.Experts[0].id,
              firstName: props.userDetails.firstName,
              lastName: props.userDetails.lastName,
              id: props.userDetails.Experts[0].id,
            } as TempAchievementOptionMentor)
          : []
        : [],
      courses: props.course
        ? new Array({
            courseId: props.course.id,
            id: props.course.id,
            title: props.course.title,
            programShortName: props.course.Program?.shortTitle,
          })
        : [],
    } as IData;
  };
  const initialState: IData = initializeData();
  const reducer = (state: IData = initialState, payload: IPayload) => {
    return { ...state, [payload.key]: payload.value };
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  /* #region Database Operations */

  const [insertAnAchievement] = useAdminMutation<
    InsertAnAchievementOption,
    InsertAnAchievementOptionVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION);

  const queryInsertANewAchievementOption = useCallback(async () => {
    try {
      const response = await insertAnAchievement({
        variables: {
          data: {
            title: state.title,
            description: state.description,
            /**
             * While inserting now evaluationScriptUrl file will be uploaded. Since this field is mandatory, I have to add this file as empty string.
             * The reason for not uploading the file is we do not have "archiveOptionId" to make the url "<archiveOptionId>/evaluation_script/file-name"
             */
            evaluationScriptUrl: state.evaluationScriptUrl,
            /**
             * While inserting now documentationTemplateUrl file will be uploaded. Since this field is "mandatory", I have to add this file as empty string.
             * The reason for not uploading the file is we do not have "archiveOptionId" to make the url "<archiveOptionId>/documentation_template/file-name"
             */
            documentationTemplateUrl: state.documentationTemplateUrl,
            recordType: state.recordType as AchievementRecordType_enum,
            AchievementOptionCourses: {
              data: state.courses.map((c) => ({ courseId: c.courseId })),
            },
            AchievementOptionMentors: {
              data: state.experts.map((e) => ({ expertId: e.expertId })),
            },
          },
        },
      });

      if (response.errors) {
        console.log("Adding failed!");
        if (props.onSuccess) props.onSuccess(false);
      } else {
        if (props.onSuccess) {
          props.onSuccess(true);
          return true;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return false;
  }, [state, props, insertAnAchievement]);

  const [updateAchievement] = useAdminMutation<
    UpdateAnAchievementOption,
    UpdateAnAchievementOptionVariables
  >(UPDATE_AN_ACHIEVEMENT_OPTION);

  const queryUpdateAchievementOptions = useCallback(
    async (payLoad: IPayload) => {
      try {
        if (state.id) {
          // udpate
          const response = await updateAchievement({
            variables: {
              id: state.id,
              changes: {
                [payLoad.key]: payLoad.value,
              },
            },
          });
          if (response.errors) {
            console.log("Operation Failed");
            if (props.onSuccess) props.onSuccess(false);
          } else {
            if (props.onSuccess) props.onSuccess(true);
            return true;
          }
        }
      } catch (error) {
        console.log(error);
      }
      return false;
    },
    [updateAchievement, state, props]
  );

  const [insertAnAchievementOptionMentor] = useAdminMutation<
    InsertAnAchievementOptionMentor,
    InsertAnAchievementOptionMentorVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION_MENTOR);

  const queryAddAchievementOptionMentors = useCallback(
    async (expertId: number) => {
      if (state.id) {
        try {
          const response = await insertAnAchievementOptionMentor({
            variables: {
              data: {
                achievementOptionId: state.id,
                expertId,
              },
            },
          });
          if (response.errors) {
            console.log("Operation Failed");
            if (props.onSuccess) props.onSuccess(false);
          } else {
            if (props.onSuccess) props.onSuccess(true);
            return response.data &&
              response.data.insert_AchievementOptionMentor_one
              ? response.data.insert_AchievementOptionMentor_one.id
              : -1;
          }
        } catch (error) {
          console.log(error);
        }
      }
      return -1;
    },
    [insertAnAchievementOptionMentor, props, state]
  );

  const [insertIntoAchievementOptionCourses] = useAdminMutation<
    InsertAnAchievementOptionCourse,
    InsertAnAchievementOptionCourseVariables
  >(INSERT_AN_ACHIEVEMENT_OPTION_COURSE);

  const queryAddAchievementOptionCourse = useCallback(
    async (courseId: number) => {
      if (state.id) {
        try {
          const res = await insertIntoAchievementOptionCourses({
            variables: {
              data: {
                achievementOptionId: state.id,
                courseId,
              },
            },
          });
          if (res.errors) {
            console.log("Operation Failed");
            if (props.onSuccess) props.onSuccess(false);
          } else {
            if (props.onSuccess) props.onSuccess(true);
            return res.data && res.data.insert_AchievementOptionCourse_one
              ? res.data.insert_AchievementOptionCourse_one.id
              : -1;
          }
        } catch (error) {
          console.log(error);
        }
      }
      return -1;
    },
    [insertIntoAchievementOptionCourses, state, props]
  );

  const [deleteMentorQuery] = useAdminMutation<
    DeleteAnAchievementOptionMentor,
    DeleteAnAchievementOptionMentorVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_MENTOR);

  const queryDeleteAnAchievementMentorFromDB = useCallback(
    async (pk: number) => {
      if (state.id) {
        try {
          const response = await deleteMentorQuery({
            variables: {
              id: pk,
            },
          });
          if (response.errors) {
            console.log("Operation Failed");
            if (props.onSuccess) props.onSuccess(false);
          } else {
            if (props.onSuccess) props.onSuccess(true);
            return true;
          }
        } catch (error) {
          console.log(error);
        }
      }

      return false;
    },
    [deleteMentorQuery, props, state]
  );

  const [deleteAnAchievementCourse] = useAdminMutation<
    DeleteAnAchievementOptionCourse,
    DeleteAnAchievementOptionCourseVariables
  >(DELETE_AN_ACHIEVEMENT_OPTION_COURSE);

  const queryDeleteAnAchievementCourseFromDB = useCallback(
    async (pk: number) => {
      if (state.id) {
        try {
          const response = await deleteAnAchievementCourse({
            variables: {
              id: pk,
            },
          });
          if (response.errors) {
            console.log("Operation Failed");
            if (props.onSuccess) props.onSuccess(false);
          } else {
            if (props.onSuccess) props.onSuccess(true);
            return true;
          }
        } catch (error) {
          console.log(error);
        }
      }
      return false;
    },
    [deleteAnAchievementCourse, props, state]
  );

  /* #endregion */

  /* #region callbacks */
  const showAddMentorDialog = useCallback(() => {
    dispatch({ key: "showMentorDialog", value: true });
  }, [dispatch]);

  const showAddCourseDialog = useCallback(() => {
    dispatch({ key: "showCourseListDialog", value: true });
  }, [dispatch]);

  const onChangeTitle = useCallback(
    async (value: string) => {
      await queryUpdateAchievementOptions({ key: "title", value });
      dispatch({ key: "title", value });
    },
    [dispatch, queryUpdateAchievementOptions]
  );

  const onChangeDescription = useCallback(
    async (value: string) => {
      await queryUpdateAchievementOptions({ key: "description", value });
      dispatch({ key: "description", value });
    },
    [dispatch, queryUpdateAchievementOptions]
  );

  const checkBoxBottom = useCallback(async (result: ChangeResult) => {
    console.log("Nothing");
  }, []);

  const onRecordTypeChanged = useCallback(
    async (value: string) => {
      await queryUpdateAchievementOptions({
        key: "recordType",
        value,
      });
      dispatch({ key: "recordType", value });
      dispatch({ key: "documentationTemplateName", value: "" });
      dispatch({ key: "documentationTemplateUrl", value: "" });
    },
    [dispatch, queryUpdateAchievementOptions]
  );

  const documentationTamplateUrlUpload = useCallback(
    async (uploadedUnderUrl: string, fileName: string) => {
      await queryUpdateAchievementOptions({
        key: "documentationTemplateUrl",
        value: uploadedUnderUrl,
      });
      dispatch({ key: "documentationTemplateName", value: fileName });
      dispatch({ key: "documentationTemplateUrl", value: uploadedUnderUrl });
    },
    [dispatch, queryUpdateAchievementOptions]
  );

  const documentationTemplateCSVUrlUpload = useCallback(
    async (uploadedUnderUrl: string, fileName: string) => {
      await queryUpdateAchievementOptions({
        key: "documentationTemplateUrl",
        value: uploadedUnderUrl,
      });
      dispatch({ key: "documentationTemplateName", value: fileName });
      dispatch({ key: "documentationTemplateUrl", value: uploadedUnderUrl });
    },
    [dispatch, queryUpdateAchievementOptions]
  );

  const evaluationScriptUrlUpload = useCallback(
    async (uploadedUnderUrl: string, fileName: string) => {
      await queryUpdateAchievementOptions({
        key: "evaluationScriptUrl",
        value: uploadedUnderUrl,
      });
      dispatch({ key: "evaluationScriptName", value: fileName });
      dispatch({ key: "evaluationScriptUrl", value: uploadedUnderUrl });
    },
    [dispatch, queryUpdateAchievementOptions]
  );

  const addAchievementMentorHandler = useCallback(
    async (confirmed: boolean, user: ExpertList_Expert | null) => {
      if (user && !state.experts.find((u) => u.expertId === user.id)) {
        let tempAchievementMentorTableId = user.id;
        // user.id is expertID, since it is from the table Expert
        if (state.id) {
          // We are adding new mentor to already created AchievementOption
          tempAchievementMentorTableId = await queryAddAchievementOptionMentors(
            user.id
          );
        }
        // queryAddAchievementOptionMentors returns -1 if failed
        if (tempAchievementMentorTableId !== -1) {
          const newMentor: TempAchievementOptionMentor = {
            id: tempAchievementMentorTableId,
            expertId: user.id,
            firstName: user.User.firstName,
            lastName: user.User.lastName,
          };
          dispatch({
            key: "experts",
            value: [...state.experts, newMentor],
          });
        }
      }
      dispatch({ key: "showMentorDialog", value: false });
    },
    [dispatch, state, queryAddAchievementOptionMentors]
  );

  const onAddCourseHandler = useCallback(
    async (confirm: boolean, course: AdminCourseList_Course | null) => {
      // course.id is courseID, since it is from the table Course
      if (course && !state.courses.find((c) => c.courseId === course.id)) {
        let tempCourseId = course.id;
        if (state.id) {
          // We are Adding a course to already created AchievementOption
          tempCourseId = await queryAddAchievementOptionCourse(course.id);
        }
        if (tempCourseId !== -1) {
          const newCourse: TempAchievementOptionCourse = {
            id: tempCourseId,
            courseId: course.id,
            programShortName: course.Program?.shortTitle ?? "",
            title: course.title,
          };
          dispatch({
            key: "courses",
            value: [...state.courses, newCourse],
          });
        }
      }
      dispatch({ key: "showCourseListDialog", value: false });
    },
    [dispatch, state, queryAddAchievementOptionCourse]
  );

  const onDeleteAMentor = useCallback(
    async (tableIDOfAchievementOptionMentor: number) => {
      if (
        state.experts.find((u) => u.id === tableIDOfAchievementOptionMentor)
      ) {
        let success = true;
        if (state.id) {
          // We are deleting  a mentor from the database for AchievementOption
          success = await queryDeleteAnAchievementMentorFromDB(
            tableIDOfAchievementOptionMentor
          );
        }

        if (success) {
          // delete from local state
          dispatch({
            key: "experts",
            value: [
              ...state.experts.filter(
                (e) => e.id !== tableIDOfAchievementOptionMentor
              ),
            ],
          });
        }
      }
    },
    [queryDeleteAnAchievementMentorFromDB, state, dispatch]
  );

  const onDeleteACourse = useCallback(
    async (tableIDOfAchievementOptionCourse: number) => {
      if (
        state.courses.find((c) => c.id === tableIDOfAchievementOptionCourse)
      ) {
        let success = true;
        if (state.id) {
          // We are deleting from Database for this AchievementOption
          success = await queryDeleteAnAchievementCourseFromDB(
            tableIDOfAchievementOptionCourse
          );
        }
        if (success) {
          // delete from local state
          dispatch({
            key: "courses",
            value: [
              ...state.courses.filter(
                (c) => c.id !== tableIDOfAchievementOptionCourse
              ),
            ],
          });
        }
      }
    },
    [queryDeleteAnAchievementCourseFromDB, state, dispatch]
  );
  /* #endregion */

  return (
    <>
      {state.showMentorDialog && (
        <ExpertsDialog
          onClose={addAchievementMentorHandler}
          open={state.showMentorDialog}
          title={"Mentoren"}
        />
      )}
      {state.showCourseListDialog && (
        <CourseListDialog
          onClose={onAddCourseHandler}
          open={state.showCourseListDialog}
          title={"Kurse"}
        />
      )}
      <div className="px-5 w-full flex flex-col space-y-5 pb-4">
        <div className="grid gap-5 grid-cols-3">
          <EhInputWithTitle
            label="Title (XXX/200 Zeichen)*"
            placeholder=""
            inputText={state.title ?? ""}
            onChangeHandler={onChangeTitle}
            autoFocus={true}
          />
          <div>
            <div className="flex space-x-2 mt-7 justify-center">
              <div className="grid gap-2">
                {state.experts.map((e, index) => (
                  <EhTag
                    key={`mentors-${index}`}
                    tag={{
                      display: makeFullName(e.firstName, e.lastName),
                      id: e.id,
                    }}
                    requestDeleteTag={onDeleteAMentor}
                  />
                ))}
              </div>
              <div>
                <MdAddCircle
                  className="cursor-pointer inline-block align-middle stroke-cyan-500"
                  onClick={showAddMentorDialog}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex space-x-2 mt-7 justify-center">
              <div>
                <div className="grid grid-cols-1 gap-2">
                  {state.courses.map((course, index) => (
                    <TagWithTwoText
                      key={`course-${index}`}
                      textLeft={course.title}
                      textRight={course.programShortName}
                      onRemoveClick={onDeleteACourse}
                      id={course.id}
                    />
                  ))}
                </div>
              </div>

              <div>
                <MdAddCircle
                  className="cursor-pointer inline-block align-middle stroke-cyan-500"
                  onClick={showAddCourseDialog}
                />
              </div>
            </div>
          </div>
        </div>
        <EhInputWithTitle
          inputText={state.description ?? ""}
          label="Beschreibung (XXX/500 Zeichen)*"
          placeholder=""
          onChangeHandler={onChangeDescription}
        />

        <div className="grid grid-cols-2 gap-5">
          <div className="h-full flex justify-start">
            <div className="flex flex-col space-y-5 justify-between h-full">
              <div className="flex flex-col space-y-1">
                <p>Typ Leistungsnachweis*</p>
                <EhSelectForEnum
                  selected={state.recordType ?? ""}
                  onChange={onRecordTypeChanged}
                  options={props.achievementRecordTypes}
                  bg={"white"}
                />
              </div>
              {!state.id &&
                state.title &&
                state.title.trim().length > 0 &&
                state.description &&
                state.description.trim().length > 0 && (
                  <Button onClick={queryInsertANewAchievementOption}>
                    Save
                  </Button>
                )}
            </div>
          </div>
          <div className="h-full flex justify-end">
            {state.recordType === "DOCUMENTATION" && state.id && (
              <div className="flex flex-row space-x-1 items-center">
                <EhInputWithTitle
                  label="Dokumentationsvorlage(.doc)*"
                  placeholder=".doc"
                  disabled={true}
                  inputText={state.documentationTemplateName}
                />
                <div className="pt-6 pl-1">
                  <UiFileInputButton
                    onUploadComplete={documentationTamplateUrlUpload}
                    label="Dokumentationsvorlage(.doc)*"
                    uploadFileName="template.doc"
                    acceptedFileTypes=".doc"
                    templatePath={buildAchievementDocumentationTemplatePath(
                      state.id
                    )}
                  />
                </div>
              </div>
            )}
            {state.recordType === "DOCUMENTATION_AND_CSV" && state.id && (
              <div className="flex flex-col space-y-5">
                <div className="flex flex-row space-x-1 items-center">
                  <EhInputWithTitle
                    label="Dokumentationsvorlage CSV(.doc)*"
                    placeholder=""
                    disabled={true}
                    inputText={state.documentationTemplateName}
                  />
                  <div className="pt-6 pl-1">
                    <UiFileInputButton
                      onUploadComplete={documentationTemplateCSVUrlUpload}
                      label="Dokumentationsvorlage CSV(.doc)"
                      uploadFileName="template.doc"
                      acceptedFileTypes=".doc"
                      templatePath={buildAchievementDocumentationTemplatePath(
                        state.id
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="flex flex-col space-y-2 justify-start">
                    <div className="flex flex-row space-x-1 items-center">
                      <EhInputWithTitle
                        label="Auswertungsskript(.py)*"
                        placeholder=""
                        disabled={true}
                        inputText={state.evaluationScriptName}
                      />
                      <div className="pt-6 pl-1">
                        <UiFileInputButton
                          onUploadComplete={evaluationScriptUrlUpload}
                          label="Auswertungsskript"
                          uploadFileName="evluation.py"
                          acceptedFileTypes=".py"
                          templatePath={buildAchievementEvaluationScriptTemplatePath(
                            state.id
                          )}
                        />
                      </div>
                    </div>
                    <CheckBox
                      isSelected={true}
                      onChange={checkBoxBottom}
                      text="Autorenspalte anzeigen"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-stela-500">* Mandatory fields</p>
        </div>
      </div>
    </>
  );
};

export default AddEditAchievementOption;

/* #region Checkbox UI */
interface ChangeResult {
  key?: any;
  checked: boolean;
}
interface CheckboxPros {
  isSelected: boolean;
  key?: any;
  text?: string;
  onChange: (result: ChangeResult) => void;
}
const CheckBox: FC<CheckboxPros> = ({ isSelected, key, text, onChange }) => {
  const [checked, setChecked] = useState(isSelected);

  const changeChecked = useCallback(() => {
    onChange({
      key: key ?? undefined,
      checked: !checked,
    });
    setChecked(!checked);
  }, [setChecked, onChange, checked, key]);
  return (
    <div
      className="flex flex-row space-x-1 cursor-pointer"
      onClick={changeChecked}
    >
      {checked === true ? (
        <MdCheckBox size="1.5em" />
      ) : (
        <MdCheckBoxOutlineBlank size="1.5em" />
      )}
      {text && (
        <label className="inline-block text-gray-800 cursor-pointer">
          {text}
        </label>
      )}
    </div>
  );
};

/* #endregion */
