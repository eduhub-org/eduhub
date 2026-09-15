import React, { useState, useCallback, useRef } from 'react';
import { DocumentNode } from 'graphql';
import { gql } from '@apollo/client';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline, CloudUpload } from '@mui/icons-material';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Dialog from '@mui/material/Dialog';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import { prioritizeClasses } from '../../helpers/util';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import Snackbar from '@mui/material/Snackbar';
import { IconButton } from '@mui/material';
import { MdPhotoCamera, MdClose } from 'react-icons/md';
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
  // 'trigger' renders a compact button (for placement next to e.g. a picker) that
  // opens a popover with the same controls, instead of the permanently inlined
  // upload field. Only meaningful for element === 'organizationLogo'.
  layout?: 'inline' | 'trigger';
  // Accessible label for the trigger button; falls back to `label`.
  triggerLabel?: string;
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
  layout = 'inline',
  triggerLabel,
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
  const [triggerAnchorEl, setTriggerAnchorEl] = useState<HTMLElement | null>(null);
  const [isFullSizeOpen, setIsFullSizeOpen] = useState(false);

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

  const renderImageUpload = (
    imageUrl: string | null,
    altText: string,
    tooltipText: string,
    inputId: string,
    size: 'small' | 'large' = 'large',
    borderRadius: 'rounded' | 'rounded-full' = 'rounded-full'
  ) => {
    const sizeClasses = size === 'small' ? 'w-16 h-16' : 'w-40 h-40';
    const containerClasses = size === 'small' ? 'h-16 w-16' : 'h-40 w-80';
    const marginClasses = size === 'small' ? 'mb-2' : 'mb-6';

    return (
      <div className={`${containerClasses} flex items-center ${marginClasses} relative`}>
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={altText}
              className={`${sizeClasses} object-cover ${borderRadius} border border-gray-300`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Tooltip title={tooltipText} placement="top">
              <IconButton
                onClick={handleIconClick}
                className="absolute top-2 left-2 bg-white hover:bg-gray-200 shadow-md transition-colors duration-200"
                size="small"
              >
                <MdPhotoCamera size={size === 'small' ? '1em' : '1.5em'} className="text-gray-800" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                element === 'organizationLogo'
                  ? t('image_uploader.remove_logo')
                  : t('image_uploader.remove_profile_picture')
              }
              placement="top"
            >
              <IconButton
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 bg-white hover:bg-red-100 shadow-md transition-colors duration-200"
                size="small"
                style={{ width: '20px', height: '20px', minWidth: '20px' }}
              >
                <svg width="0.75em" height="0.75em" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </IconButton>
            </Tooltip>
          </div>
        ) : (
          <Tooltip title={tooltipText} placement="top">
            <div
              className={`${sizeClasses} bg-gray-100 border-2 border-dashed border-gray-300 ${borderRadius} flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200`}
              onClick={handleIconClick}
            >
              <MdPhotoCamera size={size === 'small' ? '1.5em' : '2em'} className="text-gray-400" />
            </div>
          </Tooltip>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id={inputId}
        />
      </div>
    );
  };

  const renderProfilePicture = () => {
    const imageUrl = user?.picture ? getPublicUrl(user.picture) : null;
    return renderImageUpload(
      imageUrl,
      'Profile picture',
      t('image_uploader.upload_new_profile_picture'),
      'profile-picture-input',
      'large',
      'rounded-full'
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

  const renderOrganizationLogo = () => (
    <div className="col-span-10 flex mt-3">
      <div className="w-full">
        {label && (
          <div
            className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-standard"
            style={{
              color: 'rgb(34, 34, 34)',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontWeight: 400,
              fontSize: '0.75rem',
              lineHeight: '1.4375em',
              letterSpacing: '0.00938em',
              padding: 0,
              position: 'relative',
              display: 'block',
              transformOrigin: 'top left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              marginBottom: '4px',
            }}
          >
            {label}
          </div>
        )}
        {renderImageUpload(
          currentFile ? getPublicUrl(currentFile) : null,
          'Organization logo',
          t('image_uploader.upload_new_logo'),
          'organization-logo-input',
          'small',
          'rounded'
        )}
        {isUploading && <div className="text-sm text-blue-600 mt-1">{t('image_uploader.uploading')}...</div>}
        {isRemoving && <div className="text-sm text-red-600 mt-1">{t('image_uploader.removing')}...</div>}
        {helpText && (
          <Tooltip title={t(helpText)} placement="top">
            <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled, marginLeft: '8px' }} />
          </Tooltip>
        )}
      </div>
    </div>
  );

  const handleTriggerClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setTriggerAnchorEl(event.currentTarget);
  }, []);

  const handleTriggerClose = useCallback(() => {
    setTriggerAnchorEl(null);
  }, []);

  const handleOpenFullSize = useCallback(() => {
    setIsFullSizeOpen(true);
  }, []);

  const handleCloseFullSize = useCallback(() => {
    setIsFullSizeOpen(false);
  }, []);

  // Compact affordance for placement next to e.g. an organization picker: a small
  // button showing the current logo (or a placeholder) that opens a popover with
  // the same change/remove controls as renderOrganizationLogo, plus a full-size
  // preview. Used by StuJo's organization switcher; the expandable settings row
  // keeps the permanently inlined renderOrganizationLogo above.
  const renderOrganizationLogoTrigger = () => {
    const imageUrl = currentFile ? getPublicUrl(currentFile) : null;
    const accessibleLabel = triggerLabel || label || t('image_uploader.organization_logo');
    const isPopoverOpen = Boolean(triggerAnchorEl);

    return (
      <>
        <Tooltip title={accessibleLabel} placement="bottom">
          <IconButton
            onClick={handleTriggerClick}
            size="small"
            aria-label={accessibleLabel}
            className={prioritizeClasses(className)}
            style={{
              width: 36,
              height: 36,
              border: '1px solid rgba(0,0,0,0.15)',
              padding: imageUrl ? 0 : undefined,
              overflow: 'hidden',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={accessibleLabel}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <MdPhotoCamera size="1.25em" />
            )}
          </IconButton>
        </Tooltip>
        <Popover
          open={isPopoverOpen}
          anchorEl={triggerAnchorEl}
          onClose={handleTriggerClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
              minWidth: 200,
            }}
          >
            {label && <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={accessibleLabel}
                onClick={handleOpenFullSize}
                style={{
                  width: 96,
                  height: 96,
                  objectFit: 'cover',
                  borderRadius: 8,
                  cursor: 'zoom-in',
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.text.disabled,
                }}
              >
                <MdPhotoCamera size="2em" />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button size="small" variant="outlined" onClick={handleIconClick} disabled={isUploading}>
                {imageUrl ? t('image_uploader.change_logo') : t('image_uploader.upload_new_logo')}
              </Button>
              {imageUrl && (
                <Button size="small" variant="outlined" onClick={handleOpenFullSize}>
                  {t('image_uploader.view_full_size')}
                </Button>
              )}
              {imageUrl && (
                <Button size="small" variant="outlined" color="error" onClick={handleRemoveImage} disabled={isRemoving}>
                  {t('image_uploader.remove_logo')}
                </Button>
              )}
            </div>
            {isUploading && <div className="text-sm text-blue-600">{t('image_uploader.uploading')}...</div>}
            {isRemoving && <div className="text-sm text-red-600">{t('image_uploader.removing')}...</div>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="organization-logo-trigger-input"
          />
        </Popover>
        {imageUrl && (
          <Dialog open={isFullSizeOpen} onClose={handleCloseFullSize} maxWidth="md">
            <div style={{ position: 'relative' }}>
              <IconButton
                onClick={handleCloseFullSize}
                aria-label={t('image_uploader.close')}
                size="small"
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.85)' }}
              >
                <MdClose />
              </IconButton>
              <img
                src={imageUrl}
                alt={accessibleLabel}
                style={{ display: 'block', maxWidth: '100%', maxHeight: '80vh' }}
              />
            </div>
          </Dialog>
        )}
      </>
    );
  };

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
          ? layout === 'trigger'
            ? renderOrganizationLogoTrigger()
            : renderOrganizationLogo()
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
