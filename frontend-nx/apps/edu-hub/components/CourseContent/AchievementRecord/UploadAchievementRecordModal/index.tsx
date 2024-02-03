import React, { FC, MouseEvent, useCallback, useReducer, useState, useEffect } from 'react';

import { MdAddCircleOutline } from 'react-icons/md';
import { UploadFile } from '../../../../helpers/filehandling';
import { makeFullName } from '../../../../helpers/util';
import { useAuthedMutation } from '../../../../hooks/authedMutation';
import { INSERT_AN_ACHIEVEMENT_RECORD, UPDATE_AN_ACHIEVEMENT_RECORD } from '../../../../queries/achievementRecord';
import {
  SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE,
  SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION,
} from '../../../../queries/actions';
import {
  InsertAnAchievementRecord,
  InsertAnAchievementRecordVariables,
} from '../../../../queries/__generated__/InsertAnAchievementRecord';
import {
  SaveAchievementRecordCoverImage,
  SaveAchievementRecordCoverImageVariables,
} from '../../../../queries/__generated__/SaveAchievementRecordCoverImage';
import {
  SaveAchievementRecordDocumentation,
  SaveAchievementRecordDocumentationVariables,
} from '../../../../queries/__generated__/SaveAchievementRecordDocumentation';
import {
  UpdateAchievementRecordByPk,
  UpdateAchievementRecordByPkVariables,
} from '../../../../queries/__generated__/UpdateAchievementRecordByPk';
import { AchievementRecordRating_enum, AchievementRecordType_enum } from '../../../../__generated__/globalTypes';
import EhTagStingId from '../../../common/EhTagStingId';
import { AtLeastNameEmail, MinAchievementOption } from '../../../../helpers/achievement';
import useTranslation from 'next-translate/useTranslation';
import { CircularProgress } from '@material-ui/core';
import { Button } from '../../../common/Button';
import EnrolledUserForACourseDialog from '../../../common/dialogs/EnrolledUserForACourseDialog';
import Modal from '../../../common/Modal';
import { User_User_by_pk } from '../../../../queries/__generated__/User';
import { ErrorMessageDialog } from '../../../common/dialogs/ErrorMessageDialog';
import useErrorHandler from '../../../../hooks/useErrorHandler';
import {
  AchievementOptionCourses,
  AchievementOptionCourses_AchievementOptionCourse_AchievementOption,
  AchievementOptionCoursesVariables,
} from '../../../../queries/__generated__/AchievementOptionCourses';
import { QueryResult } from '@apollo/client';
import FileDownload from '../../../common/forms/FileDownload';
import UploadUI from './UploadUI';
import AchievementOptionDropDown from './AchievementOptionDropDown';

interface State {
  achievementRecordTableId: number; // book keeping
  coverImageUrl: UploadFile;
  description: string;
  documentationUrl: UploadFile;
  evaluationScriptUrl: UploadFile;
  csvResults: UploadFile;
  authors: AtLeastNameEmail[];
}

interface Type {
  type: string;
  value: string | AtLeastNameEmail[] | UploadFile;
}

interface IProps {
  // achievementOptionCourse: AchievementOptionCourses_AchievementOptionCourse;
  achievementOptionsQuery: QueryResult<AchievementOptionCourses, AchievementOptionCoursesVariables>;
  onSuccess: () => void;
  userId: string;
  setAlertMessage: (message: string) => void;
  courseTitle: string;
  user: User_User_by_pk;
  courseId: number;
  isOpen: boolean;
  onClose: () => void;
}

const UploadAchievementRecordModal: FC<IProps> = ({
  achievementOptionsQuery,
  onSuccess,
  userId,
  setAlertMessage,
  courseTitle,
  user,
  courseId,
  isOpen,
  onClose,
}) => {
  const { error, handleError, resetError } = useErrorHandler();

  const [visibleAuthorList, setVisibleAuthorList] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const initialState: State = {
    achievementRecordTableId: -1,
    coverImageUrl: null,
    description: null,
    documentationUrl: null,
    evaluationScriptUrl: null,
    csvResults: null,
    authors: [user],
  };

  const { t } = useTranslation();
  const reducer = (state: State = initialState, action: Type) => {
    return { ...state, [action.type]: action.value };
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const [updateAnAchievementRecordAPI] = useAuthedMutation<
    UpdateAchievementRecordByPk,
    UpdateAchievementRecordByPkVariables
  >(UPDATE_AN_ACHIEVEMENT_RECORD, {
    onError: (error) => handleError(t(error.message)),
  });

  const [saveAchievementRecordCoverImage] = useAuthedMutation<
    SaveAchievementRecordCoverImage,
    SaveAchievementRecordCoverImageVariables
  >(SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE, {
    onError: (error) => handleError(t(error.message)),
  });

  const [saveAchievementRecordDocumentation] = useAuthedMutation<
    SaveAchievementRecordDocumentation,
    SaveAchievementRecordDocumentationVariables
  >(SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION, {
    onError: (error) => handleError(t(error.message)),
  });

  const [selectedAchievementOption, setSelectedAchievementOption] =
    useState<AchievementOptionCourses_AchievementOptionCourse_AchievementOption>();
  const [isVisibleAchievementOptions, setAchievementOptionVisibility] = useState(false);
  const [archiveOptionsAnchorElement, setAnchorElement] = useState<HTMLElement>();
  const [achievementOptions, setAchievementOptions] = useState([] as MinAchievementOption[]);

  useEffect(() => {
    const options = [...(achievementOptionsQuery.data?.AchievementOptionCourse || [])];
    setAchievementOptions(options.map((options) => options.AchievementOption));
  }, [achievementOptionsQuery.data?.AchievementOptionCourse]);

  const onAchievementOptionDropdown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      console.log('Dropdown clicked'); // Debug log
      setAnchorElement(event.currentTarget);
      setAchievementOptionVisibility((prevVisibility) => {
        console.log('Visibility before:', prevVisibility); // Debug log
        return !prevVisibility;
      });
    },
    [setAnchorElement]
  );
  const onItemSelectedFromDropdown = useCallback(
    async (item: AchievementOptionCourses_AchievementOptionCourse_AchievementOption) => {
      setSelectedAchievementOption(item);
    },
    [setSelectedAchievementOption]
  );

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
                email: user.email,
              } as AtLeastNameEmail,
            ],
          });
        }
      }
      setVisibleAuthorList(false);
    },
    [setVisibleAuthorList, state, dispatch]
  );

  const onFileChange = useCallback(
    (name: string, file: UploadFile) => {
      dispatch({ type: name, value: file });
    },
    [dispatch]
  );

  const [insertAnAchievementRecordAPI] = useAuthedMutation<
    InsertAnAchievementRecord,
    InsertAnAchievementRecordVariables
  >(INSERT_AN_ACHIEVEMENT_RECORD);

  const save = useCallback(
    async (event) => {
      try {
        setLoading(true);
        event.preventDefault();

        if (!selectedAchievementOption) {
          setAlertMessage(`${t('course-page:achievement_option_not_selected')}`);
          return;
        }
        if (state.authors.length === 0) {
          setAlertMessage(`${t('achievements-page:authors-missing')}`);
          return;
        }

        if (!state.documentationUrl) {
          setAlertMessage(`${t('achievements-page:documentation-missing')}`);
          return;
        }
        const result = await insertAnAchievementRecordAPI({
          variables: {
            insertInput: {
              coverImageUrl: '', // this is mandatory field
              description: state.description ?? '',
              rating: AchievementRecordRating_enum.UNRATED, // this is mandatory field
              score: 0, // because mandatory
              evaluationScriptUrl: null,
              achievementOptionId: selectedAchievementOption?.id,
              csvResults: state.csvResults ? state.csvResults.data : null,
              uploadUserId: userId,
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

        if (!state.documentationUrl) return;
        const uploadResult = await saveAchievementRecordDocumentation({
          variables: {
            achievementRecordId,
            base64File: state.documentationUrl.data,
            fileName: state.documentationUrl.name,
          },
        });
        if (!uploadResult.data?.saveAchievementRecordDocumentation?.file_path) {
          return;
        }
        await updateAnAchievementRecordAPI({
          variables: {
            id: achievementRecordId,
            setInput: {
              documentationUrl: uploadResult.data.saveAchievementRecordDocumentation.file_path,
            },
          },
        });
        onSuccess();
      } finally {
        setLoading(false);
      }
    },
    [
      state.documentationUrl,
      state.coverImageUrl,
      state.csvResults,
      state.description,
      state.authors,
      selectedAchievementOption?.recordType,
      selectedAchievementOption?.evaluationScriptUrl,
      selectedAchievementOption?.id,
      insertAnAchievementRecordAPI,
      userId,
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
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" title={t('course-page:upload_achievement_record')}>
        <div className="flex flex-col space-y-5 w-full pb-5">
          <div onClick={onAchievementOptionDropdown}>
            <Button>{`${t('course-page:choose-achievement-option')} ↓`}</Button>
          </div>

          {selectedAchievementOption && selectedAchievementOption.AchievementOptionTemplate && (
            <div>
              <div className="text-lg mb-6">
                {t('course-page:selected_achievement_option')}:<br></br>
                {selectedAchievementOption.title}
              </div>
              {selectedAchievementOption.AchievementOptionTemplate && (
                <div>
                  <p className="mb-3">{t('course-page:use_documentation_template')}</p>
                  <FileDownload
                    filePath={selectedAchievementOption.AchievementOptionTemplate.url}
                    type="button"
                    className="mb-3 lg:mb-0 lg:mr-3"
                    label={t('course-page:download_template')}
                  />
                </div>
              )}
            </div>
          )}
          <form onSubmit={save} className="flex flex-col space-y-5 mx-10">
            <div className="flex flex-row gap-6">
              <p className="w-2/6">{t('authors')}:</p>
              <div className="w-4/6 flex flex-row">
                <div className="items-center pt-1 pr-3">
                  <MdAddCircleOutline className="cursor-pointer" onClick={makeAuthorListVisible} size="1.4em" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {state.authors.map((user, index) => (
                    <EhTagStingId
                      key={`record-authors-${index}`}
                      requestDeleteTag={requestDeleteTag}
                      id={user.id}
                      title={makeFullName(user.firstName, user.lastName)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-row gap-6">
              <p className="w-2/6">{t('documentation')}:</p>
              <div className="w-4/6">
                <UploadUI
                  onFileSelected={onFileChange}
                  acceptedFileTypes=""
                  placeholder={t('achievements-page:file-name')}
                  name="documentationUrl"
                  id="documentationUrl"
                />
              </div>
            </div>
            <div className="flex justify-center items-center">
              <Button>{isLoading ? <CircularProgress></CircularProgress> : t('upload')}</Button>
            </div>
          </form>
          {isVisibleAchievementOptions && (
            <AchievementOptionDropDown
              anchorElement={archiveOptionsAnchorElement}
              isVisible={isVisibleAchievementOptions}
              setVisible={setAchievementOptionVisibility}
              courseAchievementOptions={achievementOptions}
              callback={onItemSelectedFromDropdown}
            />
          )}
          {visibleAuthorList && (
            <EnrolledUserForACourseDialog
              onClose={onCloseAuthorList}
              open={visibleAuthorList}
              title={t('authors')}
              courseId={courseId}
            />
          )}
        </div>
      </Modal>
      {/* Error Message Dialog */}
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </>
  );
};
export default UploadAchievementRecordModal;
