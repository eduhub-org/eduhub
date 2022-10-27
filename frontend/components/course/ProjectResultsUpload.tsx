import {
  ChangeEvent,
  FC,
  MouseEvent,
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
  useState,
} from "react";
import { Button } from "../common/Button";
import ModalControl from "../common/ModalController";

import EhDebounceInput from "../common/EhDebounceInput";
import { MdAddCircleOutline, MdTitle } from "react-icons/md";
import EhTag from "../common/EhTag";
import { BlockTitle } from "../common/BlockTitle";
import { ManagedCourse_Course_by_pk } from "../../queries/__generated__/ManagedCourse";
import AchievementOptionDropDown from "../achievements/AchievementOptionDropDown";
import { useAdminQuery } from "../../hooks/authedQuery";
import {
  AchievementOptionCourses,
  AchievementOptionCoursesVariables,
  AchievementOptionCourses_AchievementOptionCourse,
} from "../../queries/__generated__/AchievementOptionCourses";
import { ACHIEVEMENT_OPTION_COURSES } from "../../queries/achievementOptionCourse";
import { ContentRow } from "../common/ContentRow";
import { AchievementRecordType_enum } from "../../__generated__/globalTypes";
import {
  IUserProfile,
  useKeycloakUserProfile,
  useUserId,
} from "../../hooks/user";
import { Fade, Modal } from "@material-ui/core";
import { ModalContent } from "../common/ModalContent";
import { SelectUserDialog } from "../common/dialogs/SelectUserDialog";
import { UserForSelection1_User } from "../../queries/__generated__/UserForSelection1";
import EhTagStingId from "../common/EhTagStingId";
import { makeFullName } from "../../helpers/util";

interface IContext {
  record: AchievementOptionCourses_AchievementOptionCourse;
  course: ManagedCourse_Course_by_pk;
  userId: string | undefined;
  userProfile: IUserProfile | undefined;
}

const ProjectResutlUploadContext = createContext({} as IContext);

interface IProps {
  course: ManagedCourse_Course_by_pk;
}
const ProjectResultsUpload: FC<IProps> = (props) => {
  const userId = useUserId();
  const profile = useKeycloakUserProfile();

  const [showModal, setShowModal] = useState(false);
  const [record, setRecord] = useState(
    {} as AchievementOptionCourses_AchievementOptionCourse
  );

  const close = useCallback(() => {
    setShowModal(false);
  }, [setShowModal]);

  const upload = useCallback(() => {
    setShowModal(true);
  }, [setShowModal]);

  const [
    isVisibleAchievementOptions,
    setAchievementOptionVisibility,
  ] = useState(false);
  const [
    archiveOptionsAnchorElement,
    setAnchorElement,
  ] = useState<HTMLElement>();

  const onAchivementOptionDropdown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      setAnchorElement(event.currentTarget);
      setAchievementOptionVisibility(true);
    },
    [setAnchorElement, setAchievementOptionVisibility]
  );

  const onItemSelectedFromDropdown = useCallback(
    (item: AchievementOptionCourses_AchievementOptionCourse) => {
      setRecord(item);
    },
    [setRecord]
  );
  const achievementOptionCourseRequest = useAdminQuery<
    AchievementOptionCourses,
    AchievementOptionCoursesVariables
  >(ACHIEVEMENT_OPTION_COURSES, {
    variables: {
      where:
        props.course && props.course.id
          ? {
              courseId: { _eq: props.course.id },
            }
          : {},
    },
  });

  const aCourseList = [
    ...(achievementOptionCourseRequest.data?.AchievementOptionCourse || []),
  ];

  const providerValue: IContext = {
    course: props.course,
    record,
    userProfile: profile,
    userId,
  };

  return (
    <ProjectResutlUploadContext.Provider value={providerValue}>
      <div className="flex flex-col space-y-3 itmes-start">
        <BlockTitle>Leistungsnachweis</BlockTitle>
        <span className="text-lg mt-6">
          Den Leistungsnachweis musst Du bis spätestens zum 16.02.2021
          hochgeladen haben.
        </span>
        <div className="flex mt-10 mb-4">
          {!achievementOptionCourseRequest.loading && aCourseList.length > 0 && (
            <div onClick={onAchivementOptionDropdown}>
              <Button>Wähle einen Leistungsnachweis ↓ </Button>
            </div>
          )}

          {isVisibleAchievementOptions && (
            <AchievementOptionDropDown
              anchorElement={archiveOptionsAnchorElement}
              isVisible={isVisibleAchievementOptions}
              setVisible={setAchievementOptionVisibility}
              courseAchievementOptions={aCourseList}
              callback={onItemSelectedFromDropdown}
            />
          )}
        </div>
        {record.id && (
          <div className="flex">
            <Button filled onClick={upload}>
              ↑ Nachweis hochladen
            </Button>
          </div>
        )}
        {record.id && (
          <div>
            <p>
              Der letzte Nachweis mit Dir als Autor wurde am 12.03.2021 um 21.44
              Uhr von Brigitte Mustermann hochgeladen.
            </p>
          </div>
        )}
      </div>
      {showModal && (
        <ModalControl showModal={showModal} onClose={close}>
          <Content />
        </ModalControl>
        // <Modal
        //   open={showModal}
        //   onClose={close}
        //   className="flex justify-center items-center border-none"
        //   disableEnforceFocus
        //   disableBackdropClick={false}
        //   closeAfterTransition
        // >
        //   <Fade in={showModal}>
        //     <ModalContent
        //       closeModal={close}
        //       className="w-full sm:w-auto h-full sm:h-auto sm:m-16 sm:rounded bg-edu-black pb-8"
        //       xIconColor="white"
        //     >
        //       <Content />
        //     </ModalContent>
        //   </Fade>
        // </Modal>
      )}
    </ProjectResutlUploadContext.Provider>
  );
};

export default ProjectResultsUpload;
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
}
interface Type {
  type: string;
  value: any;
}

const Content: FC = () => {
  const context = useContext(ProjectResutlUploadContext);
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

  const uploadTitleBild = useCallback(
    (formData: FormData, name: string) => {
      dispatch({ type: "imageName", value: name });
    },
    [dispatch]
  );

  const uploadDocumentationsZip = useCallback(
    (formData: FormData, name: string) => {
      dispatch({ type: "zipFileName", value: name });
    },
    [dispatch]
  );

  const uploadResultCsv = useCallback(
    (formData: FormData, name: string) => {
      dispatch({ type: "csvFileName", value: name });
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

  const save = useCallback(() => {
    console.log("save");
  }, []);

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
            <p className="">UMSATZVORHERSAGE FÜR EINE BÄCKEREIFILIALE</p>
          </div>
          <div className="flex flex-col space-y-2">
            {context.record.AchievementOption.recordType ===
              AchievementRecordType_enum.DOCUMENTATION && (
              <div className="flex flex-row space-x-1">
                <p className="w-2/6">Titlebild</p>
                <div className="w-4/6">
                  <UploadUI
                    bottomText="Optimal ist eine Größe von XXX x XXX Pixel."
                    onChange={uploadTitleBild}
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
                    onClick={() => setVisibleAuthorList(true)}
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

            {context.record.AchievementOption.recordType ===
              AchievementRecordType_enum.DOCUMENTATION && (
              <div className="flex flex-row space-x-1">
                <p className="w-2/6">Dokumentation</p>
                <div className="w-4/6">
                  <UploadUI
                    bottomText="Benutze diese Vorlage zum Hochladen der Dokumentation!"
                    onChange={uploadDocumentationsZip}
                    uploadFileName={state.zipFileName}
                    acceptedFileTypes=".zip"
                    placeholder=".zip"
                  />
                </div>
              </div>
            )}
            {context.record.AchievementOption.recordType ===
              AchievementRecordType_enum.DOCUMENTATION_AND_CSV && (
              <div className="flex flex-row space-x-1">
                <p className="w-2/6">CSV Ergebnisse</p>
                <div className="w-4/6">
                  <UploadUI
                    bottomText="Benutze diese Vorlage zum Hochladen der CSV-Ergebnisse!"
                    onChange={uploadResultCsv}
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

export interface IPropsUpload {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  bottomText: string;
  onChange: (formData: FormData, fileName: string) => void;
  uploadFileName: string;
  placeholder?: string;
}

const UploadUI: FC<IPropsUpload> = (props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const onChangeHandler = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files?.length) {
        return;
      }

      const formData = new FormData();

      Array.from(event.target.files).forEach((file) => {
        formData.append(event.target.name, file);
      });

      props.onChange(formData, event.target.files[0].name);

      formRef.current?.reset();
    },
    [props, formRef]
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
