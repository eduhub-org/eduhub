import { Button } from "@material-ui/core";
import { FC, useCallback, useContext, useReducer, useState } from "react";
import {
  MdAddCircle,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
} from "react-icons/md";
import { UploadFile } from "../../helpers/filehandling";
import { makeFullName } from "../../helpers/util";
import { AchievementContext } from "../../pages/achievements";
import { AdminCourseList_Course } from "../../queries/__generated__/AdminCourseList";
import { ExpertList_Expert } from "../../queries/__generated__/ExpertList";
import { AchievementOption_set_input } from "../../__generated__/globalTypes";
import ExpertsDialog from "../common/dialogs/ExpertsDialog";
import EhInputWithTitle from "../common/EhInputWithTitle";
import EhSelectForEnum from "../common/EhSelectForEnum";
import EhTag from "../common/EhTag";
import TagWithTwoText from "../common/TagWithTwoText";
import { UiFileInputButton } from "../common/UiFileInputButton";
import CourseListDialog from "../courses/CoureListDialog";

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
  experts: TempAchievementOptionMentor[];
  courses: TempAchievementOptionCourse[];
}

interface IPayload {
  key: string;
  value: any;
}

interface IState extends IData {
  showMentorDialog: boolean;
  showCourseListDialog: boolean;
  documentationTemplateName: string;
  evaluationScriptName: string;
}
interface IPropsAddEditAchievementTempData {
  defaultData: IData;
  onSaveCallBack?: (data: IData) => void;
  onPropertyChanged?: (property: IPayload) => Promise<boolean>;
  addAchievementMentorHandler?: (user: ExpertList_Expert) => void;
  onAddCourseHandler?: (course: AdminCourseList_Course) => void;
  onDeleteAMentor?: (tableIDOfAchievementOptionMentor: number) => void;
  onDeleteACourse?: (tableIDOfAchievementOptionCourse: number) => void;
  queryAddAchievementOptionCourse?: (courseId: number) => Promise<number>;
}

const AddEditComponent: FC<IPropsAddEditAchievementTempData> = (props) => {
  const initialState: IState = {
    ...props.defaultData,
    showMentorDialog: false,
    showCourseListDialog: false,
    documentationTemplateName:
      props.defaultData.documentationTemplateUrl &&
      props.defaultData.documentationTemplateUrl?.trim().length > 0
        ? props.defaultData.documentationTemplateUrl.split("/")[2]
        : "",
    evaluationScriptName:
      props.defaultData.documentationTemplateUrl &&
      props.defaultData.evaluationScriptUrl &&
      props.defaultData.evaluationScriptUrl.trim().length > 0
        ? props.defaultData.evaluationScriptUrl.split("/")[2]
        : "",
  };

  const reducer = (state: IState = initialState, payload: IPayload) => {
    return { ...state, [payload.key]: payload.value };
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  /* #region callbacks */
  const showAddMentorDialog = useCallback(() => {
    dispatch({ key: "showMentorDialog", value: true });
  }, [dispatch]);

  const showAddCourseDialog = useCallback(() => {
    dispatch({ key: "showCourseListDialog", value: true });
  }, [dispatch]);

  const onChangeTitle = useCallback(
    async (value: string) => {
      //   await queryUpdateAchievementOptions({ key: "title", value });
      const newPayLoad = { key: "title", value };
      dispatch(newPayLoad);
      if (props.onPropertyChanged) props.onPropertyChanged(newPayLoad);
    },
    [dispatch]
  );

  const onChangeDescription = useCallback(
    async (value: string) => {
      const newPayLoad = { key: "description", value };
      dispatch(newPayLoad);
      if (props.onPropertyChanged) props.onPropertyChanged(newPayLoad);
    },
    [dispatch]
  );

  const checkBoxBottom = useCallback(async (result: ChangeResult) => {
    console.log("Nothing");
  }, []);

  const onRecordTypeChanged = useCallback(
    async (value: string) => {
      const newPayLoad = { key: "recordType", value };
      dispatch({ key: "documentationTemplateName", value: "" });
      dispatch(newPayLoad);
      if (props.onPropertyChanged) await props.onPropertyChanged(newPayLoad);
    },
    [dispatch]
  );

  const onChoosedAchievementOptionDocumentationTemplate = useCallback(
    async (fileUpload: UploadFile | null) => {
      if (fileUpload) {
        dispatch({ key: "documentationTemplateName", value: fileUpload.name });
        if (props.onPropertyChanged)
          props.onPropertyChanged({
            key: "documentTemplateFile",
            value: fileUpload,
          });
      }
    },
    [dispatch, props]
  );

  const onChoosedAchievementOptionDocumentationTemplateForCSV = useCallback(
    async (fileUpload: UploadFile | null) => {
      if (fileUpload) {
        dispatch({ key: "documentationTemplateName", value: fileUpload.name });
        if (props.onPropertyChanged)
          props.onPropertyChanged({
            key: "documentTemplateFileCSV",
            value: fileUpload,
          });
      }
    },
    [dispatch, props]
  );

  const onChoosedEvaluationScriptFile = useCallback(
    async (fileUpload: UploadFile | null) => {
      if (fileUpload) {
        dispatch({ key: "evaluationScriptName", value: fileUpload.name });
        if (props.onPropertyChanged)
          props.onPropertyChanged({
            key: "evalutionScriptFile",
            value: fileUpload,
          });
      }
    },
    [dispatch, props]
  );

  const addAchievementMentorHandler = useCallback(
    async (confirmed: boolean, user: ExpertList_Expert | null) => {
      if (user && !state.experts.find((u) => u.expertId === user.id)) {
        let response = !props.onPropertyChanged
          ? true
          : await props.onPropertyChanged({
              key: "addAMentor",
              value: user.id, // expert ID
            });
        if (response) {
          const newMentor: TempAchievementOptionMentor = {
            id: user.id,
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
    [dispatch, state, props]
  );

  const onAddCourseHandler = useCallback(
    async (confirm: boolean, course: AdminCourseList_Course | null) => {
      // course.id is courseID, since it is from the table Course
      if (course && !state.courses.find((c) => c.courseId === course.id)) {
        let response = !props.onPropertyChanged
          ? true
          : await props.onPropertyChanged({
              key: "addACourse",
              value: course.id,
            });

        if (response) {
          const newCourse: TempAchievementOptionCourse = {
            id: course.id,
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
    [dispatch, state, props]
  );

  const onDeleteAMentor = useCallback(
    async (tableIDOfAchievementOptionMentor: number) => {
      if (
        state.experts.find((u) => u.id === tableIDOfAchievementOptionMentor)
      ) {
        const success = !props.onPropertyChanged
          ? true
          : await props.onPropertyChanged({
              key: "deleteAMentor",
              value: tableIDOfAchievementOptionMentor,
            });
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
    [props, state, dispatch]
  );

  const onDeleteACourse = useCallback(
    async (tableIDOfAchievementOptionCourse: number) => {
      if (
        state.courses.find((c) => c.id === tableIDOfAchievementOptionCourse)
      ) {
        const success = !props.onPropertyChanged
          ? true
          : await props.onPropertyChanged({
              key: "deleteACourse",
              value: tableIDOfAchievementOptionCourse,
            });
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
    [props, state, dispatch]
  );

  const onSaveClick = useCallback(() => {
    if (props.onSaveCallBack) {
      props.onSaveCallBack(state);
    }
  }, [props, state]);

  /* #endregion */

  const context = useContext(AchievementContext);
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
                  options={context.achievementRTypes}
                  bg={"white"}
                />
              </div>
              {!state.id &&
                state.title &&
                state.title.trim().length > 0 &&
                state.description &&
                state.description.trim().length > 0 && (
                  <Button onClick={onSaveClick}>Save</Button>
                )}
            </div>
          </div>
          <div className="h-full flex justify-end">
            {state.recordType === "DOCUMENTATION" && (
              <div className="flex flex-row space-x-1 items-center">
                <EhInputWithTitle
                  label="Dokumentationsvorlage(.doc)*"
                  placeholder=".doc"
                  disabled={true}
                  inputText={state.documentationTemplateName}
                />
                <div className="pt-6 pl-1">
                  <UiFileInputButton
                    label="Dokumentationsvorlage(.doc)*"
                    acceptedFileTypes=".doc"
                    onFileChoosed={
                      onChoosedAchievementOptionDocumentationTemplate
                    }
                  />
                </div>
              </div>
            )}
            {state.recordType === "DOCUMENTATION_AND_CSV" && (
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
                      label="Dokumentationsvorlage CSV(.doc)"
                      acceptedFileTypes=".doc"
                      onFileChoosed={
                        onChoosedAchievementOptionDocumentationTemplateForCSV
                      }
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
                          label="Auswertungsskript"
                          acceptedFileTypes=".py"
                          onFileChoosed={onChoosedEvaluationScriptFile}
                        />
                      </div>
                    </div>
                    <CustomCheckBox
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

export default AddEditComponent;

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
const CustomCheckBox: FC<CheckboxPros> = ({
  isSelected,
  key,
  text,
  onChange,
}) => {
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
