import {
  ChangeEvent,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
// import { Button } from '../../common/Button';

import { MdAddCircleOutline } from 'react-icons/md';
import {
  parseFileUploadEvent,
  UploadFile,
} from '../../../helpers/filehandling';
import {
  downloadCSVFileFromBase64String,
  makeFullName,
} from '../../../helpers/util';
import { useAuthedMutation } from '../../../hooks/authedMutation';
import {
  INSERT_AN_ACHIEVEMENT_RECORD,
  UPDATE_AN_ACHIEVEMENT_RECORD,
} from '../../../queries/achievementRecord';
import {
  LOAD_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE,
  SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE,
  SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION,
} from '../../../queries/actions';
import {
  InsertAnAchievementRecord,
  InsertAnAchievementRecordVariables,
} from '../../../queries/__generated__/InsertAnAchievementRecord';
import {
  SaveAchievementRecordCoverImage,
  SaveAchievementRecordCoverImageVariables,
} from '../../../queries/__generated__/SaveAchievementRecordCoverImage';
import {
  SaveAchievementRecordDocumentation,
  SaveAchievementRecordDocumentationVariables,
} from '../../../queries/__generated__/SaveAchievementRecordDocumentation';
import {
  UpdateAchievementRecordByPk,
  UpdateAchievementRecordByPkVariables,
} from '../../../queries/__generated__/UpdateAchievementRecordByPk';
import {
  AchievementRecordRating_enum,
  AchievementRecordType_enum,
} from '../../../__generated__/globalTypes';
import { ContentRow } from '../../common/ContentRow';
import EhTagStingId from '../../common/EhTagStingId';
import { NameId } from '../../../helpers/achievement';
import { useAuthedQuery } from '../../../hooks/authedQuery';
import {
  LoadAchievementOptionDocumentationTemplate,
  LoadAchievementOptionDocumentationTemplateVariables,
} from '../../../queries/__generated__/LoadAchievementOptionDocumentationTemplate';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress, TextareaAutosize, Link } from '@material-ui/core';
import { Button } from '../../common/Button';
import EnrolledUserForACourseDialog, {
  AtLeastNameEmail,
} from '../../common/dialogs/EnrolledUserForACourseDialog';
interface TempUser {
  id: string; // uuid
  firstName: string;
  lastName: string;
}
interface State {
  achievementRecordTableId: number; // book keeping
  coverImageUrl: UploadFile;
  description: string;
  documentationUrl: UploadFile;
  evaluationScriptUrl: UploadFile;
  csvResults: UploadFile;
  authors: TempUser[]; // book keeping
}

interface Type {
  type: string;
  value: string | TempUser[] | UploadFile;
}

interface IProps {
  // achievementOptionCourse: AchievementOptionCourses_AchievementOptionCourse;
  achievementOptionId: number;
  documentationTemplateUrl: string;
  csvTemplateUrl: string;
  title: string;
  recordType: AchievementRecordType_enum;
  onSuccess: () => void;
  userId: string;
  setAlertMessage: (message: string) => void;
  courseTitle: string;
  courseId: number;
}
const FormToUploadAchievementRecord: FC<IProps> = ({
  achievementOptionId,
  documentationTemplateUrl,
  csvTemplateUrl,
  title,
  recordType,
  onSuccess,
  userId,
  setAlertMessage,
  courseTitle,
  courseId,
}) => {
  const [visibleAuthorList, setVisibleAuthorList] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const initialState: State = {
    achievementRecordTableId: -1,
    coverImageUrl: null,
    description: null,
    documentationUrl: null,
    evaluationScriptUrl: null,
    csvResults: null,
    authors: [],
  };

  const { t } = useTranslation();
  const reducer = (state: State = initialState, action: Type) => {
    return { ...state, [action.type]: action.value };
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  // const [scriptGoogleUrl, setScriptGoogleUrl] = useState(null as string);
  const [documentTemplateGoogleLink, setDocumentTemplateGoogleLink] = useState(
    null as string
  );

  /* #region database */

  const docLoadQuery = useAuthedQuery<
    LoadAchievementOptionDocumentationTemplate,
    LoadAchievementOptionDocumentationTemplateVariables
  >(LOAD_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE, {
    variables: { path: documentationTemplateUrl },
    skip:
      !documentationTemplateUrl || documentationTemplateUrl.trim().length === 0,
  });

  useEffect(() => {
    if (
      docLoadQuery &&
      docLoadQuery.data?.loadAchievementOptionDocumentationTemplate?.link
    ) {
      setDocumentTemplateGoogleLink(
        docLoadQuery.data.loadAchievementOptionDocumentationTemplate.link
      );
    }
  }, [docLoadQuery, documentationTemplateUrl]);

  const [updateAnAchievementRecordAPI] = useAuthedMutation<
    UpdateAchievementRecordByPk,
    UpdateAchievementRecordByPkVariables
  >(UPDATE_AN_ACHIEVEMENT_RECORD);

  const [saveAchievementRecordCoverImage] = useAuthedMutation<
    SaveAchievementRecordCoverImage,
    SaveAchievementRecordCoverImageVariables
  >(SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE);

  const [saveAchievementRecordDocumentation] = useAuthedMutation<
    SaveAchievementRecordDocumentation,
    SaveAchievementRecordDocumentationVariables
  >(SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION);
  /* #endregion */

  const requestDeleteTag = useCallback(
    (id: string) => {
      if (state.authors.find((u) => u.id === id)) {
        dispatch({
          type: 'authors',
          value: state.authors.filter((user) => user.id !== id),
        });
      }
    },
    [state, dispatch]
  );

  const makeAuthorListVisible = useCallback(() => {
    setVisibleAuthorList(true);
  }, [setVisibleAuthorList]);

  const onCloseAuthorList = useCallback(
    (close: boolean, user: AtLeastNameEmail | null) => {
      if (user) {
        if (!state.authors.find((u) => u.id === user.id)) {
          dispatch({
            type: 'authors',
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

  const onInputChange = useCallback(
    (event: any) => {
      const { name, value } = event.target;
      dispatch({ type: name, value: value });
    },
    [dispatch]
  );

  const onFileChange = useCallback(
    (name: string, file: UploadFile) => {
      dispatch({ type: name, value: file });
    },
    [dispatch]
  );

  const downloadCSV = useCallback(() => {
    if (csvTemplateUrl) {
      downloadCSVFileFromBase64String(csvTemplateUrl);
    }
  }, [csvTemplateUrl]);

  const [insertAnAchievementRecordAPI] = useAuthedMutation<
    InsertAnAchievementRecord,
    InsertAnAchievementRecordVariables
  >(INSERT_AN_ACHIEVEMENT_RECORD);

  const save = useCallback(
    async (event) => {
      try {
        setLoading(true);
        event.preventDefault();
        const result = await insertAnAchievementRecordAPI({
          variables: {
            insertInput: {
              coverImageUrl: '', // this is mandatory field
              rating: AchievementRecordRating_enum.UNRATED, // this is mandatory field
              score: 0, // because mandatory
              uploadUserId: userId,
              achievementOptionId: achievementOptionId,
              description: state.description ?? '',
              csvResults: state.csvResults ? state.csvResults.data : null,
              AchievementRecordAuthors: {
                data: state.authors.map((a) => ({ userId: a.id })),
              },
            },
          },
        });
        if (result.errors || !result.data?.insert_AchievementRecord_one?.id) {
          setAlertMessage(t('operation-failed'));
          return;
        }

        const achievementRecordId = result.data.insert_AchievementRecord_one.id;
        if (achievementRecordId <= 0) return;

        if (state.coverImageUrl) {
          const saveResult = await saveAchievementRecordCoverImage({
            variables: {
              achievementRecordId,
              base64File: state.coverImageUrl.data,
              fileName: state.coverImageUrl.name,
            },
          });
          if (saveResult.data?.saveAchievementRecordCoverImage?.path) {
            await updateAnAchievementRecordAPI({
              variables: {
                id: achievementRecordId,
                setInput: {
                  coverImageUrl:
                    saveResult.data.saveAchievementRecordCoverImage.path,
                },
              },
            });
          }
        }
        if (!state.documentationUrl) return;
        const uploadResult = await saveAchievementRecordDocumentation({
          variables: {
            achievementRecordId,
            base64File: state.documentationUrl.data,
            fileName: state.documentationUrl.name,
          },
        });
        if (!uploadResult.data?.saveAchievementRecordDocumentation?.path) {
          return;
        }
        await updateAnAchievementRecordAPI({
          variables: {
            id: achievementRecordId,
            setInput: {
              documentationUrl:
                uploadResult.data.saveAchievementRecordDocumentation.path,
            },
          },
        });
      } catch (error) {
        if (setAlertMessage) {
          setAlertMessage(`${t('operation-failed')} ${error.message}`);
        }
        console.log(error);
      } finally {
        setLoading(false);
        onSuccess();
      }
    },
    [
      state.csvResults,
      state.description,
      state.authors,
      state.coverImageUrl,
      state.documentationUrl,
      insertAnAchievementRecordAPI,
      userId,
      achievementOptionId,
      saveAchievementRecordDocumentation,
      updateAnAchievementRecordAPI,
      setAlertMessage,
      t,
      saveAchievementRecordCoverImage,
      onSuccess,
    ]
  );
  return (
    <>
      <div className="flex flex-col space-y-5 w-full pb-5">
        {visibleAuthorList && (
          <EnrolledUserForACourseDialog
            onClose={onCloseAuthorList}
            open={visibleAuthorList}
            title={t('authors')}
            courseId={courseId}
          />
        )}
        <ContentRow
          leftTop={<h1 className="w-1/2">{t('upload-proof')}</h1>}
          rightBottom={<p className="text-right w-1/2">{courseTitle}</p>}
        />

        <form onSubmit={save} className="flex flex-col space-y-5 mx-10">
          <p className="uppercase">{title}</p>
          {recordType === AchievementRecordType_enum.DOCUMENTATION && (
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">{t('cover-picture')}</p>
              <div className="w-4/6">
                <UploadUI
                  nodeBottom={t('form-info-cover-image-size', {
                    width: 520,
                    height: 320,
                  })}
                  onFileSelected={onFileChange}
                  acceptedFileTypes=".png"
                  placeholder={`${t('cover-picture')} (.png)`}
                  name="coverImageUrl"
                  id="coverImageUrl"
                />
              </div>
            </div>
          )}

          <div className="flex flex-row space-x-1">
            <p className="w-2/6">{t('authors')}</p>
            <div className="w-4/6 flex flex-row">
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
            <p className="w-2/6">{t('description')}</p>
            <div className="w-4/6">
              <TextareaAutosize
                className="p-1 h-15 
                bg-transparent
                transition
                ease-in-out
                w-full
                border border-solid border-gray-300
                focus:border-blue-600 focus:outline-none"
                name="description"
                id="description"
                placeholder={t('description')}
                onChange={onInputChange}
                minRows={4}
              ></TextareaAutosize>
            </div>
          </div>

          {recordType === AchievementRecordType_enum.DOCUMENTATION && (
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">{t('documentations')}</p>
              <div className="w-4/6">
                <UploadUI
                  nodeBottom={
                    documentTemplateGoogleLink && (
                      <Trans
                        i18nKey="form-info-documentations"
                        components={[
                          <Link href={documentTemplateGoogleLink} key="info" />,
                        ]}
                        values={{
                          article: 'diese Vorlage',
                        }}
                      ></Trans>
                    )
                  }
                  onFileSelected={onFileChange}
                  acceptedFileTypes=".zip"
                  placeholder=".zip"
                  name="documentationUrl"
                  id="documentationUrl"
                />
              </div>
            </div>
          )}
          {recordType === AchievementRecordType_enum.DOCUMENTATION_AND_CSV && (
            <div className="flex flex-row space-x-1">
              <p className="w-2/6">{t('csv-results')}</p>
              <p></p>
              <div className="w-4/6">
                <UploadUI
                  nodeBottom={
                    csvTemplateUrl && (
                      <Trans
                        i18nKey="form-info-csv-results"
                        components={[<Link onClick={downloadCSV} key="info" />]}
                        values={{
                          article: 'dises Vorlage',
                        }}
                      ></Trans>
                    )
                  }
                  onFileSelected={onFileChange}
                  acceptedFileTypes=".csv"
                  placeholder=".csv"
                  name="csvResults"
                  id="csvResults"
                />
              </div>
            </div>
          )}
          <div className="flex justify-center items-center">
            <Button>
              {isLoading ? <CircularProgress></CircularProgress> : t('upload')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
export default FormToUploadAchievementRecord;
export interface IPropsUpload extends NameId {
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  nodeBottom?: ReactNode;
  placeholder?: string;
  onFileSelected: (fieldName: string, file: UploadFile) => void;
}

const UploadUI: FC<IPropsUpload> = (props) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');

  const onClickHandler = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const onChangeHandler = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const uFile = await parseFileUploadEvent(event);
      setFileName(uFile.name);
      if (uFile) props.onFileSelected(event.target.name, uFile);
    },
    [props, setFileName]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex-col items-right">
        <div
          onClick={onClickHandler}
          className="cursor-pointer flex justify-between border-b border-b-1 border-gray-400 flex flex-row"
        >
          <input
            placeholder={props.placeholder ?? ''}
            type="text"
            disabled
            className="cursor-pointer bg-transparent"
            value={fileName}
          />
          <p>^</p>
        </div>
      </div>
      {props.nodeBottom && (
        <p className="text-right text-xs"> {props.nodeBottom}</p>
      )}

      <input
        accept={props.acceptedFileTypes}
        multiple={props.allowMultipleFiles}
        name={props.name}
        id={props.id}
        onChange={onChangeHandler}
        ref={fileInputRef}
        className="bg-transparent"
        style={{ display: 'none' }}
        type="file"
      />
    </div>
  );
};

UploadUI.defaultProps = {
  acceptedFileTypes: '',
  allowMultipleFiles: false,
};
