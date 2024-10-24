import React, { useState, useCallback, useRef } from 'react';
import { DocumentNode } from 'graphql';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline, CloudUpload } from '@mui/icons-material';
import Button from '@mui/material/Button';
import { useRoleMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';
import { prioritizeClasses } from '../../helpers/util';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import Snackbar from '@mui/material/Snackbar';
import { IconButton } from '@mui/material';
import { MdPhotoCamera } from 'react-icons/md';
import UserCard from '../common/UserCard';
import { SAVE_USER_PROFILE_IMAGE } from '../../queries/actions';
import { useSession } from 'next-auth/react';

type UnifiedFileUploaderProps = {
  variant: 'material' | 'eduhub';
  element?: 'profilePicture' | 'default';
  label?: string;
  identifierVariables: Record<string, any>;
  currentFile: string | null;
  updateFileMutation: DocumentNode;
  onFileUpdated?: (data: any) => void;
  refetchQueries?: string[];
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  className?: string;
  user?: any; // Add user prop for UserCard
};

const UnifiedFileUploader: React.FC<UnifiedFileUploaderProps> = ({
  variant,
  element = 'profilePicture',
  label,
  identifierVariables,
  currentFile,
  updateFileMutation,
  onFileUpdated,
  refetchQueries = [],
  helpText,
  errorText = 'Invalid file',
  translationNamespace,
  acceptedFileTypes = '*',
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  user,
}) => {
  const { t } = useTranslation(translationNamespace);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const theme = useTheme();

  const [updateFile] = useRoleMutation(updateFileMutation, {
    onError: (error) => handleError(t(error.message)),
    onCompleted: (data) => {
      if (onFileUpdated) onFileUpdated(data);
      setShowSavedNotification(true);
    },
    refetchQueries: variant === 'material' ? refetchQueries : undefined,
  });

  const { data: sessionData } = useSession();
  const [saveUserProfileImage] = useRoleMutation(SAVE_USER_PROFILE_IMAGE);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setIsErrorDialogOpen(true);
  }, []);

  const handleCloseErrorDialog = useCallback(() => {
    setIsErrorDialogOpen(false);
    setErrorMessage('');
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        if (selectedFile.size > maxFileSize) {
          handleError(t('file_uploader.file_size_exceeds_limit', { maxFileSize: maxFileSize / 1024 / 1024 }));
          return;
        }

        if (element === 'profilePicture') {
          try {
            const base64File = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(selectedFile);
            });

            const result = await saveUserProfileImage({
              variables: {
                base64File: base64File.split(',')[1],
                fileName: selectedFile.name,
                userId: sessionData?.profile?.sub,
              },
            });

            const userProfileImage = result.data?.saveUserProfileImage?.google_link;
            if (userProfileImage) {
              updateFile({
                variables: {
                  ...identifierVariables,
                  file: result.data?.saveUserProfileImage?.file_path,
                },
              });
            }
          } catch (error) {
            handleError(t('file_uploader.error_uploading_profile_picture'));
          }
        } else {
          updateFile({ variables: { ...identifierVariables, file: selectedFile } });
        }
      }
    },
    [updateFile, identifierVariables, maxFileSize, t, handleError, element, saveUserProfileImage, sessionData]
  );

  const baseClass = 'w-full px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const handleIconClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const renderProfilePicture = () => (
    <div className="h-40 flex items-center mb-6 w-80 relative">
      <UserCard className="flex items-center" key={`userCard`} user={user} size="large" />
      <Tooltip title={t('file_uploader.upload_new_profile_picture')} placement="top">
        <IconButton
          onClick={handleIconClick}
          className="absolute top-2 left-2 bg-white hover:bg-gray-200 shadow-md transition-colors duration-200"
          size="small"
        >
          <MdPhotoCamera size="1.5em" className="text-gray-800" />
        </IconButton>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="profile-picture-input"
      />
    </div>
  );

  const renderDefault = () => (
    <div className={`${finalClassName}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        className="hidden"
        id="file-input-eduhub"
      />
      <label
        htmlFor="file-input-eduhub"
        className="cursor-pointer flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <CloudUpload className="mr-2" />
        {t('file_uploader.upload_file')}
      </label>
    </div>
  );

  const renderEduhub = () => (
    <div className="px-2">
      <div className="text-gray-400">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            {element !== 'profilePicture' && helpText && (
              <Tooltip title={t(helpText)} placement="top">
                <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
              </Tooltip>
            )}
            {element !== 'profilePicture' && label}
          </div>
        </div>
        {element === 'profilePicture' ? renderProfilePicture() : renderDefault()}
      </div>
    </div>
  );

  const renderMaterialUI = () => (
    <div className="col-span-10 flex flex-col mt-3">
      {label && <label className="mb-2">{t(label)}</label>}
      <div className="flex items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input">
          <Button variant="contained" component="span" startIcon={<CloudUpload />} style={{ marginRight: '10px' }}>
            {t('file_uploader.upload_file')}
          </Button>
        </label>
        {helpText && (
          <Tooltip title={t(helpText)} placement="top">
            <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <>
      {variant === 'material' ? renderMaterialUI() : renderEduhub()}
      {isErrorDialogOpen && (
        <AlertMessageDialog alert={errorMessage} open={isErrorDialogOpen} onClose={handleCloseErrorDialog} />
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={showSavedNotification}
        autoHideDuration={2000}
        onClose={() => setShowSavedNotification(false)}
        message={t('Saved')}
      />
    </>
  );
};

export default UnifiedFileUploader;
