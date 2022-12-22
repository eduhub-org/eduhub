import {
  ChangeEvent,
  FC,
  useCallback,
  useContext,
  useReducer,
  useRef,
  useState,
} from "react";
import { Button } from "../../common/Button";

import { MdAddCircleOutline } from "react-icons/md";
import {
  parseFileUploadEvent,
  UploadFile,
} from "../../../helpers/filehandling";
import { makeFullName } from "../../../helpers/util";
import { useAdminMutation } from "../../../hooks/authedMutation";
import {
  INSERT_AN_ACHIEVEMENT_RECORD,
  UPDATE_AN_ACHIEVEMENT_RECORD,
} from "../../../queries/achievementRecord";
import {
  SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE,
  SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION,
} from "../../../queries/actions";
import { AchievementOptionCourses_AchievementOptionCourse } from "../../../queries/__generated__/AchievementOptionCourses";
import {
  InsertAnAchievementRecord,
  InsertAnAchievementRecordVariables,
} from "../../../queries/__generated__/InsertAnAchievementRecord";
import {
  SaveAchievementRecordCoverImage,
  SaveAchievementRecordCoverImageVariables,
} from "../../../queries/__generated__/SaveAchievementRecordCoverImage";
import {
  SaveAchievementRecordDocumentation,
  SaveAchievementRecordDocumentationVariables,
} from "../../../queries/__generated__/SaveAchievementRecordDocumentation";
import {
  UpdateAchievementRecordByPk,
  UpdateAchievementRecordByPkVariables,
} from "../../../queries/__generated__/UpdateAchievementRecordByPk";
import { UserForSelection1_User } from "../../../queries/__generated__/UserForSelection1";
import { AchievementRecordType_enum } from "../../../__generated__/globalTypes";
import { ContentRow } from "../../common/ContentRow";
import { SelectUserDialog } from "../../common/dialogs/SelectUserDialog";
import EhDebounceInput from "../../common/EhDebounceInput";
import EhTagStingId from "../../common/EhTagStingId";
import { ProjectResutlUploadContext } from "./CourseAchievementOption";

interface TempUser {
  id: string; // uuid
  firstName: string;
  lastName: string;
}
interface State {
  achievementRecordTableId: number;
  imageName: string;
  zipFileName: string;
  csvFileName: string;
  description: string;
  authors: TempUser[];
  coverImageFile?: UploadFile;
  documentationZipFile?: UploadFile;
  csvResultFile?: UploadFile;
}

interface Type {
  type: string;
  value: string | TempUser[] | UploadFile;
}

interface IProps {
  achievementOptionCourse: AchievementOptionCourses_AchievementOptionCourse;
}
const ProjectResultsUpload: FC<IProps> = ({ achievementOptionCourse }) => {
  const context = useContext(ProjectResutlUploadContext);
  const achievementOptionId = achievementOptionCourse.achievementOptionId;
  const [visibleAuthorList, setVisibleAuthorList] = useState(false);
  const initialState: State = {
    achievementRecordTableId: -1,
    imageName: "",
    zipFileName: "",
    csvFileName: "",
    description: "",
    authors: [],
  };

  const reducer = (state: State = initialState, action: Type) => {
    return { ...state, [action.type]: action.value };
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  /* #region database */
  const [insertAnAchievementRecordAPI] = useAdminMutation<
    InsertAnAchievementRecord,
    InsertAnAchievementRecordVariables
  >(INSERT_AN_ACHIEVEMENT_RECORD);

  const [udpateAnAchievementRecordAPI] = useAdminMutation<
    UpdateAchievementRecordByPk,
    UpdateAchievementRecordByPkVariables
  >(UPDATE_AN_ACHIEVEMENT_RECORD);

  const [saveAchievementRecordCoverImage] = useAdminMutation<
    SaveAchievementRecordCoverImage,
    SaveAchievementRecordCoverImageVariables
  >(SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE);

  const [saveAchievementRecordDocumentation] = useAdminMutation<
    SaveAchievementRecordDocumentation,
    SaveAchievementRecordDocumentationVariables
  >(SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION);
  /* #endregion */

  const uploadTitleBild = useCallback(
    (file: UploadFile) => {
      dispatch({ type: "imageName", value: file.name });
      dispatch({ type: "coverImageFile", value: file });
    },
    [dispatch]
  );

  const uploadDocumentationsZip = useCallback(
    (file: UploadFile) => {
      dispatch({ type: "zipFileName", value: file.name });
      dispatch({ type: "documentationZipFile", value: file });
    },
    [dispatch]
  );

  const uploadResultCsv = useCallback(
    (file: UploadFile) => {
      dispatch({ type: "csvFileName", value: file.name });
      dispatch({ type: "csvResultFile", value: file });
    },
    [dispatch]
  );

  const requestDeleteTag = useCallback(
    (id: string) => {
      if (state.authors.find((u) => u.id === id)) {
        dispatch({
          type: "authors",
          value: state.authors.filter((user) => user.id !== id),
        });
      }
    },
    [state, dispatch]
  );

  const makeAuthorListVisible = useCallback(() => {
    setVisibleAuthorList(true);
  }, [setVisibleAuthorList]);

  const save = useCallback(async () => {
    console.log("save");
    try {
      const result = await insertAnAchievementRecordAPI({
        variables: {
          insertInput: {
            uploadUserId: context.userId,
            achievementOptionId,
            description: state.description,
            AchievementRecordAuthors: {
              data: state.authors.map((a) => ({ userId: a.id })),
            },
          },
        },
      });
      if (result.errors || !result.data?.insert_AchievementRecord_one?.id) {
        return;
      }

      const achievementRecordId = result.data.insert_AchievementRecord_one.id;
      if (achievementRecordId <= 0) return;
      if (state.csvResultFile) {
        await udpateAnAchievementRecordAPI({
          variables: {
            id: achievementRecordId,
            setInput: {
              csvResults: state.coverImageFile?.data,
            },
          },
        });
      }

      if (state.coverImageFile) {
        const saveResult = await saveAchievementRecordCoverImage({
          variables: {
            achievementRecordId,
            base64File: state.coverImageFile.data,
            fileName: state.coverImageFile.name,
          },
        });
        if (saveResult.data?.saveAchievementRecordCoverImage?.link) {
          await udpateAnAchievementRecordAPI({
            variables: {
              id: achievementRecordId,
              setInput: {
                coverImageUrl:
                  saveResult.data.saveAchievementRecordCoverImage.link,
              },
            },
          });
        }
      }
      if (!state.documentationZipFile) return;
      const uploadResult = await saveAchievementRecordDocumentation({
        variables: {
          achievementRecordId,
          base64File: state.documentationZipFile.data,
          fileName: state.documentationZipFile.name,
        },
      });
      if (!uploadResult.data?.saveAchievementRecordDocumentation?.link) return;
      await udpateAnAchievementRecordAPI({
        variables: {
          id: achievementRecordId,
          setInput: {
            documentationUrl:
              uploadResult.data.saveAchievementRecordDocumentation.link,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }, [
    insertAnAchievementRecordAPI,
    udpateAnAchievementRecordAPI,
    state,
    saveAchievementRecordCoverImage,
    saveAchievementRecordDocumentation,
    achievementOptionId,
    context.userId
  ]);

  const onDescriptionChange = useCallback(
    (value: string) =>
      dispatch({
        type: "description",
        value,
      }),
    [dispatch]
  );

  const onCloseAuthorList = useCallback(
    (close: boolean, user: UserForSelection1_User | null) => {
      if (user) {
        if (!state.authors.find((u) => u.id === user.id)) {
          dispatch({
            type: "authors",
            value: [
              ...state.authors,
              {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
              } as TempUser,
            ],
          });
        }
      }
      setVisibleAuthorList(false);
    },
    [setVisibleAuthorList, state, dispatch]
  );

  return (
    <>
      <div className="flex flex-col space-y-2 w-full pb-5">
        {visibleAuthorList && (
          <SelectUserDialog
            onClose={onCloseAuthorList}
            open={visibleAuthorList}
            title="Autoren"
          />
        )}
        <ContentRow
          leftTop={<h1 className="w-1/2">Nachweis hochladen</h1>}
          rightBottom={
            <p className="text-right w-1/2">{context.course.title}</p>
          }
        />
        <div className="px-8 flex flex-col space-y-5 pt-5">
          <div className="">
            <p className="uppercase">
              {achievementOptionCourse.AchievementOption.title}
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            {achievementOptionCourse.AchievementOption.recordType ===
              AchievementRecordType_enum.DOCUMENTATION && (
                <div className="flex flex-row space-x-1">
                  <p className="w-2/6">Titlebild</p>
                  <div className="w-4/6">
                    <UploadUI
                      bottomText="Optimal ist eine Größe von XXX x XXX Pixel."
                      onFileChoosed={uploadTitleBild}
                      uploadFileName={state.imageName}
                      acceptedFileTypes=".png"
                      placeholder="Cover image (.png)"
                    />
                  </div>
                </div>
              )}

            <div className="flex flex-row space-x-1">
              <p className="w-2/6">Autoren</p>
              <div className="w-4/6 flex felx-row">
                <div className="items-center pt-1 pr-3">
                  <MdAddCircleOutline
                    className="cursor-pointer"
                    onClick={makeAuthorListVisible}
                    size="1.4em"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1">
                  {state.authors.map((user, index) => (
                    <EhTagStingId
                      key={`achievement-authors-${index}`}
                      requestDeleteTag={requestDeleteTag}
                      id={user.id}
                      title={makeFullName(user.firstName, user.lastName)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">Beschreibung</p>
              <div className="w-4/6">
                <EhDebounceInput
                  textArea={true}
                  onChangeHandler={onDescriptionChange}
                  placeholder="Write the description"
                  inputText={state.description}
                />
              </div>
            </div>

            {achievementOptionCourse.AchievementOption.recordType ===
              AchievementRecordType_enum.DOCUMENTATION && (
                <div className="flex flex-row space-x-1">
                  <p className="w-2/6">Dokumentation</p>
                  <div className="w-4/6">
                    <UploadUI
                      bottomText="Benutze diese Vorlage zum Hochladen der Dokumentation!"
                      onFileChoosed={uploadDocumentationsZip}
                      uploadFileName={state.zipFileName}
                      acceptedFileTypes=".zip"
                      placeholder=".zip"
                    />
                  </div>
                </div>
              )}
            {achievementOptionCourse.AchievementOption.recordType ===
              AchievementRecordType_enum.DOCUMENTATION_AND_CSV && (
                <div className="flex flex-row space-x-1">
                  <p className="w-2/6">CSV Ergebnisse</p>
                  <div className="w-4/6">
                    <UploadUI
                      bottomText="Benutze diese Vorlage zum Hochladen der CSV-Ergebnisse!"
                      onFileChoosed={uploadResultCsv}
                      uploadFileName={state.csvFileName}
                      acceptedFileTypes=".csv"
                      placeholder=".csv"
                    />
                  </div>
                </div>
              )}
            <div className="flex justify-center items-center">
              <Button onClick={save} as="button" filled={false}>
                Hochladen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default ProjectResultsUpload;
export interface IPropsUpload {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  bottomText: string;
  uploadFileName: string;
  placeholder?: string;
  onFileChoosed: (file: UploadFile) => void;
}

const UploadUI: FC<IPropsUpload> = (props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const onChangeHandler = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const ufile = await parseFileUploadEvent(event);
      if (ufile) props.onFileChoosed(ufile);
    },
    [props]
  );

  return (
    <form ref={formRef}>
      <div className="flex-col items-right" onClick={onClickHandler}>
        <div className="border-b border-b-1 border-gray-400 flex flex-row cursor-pointer">
          <input
            placeholder={props.placeholder ?? ""}
            type="text"
            className="w-5/6 pr-1 truncate"
            disabled
            value={props.uploadFileName}
          />
          <p className="w-1/6">^</p>
        </div>
        {props.bottomText && (
          <p className="text-right text-xs">{props.bottomText}</p>
        )}
      </div>

      <input
        accept={props.acceptedFileTypes}
        multiple={props.allowMultipleFiles}
        name={props.uploadFileName}
        onChange={onChangeHandler}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />
    </form>
  );
};

UploadUI.defaultProps = {
  acceptedFileTypes: "",
  allowMultipleFiles: false,
};
