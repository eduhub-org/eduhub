import React, { useState, useCallback, useRef } from 'react';
import { DocumentNode } from 'graphql';
import { gql } from '@apollo/client';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline, CloudUpload } from '@mui/icons-material';
import Button from '@mui/material/Button';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import { prioritizeClasses } from '../../helpers/util';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import Snackbar from '@mui/material/Snackbar';
import { IconButton } from '@mui/material';
import { MdPhotoCamera, MdDelete } from 'react-icons/md';
import { SAVE_USER_PROFILE_IMAGE, SAVE_ORGANIZATION_LOGO, REMOVE_ORGANIZATION_LOGO } from '../../queries/actions';
import { useSession } from 'next-auth/react';
import { getPublicUrl } from '../../helpers/filehandling';

// Apollo's useMutation needs a document even when it will never actually be
// called: organizationLogo persists through the save/removeOrganizationLogo
// actions themselves (see their handlers), so callers for that element pass
// no updateFileMutation at all. Keeping the hook call unconditional (rather
// than skipping it) keeps hook order stable across renders.
const NOOP_UPDATE_FILE_MUTATION = gql`
  mutation NoopImageUploaderUpdateFile {
    __typename
  }
`;

// Friendly copy for the messageKeys the organizationLogo actions return.
// Those keys (UNAUTHORIZED, IMAGE_SAVE_ERROR, ...) are not translation paths
// themselves, unlike the profilePicture path's keys below.
const LOGO_ERROR_MESSAGE_KEYS: Record<string, string> = {
  UNAUTHORIZED: 'image_uploader.logo_permission_denied',
  IMAGE_SAVE_ERROR: 'image_uploader.upload_error',
  IMAGE_REMOVE_ERROR: 'image_uploader.remove_image_error',
  INVALID_INPUT: 'image_uploader.upload_error',
};

const resolveLogoErrorMessage = (t: (key: string) => string, messageKey?: string): string =>
  t(LOGO_ERROR_MESSAGE_KEYS[messageKey ?? ''] ?? 'image_uploader.upload_error');

type ImageUploaderProps = {
  variant: 'material' | 'eduhub';
  element?: 'profilePicture' | 'organizationLogo' | 'default';
  label?: string;
  identifierVariables: Record<string, any>;
  currentFile: string | null;
  // Not needed for organizationLogo: the save/removeOrganizationLogo actions
  // persist the column themselves. Still required for profilePicture/default.
  updateFileMutation?: DocumentNode;
  onFileUpdated?: (data: any) => void;
  refetchQueries?: string[];
  helpText?: string;
  errorText?: string;
   acceptedFileTypes?: string;
  maxFileSize?: number;
  className?: string;
  user?: any; // Add user prop for UserCard
};

const ImageUploader: React.FC<ImageUploaderProps> = ({
  variant,
  element = 'profilePicture',
  label,
  identifierVariables,
  currentFile,
  updateFileMutation,
  onFileUpdated,
  refetchQueries = [],
  helpText,
  acceptedFileTypes = '*',
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  className = '',
  user,
}) => {
  const t = useTranslations('common');
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Keyed by the URL that failed rather than a boolean: a replacement upload
  // produces a different URL, so the fallback clears itself.
  const [failedLogoSrc, setFailedLogoSrc] = useState<string | null>(null);

  const theme = useTheme();

  const [updateFile] = useRoleMutation(updateFileMutation ?? NOOP_UPDATE_FILE_MUTATION, {
    onError: (error) => {
      console.error('Update file error:', error);
      handleError(t(error.message));
    },
    onCompleted: (data) => {
      const updatedUser = data?.update_User_by_pk;
      const updatedOrganization = data?.update_Organization_by_pk;

      // Check if the update was successful (either picture/logo was set or explicitly set to null for deletion)
      const hasUserUpdate = updatedUser && 'picture' in updatedUser;
      const hasOrganizationUpdate = updatedOrganization && 'logo' in updatedOrganization;

      if (hasUserUpdate || hasOrganizationUpdate) {
        if (onFileUpdated) onFileUpdated(data);
        setShowSavedNotification(true);
      } else {
        console.error('Update file failed: No picture/logo field in response');
        handleError(t('operation_failed'));
      }
    },
    refetchQueries: variant === 'material' ? refetchQueries : undefined,
  });

  const { data: sessionData } = useSession();
  const [saveUserProfileImage] = useRoleMutation(SAVE_USER_PROFILE_IMAGE);
  const [saveOrganizationLogo] = useRoleMutation(SAVE_ORGANIZATION_LOGO);
  const [removeOrganizationLogo] = useRoleMutation(REMOVE_ORGANIZATION_LOGO);

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
        try {
          setIsUploading(true);
          if (selectedFile.size > maxFileSize) {
            handleError(t('image_uploader.file_size_exceeds_limit', { maxFileSize: maxFileSize / 1024 / 1024 }));
            setIsUploading(false);
            return;
          }

          if (element === 'profilePicture') {
            const base64File = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(selectedFile);
            });

            const saveResult = await saveUserProfileImage({
              variables: {
                base64File: base64File.split(',')[1],
                fileName: selectedFile.name,
                userId: sessionData?.profile?.sub,
              },
            });

            const uploadResult = saveResult.data?.saveUserProfileImage;

            if (uploadResult?.success) {
              await updateFile({
                variables: {
                  ...identifierVariables,
                  file: uploadResult.filePath,
                },
              });
            } else {
              throw new Error(uploadResult?.messageKey || 'IMAGE_SAVE_ERROR');
            }
          } else if (element === 'organizationLogo') {
            const base64File = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(selectedFile);
            });

            const saveResult = await saveOrganizationLogo({
              variables: {
                base64File: base64File.split(',')[1],
                fileName: selectedFile.name,
                organizationId: identifierVariables.organizationId,
              },
            });

            const uploadResult = saveResult.data?.saveOrganizationLogo;

            if (uploadResult?.success) {
              // saveOrganizationLogo persists Organization.logo itself (see its
              // handler): a caller here may only hold the job-offer-only
              // fallback, which has no Hasura update permission to fall back to.
              if (onFileUpdated) onFileUpdated({ logo: uploadResult.filePath });
              setShowSavedNotification(true);
            } else {
              throw new Error(uploadResult?.messageKey || 'IMAGE_SAVE_ERROR');
            }
          } else {
            await updateFile({ variables: { ...identifierVariables, file: selectedFile } });
          }
          setIsUploading(false);
        } catch (error) {
          console.error('File upload error:', error);
          const messageKey = error instanceof Error ? error.message : undefined;
          handleError(
            element === 'organizationLogo'
              ? resolveLogoErrorMessage(t, messageKey)
              : t(messageKey || 'IMAGE_SAVE_ERROR')
          );
          setIsUploading(false);
        }
      }
    },
    [
      updateFile,
      identifierVariables,
      maxFileSize,
      t,
      handleError,
      element,
      saveUserProfileImage,
      saveOrganizationLogo,
      onFileUpdated,
      sessionData,
    ]
  );

  const baseClass = 'w-full px-3 py-3 mb-8 text-label-primary rounded bg-fill-primary';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const handleIconClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleRemoveImage = useCallback(async () => {
    try {
      setIsRemoving(true);

      if (element === 'profilePicture') {
        await updateFile({
          variables: {
            ...identifierVariables,
            file: null,
          },
        });
      } else if (element === 'organizationLogo') {
        // removeOrganizationLogo persists Organization.logo itself, same
        // reason as the save path above.
        const removeResult = await removeOrganizationLogo({
          variables: { organizationId: identifierVariables.organizationId },
        });
        const result = removeResult.data?.removeOrganizationLogo;
        if (!result?.success) {
          throw new Error(result?.messageKey || 'IMAGE_REMOVE_ERROR');
        }
        setShowSavedNotification(true);
      } else {
        await updateFile({
          variables: {
            ...identifierVariables,
            file: null,
          },
        });
      }

      if (onFileUpdated) {
        onFileUpdated(null);
      }
      setIsRemoving(false);
    } catch (error) {
      console.error('Remove image error:', error);
      const messageKey = error instanceof Error ? error.message : undefined;
      handleError(
        element === 'organizationLogo'
          ? resolveLogoErrorMessage(t, messageKey)
          : t('image_uploader.remove_image_error')
      );
      setIsRemoving(false);
    }
  }, [updateFile, removeOrganizationLogo, identifierVariables, element, onFileUpdated, handleError, t]);

  const renderFileInput = (inputId: string) => (
    <input
      ref={fileInputRef}
      type="file"
      accept={acceptedFileTypes}
      onChange={handleFileChange}
      style={{ display: 'none' }}
      id={inputId}
    />
  );

  // Avatar and logo differ on every axis that matters -- box ratio, fit,
  // radius, background, where the controls sit, and what the empty state says
  // -- so they are two helpers rather than one helper branching on a flag.
  const renderAvatarUpload = (imageUrl: string | null, altText: string, tooltipText: string) => (
    <div className="h-40 w-80 flex items-center mb-6 relative">
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={altText}
            className="w-40 h-40 object-cover rounded-full border border-solid border-gray-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <Tooltip title={tooltipText} placement="top">
            <IconButton
              onClick={handleIconClick}
              aria-label={tooltipText}
              className="absolute top-2 left-2 bg-white hover:bg-gray-200 shadow-md transition-colors duration-200"
            >
              <MdPhotoCamera size="1.5em" className="text-gray-800" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('image_uploader.remove_profile_picture')} placement="top">
            <IconButton
              onClick={handleRemoveImage}
              aria-label={t('image_uploader.remove_profile_picture')}
              className="absolute top-1 right-1 bg-white hover:bg-red-100 shadow-md transition-colors duration-200"
              // 44px is the project's minimum touch target; MUI's own
              // size="small" padding would otherwise decide this.
              style={{ width: '44px', height: '44px' }}
            >
              <MdDelete size="1.25em" className="text-red-600" />
            </IconButton>
          </Tooltip>
        </div>
      ) : (
        <Tooltip title={tooltipText} placement="top">
          <div
            className="w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200"
            onClick={handleIconClick}
          >
            <MdPhotoCamera size="2em" className="text-gray-400" />
          </div>
        </Tooltip>
      )}
      {renderFileInput('profile-picture-input')}
    </div>
  );

  const renderProfilePicture = () =>
    renderAvatarUpload(
      user?.picture ? getPublicUrl(user.picture) : null,
      'Profile picture',
      t('image_uploader.upload_new_profile_picture')
    );

  // Same footprint as a rendered logo, so the row never changes height when a
  // logo is added, removed, or fails to load. The whole tile is the target.
  const renderLogoPlaceholder = (labelText: string) => (
    <button
      type="button"
      onClick={handleIconClick}
      className="h-24 w-44 shrink-0 flex flex-col items-center justify-center gap-1 appearance-none cursor-pointer rounded-md border-2 border-dashed border-gray-300 bg-gray-50 p-2 font-body text-xs text-label-secondary hover:bg-gray-100"
    >
      <MdPhotoCamera size="1.5em" aria-hidden="true" />
      <span>{labelText}</span>
    </button>
  );

  const renderLogoPreview = () => {
    const logoUrl = currentFile ? getPublicUrl(currentFile) : null;
    const canRenderLogo = Boolean(logoUrl) && failedLogoSrc !== logoUrl;

    return (
      <div className="flex items-center gap-2">
        {canRenderLogo ? (
          <div className="h-24 w-44 shrink-0 flex items-center justify-center rounded-md border border-solid border-gray-300 bg-white p-2">
            <img
              src={logoUrl as string}
              alt={t('image_uploader.organization_logo')}
              // contain, never cover: a wordmark is landscape and must stay
              // whole, matching how the same logo renders on a job advert.
              // max-*-full and block are explicit because StuJo switches
              // Tailwind's preflight off, so `img` keeps the UA defaults.
              className="block max-h-full max-w-full object-contain"
              onError={() => setFailedLogoSrc(logoUrl)}
            />
          </div>
        ) : (
          renderLogoPlaceholder(
            currentFile ? t('image_uploader.logo_unavailable') : t('image_uploader.add_logo')
          )
        )}

        {/* Gated on the stored value, not on the rendered one: a logo that
            cannot be displayed must still be removable. */}
        {currentFile && (
          <div className="flex items-center gap-1">
            <Tooltip title={t('image_uploader.change_logo')} placement="top">
              <IconButton
                onClick={handleIconClick}
                aria-label={t('image_uploader.change_logo')}
                style={{ width: '44px', height: '44px' }}
              >
                <MdPhotoCamera size="1.25em" className="text-gray-800" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('image_uploader.remove_logo')} placement="top">
              <IconButton
                onClick={handleRemoveImage}
                disabled={isRemoving}
                aria-label={t('image_uploader.remove_logo')}
                style={{ width: '44px', height: '44px', color: 'var(--eduhub-error)' }}
              >
                <MdDelete size="1.25em" />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>
    );
  };

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
        {t('image_uploader.upload_file')}
      </label>
    </div>
  );

  const renderEduhub = () => (
    <div className="px-2">
      <div className="text-label-primary">
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
        <div className="light">
          {element === 'profilePicture' ? renderProfilePicture() : renderDefault()}
        </div>
      </div>
    </div>
  );

  // items-start rather than a full-width block: StuJo renders this inline in a
  // flex row next to the organization name, where w-full would stretch it.
  const renderOrganizationLogo = () => (
    <div className="flex flex-col items-start gap-2">
      {(label || helpText) && (
        <div className="flex items-center gap-2 font-body text-xs text-label-secondary">
          {label && <span>{label}</span>}
          {helpText && (
            <Tooltip title={t(helpText)} placement="top">
              <HelpOutline style={{ cursor: 'pointer', fontSize: '1rem', color: theme.palette.text.disabled }} />
            </Tooltip>
          )}
        </div>
      )}
      {renderLogoPreview()}
      {isUploading && <p className="m-0 text-xs text-label-secondary">{t('image_uploader.uploading')}</p>}
      {isRemoving && <p className="m-0 text-xs text-label-secondary">{t('image_uploader.removing')}</p>}
      {renderFileInput('organization-logo-input')}
    </div>
  );

  const renderMaterialUI = () => (
    <div className="col-span-10 flex flex-col mt-3">
      {label && <label className="mb-2">{label}</label>}
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
            {t('image_uploader.upload_file')}
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
      {variant === 'material'
        ? element === 'organizationLogo'
          ? renderOrganizationLogo()
          : renderMaterialUI()
        : renderEduhub()}
      {isErrorDialogOpen && (
        <AlertMessageDialog alert={errorMessage} open={isErrorDialogOpen} onClose={handleCloseErrorDialog} />
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={showSavedNotification}
        autoHideDuration={2000}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
      />
    </>
  );
};

export default ImageUploader;
