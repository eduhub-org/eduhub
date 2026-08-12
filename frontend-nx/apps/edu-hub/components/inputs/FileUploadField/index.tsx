import { FC, ReactNode, useCallback, useMemo, useState, useId, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MdUpload, MdDownload, MdCloudUpload, MdDelete, MdInfoOutline } from 'react-icons/md';
import { CircularProgress, IconButton, Tooltip, LinearProgress } from '@mui/material';
import { useFlexibleMutation } from '../../../hooks/authedMutation';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { getPublicImageUrl, parseFileUploadEvent, getPublicUrl, UploadFile } from '../../../helpers/filehandling';
import { GET_SIGNED_URL } from '../../../queries/actions';
import { GetSignedUrl, GetSignedUrlVariables } from '../../../queries/__generated__/GetSignedUrl';
import {
  detectFileType,
  getFilename,
  formatAcceptedTypes,
  formatMaxSize,
  getFileIcon,
  validateFileType,
} from './utils';
import { FileUploadFieldProps } from './types';
import { useTranslations } from 'next-intl';

export const FileUploadField: FC<FileUploadFieldProps> = ({
  currentFileUrl,
  uploadMutation,
  updateMutation,
  removeMutation,
  identifierVariables,
  uploadIdentifierVariables,
  updateFieldName = 'templatePath',
  useChangesObject = false,
  acceptedFileTypes = '*',
  acceptedTypesDisplay,
  maxFileSize,
  uploadText,
  altText = 'File preview',
  imageWidth = 160,
  imageHeight = 96,
  showFileName = false,
  refetchQueries = [],
  onUploadSuccess,
  onUploadError,
  className = '',
  mutationPreset = 'admin',
  density = 'default',
  layout = 'default',
  infoTooltip,
}) => {
  const t = useTranslations('common');
  const isStackedLayout = layout === 'stacked';
  const isCompact = density === 'compact' || isStackedLayout;
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const [getFileSignedUrl, { data: signedUrlData }] =
    useLazyRoleQuery<GetSignedUrl, GetSignedUrlVariables>(GET_SIGNED_URL, {
      fetchPolicy: 'network-only',
    });

  // Always auto-detect file type from URL
  // This ensures the component always shows the correct icon/preview for the actual file
  const detectedType = useMemo(() => detectFileType(currentFileUrl), [currentFileUrl]);

  // Fetch signed URL for private files (e.g. certificate templates) when displaying image preview
  const isPrivateFile = currentFileUrl && !getPublicUrl(currentFileUrl);
  const needsSignedUrlForDisplay = detectedType === 'image' && !!isPrivateFile;
  useEffect(() => {
    if (needsSignedUrlForDisplay && currentFileUrl) {
      getFileSignedUrl({ variables: { path: currentFileUrl } });
    }
  }, [currentFileUrl, needsSignedUrlForDisplay, getFileSignedUrl]);

  // Get file icon info for non-image files
  const fileIconInfo = useMemo(() => {
    if (detectedType === 'image') return null;
    return getFileIcon(detectedType);
  }, [detectedType]);

  // Get display URL for images
  // For certificate templates (private GCS files), use signed URL from useLazyRoleQuery
  const displayUrl = useMemo(() => {
    // Only try to get image URL if the file is actually an image
    if (detectedType === 'image' && currentFileUrl) {
      // First try accessUrl if available (from recent upload)
      if (accessUrl) {
        return accessUrl;
      }

      // Try resized public image URL
      const resizedUrl = getPublicImageUrl(currentFileUrl, 460);
      if (resizedUrl) {
        return resizedUrl;
      }

      // Try direct public URL
      const publicUrl = getPublicUrl(currentFileUrl);
      if (publicUrl) {
        return publicUrl;
      }

      // For private files (e.g. certificate templates), use authenticated signed URL
      if (signedUrlData?.getSignedUrl?.link) {
        return signedUrlData.getSignedUrl.link;
      }
    }
    return null;
  }, [currentFileUrl, detectedType, accessUrl, signedUrlData]);

  // Mutations (admin manage course vs. participant project cover)
  const [upload] = useFlexibleMutation(uploadMutation, mutationPreset, {
    refetchQueries,
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error.message || t('file_upload.upload_error');
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    },
  });

  const [update] = useFlexibleMutation(updateMutation, mutationPreset, {
    refetchQueries,
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error.message || t('file_upload.upload_error');
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    },
  });

  const [remove] = useFlexibleMutation(removeMutation ?? updateMutation, mutationPreset, {
    refetchQueries,
    onError: (error) => {
      const errorMessage = error.message || t('file_upload.upload_error');
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    },
  });

  // Process file upload. The server currently validates size, but not file type.
  const processFileUpload = useCallback(
    async (file: UploadFile, fileType?: string) => {
      if (!file) return;

      // Set default max file size to 10MB if not specified
      const effectiveMaxFileSize = maxFileSize ?? 10 * 1024 * 1024;

      // Validate file size
      if (file.size > effectiveMaxFileSize) {
        const maxSizeMB = (effectiveMaxFileSize / 1024 / 1024).toFixed(2);
        const errorMessage = t('file_upload.file_too_large', { maxSize: maxSizeMB });
        setIsUploading(false);
        setUploadProgress(0);
        if (onUploadError) {
          onUploadError(errorMessage);
        }
        return;
      }

      // Validate picker and drag-and-drop files through the same path. Browsers
      // may report an empty MIME type, so filename extensions are checked too.
      if (!validateFileType(file.name, fileType, acceptedFileTypes)) {
        const acceptedTypesText = formatAcceptedTypes(acceptedFileTypes);
        const errorMessage = t('file_upload.invalid_file_type', { types: acceptedTypesText });
        setIsUploading(false);
        setUploadProgress(0);
        if (onUploadError) {
          onUploadError(errorMessage);
        }
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Upload file - use uploadIdentifierVariables if provided, otherwise fall back to identifierVariables
        const uploadVars = uploadIdentifierVariables || identifierVariables;
        setUploadProgress(30);
        const uploadResult = await upload({
          variables: {
            base64File: file.data,
            fileName: file.name,
            ...uploadVars,
          },
        });

        setUploadProgress(70);

        // Extract upload response - handle different mutation response structures
        const uploadData =
          uploadResult.data?.saveCourseImage ||
          uploadResult.data?.saveProjectImage ||
          uploadResult.data?.saveProjectDocumentation ||
          uploadResult.data?.saveProjectPresentation ||
          uploadResult.data?.saveAttendanceCertificateTemplate ||
          uploadResult.data?.saveAchievementCertificateTemplate ||
          uploadResult.data?.[Object.keys(uploadResult.data || {})[0]];

        if (uploadData?.success && uploadData?.filePath) {
          // Store accessUrl if available (for certificate templates and other private files)
          if (uploadData.accessUrl) {
            setAccessUrl(uploadData.accessUrl);
          }
          
          // Build update variables based on pattern
          let updateVariables: Record<string, any>;

          if (useChangesObject) {
            // Pattern for UPDATE_COURSE_PROPERTY: { id, changes: { coverImage: filePath } }
            updateVariables = {
              ...identifierVariables,
              changes: {
                [updateFieldName]: uploadData.filePath,
              },
            };
          } else {
            // Pattern for certificate templates: { programId, templatePath: filePath }
            updateVariables = {
              ...identifierVariables,
              [updateFieldName]: uploadData.filePath,
            };
          }

          // Update record with file path
          await update({
            variables: updateVariables,
          });

          setUploadProgress(100);
          setIsUploading(false);
          if (onUploadSuccess) {
            onUploadSuccess(uploadData.filePath);
          }
        } else {
          setIsUploading(false);
          setUploadProgress(0);
          const errorMessage = uploadData?.messageKey || uploadData?.error || t('file_upload.upload_error');
          if (onUploadError) {
            onUploadError(errorMessage);
          }
        }
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : t('file_upload.upload_error');
        if (onUploadError) {
          onUploadError(errorMessage);
        }
      }
    },
    [
      upload,
      update,
      identifierVariables,
      uploadIdentifierVariables,
      updateFieldName,
      useChangesObject,
      maxFileSize,
      acceptedFileTypes,
      onUploadSuccess,
      onUploadError,
      t,
    ]
  );

  // Handlers
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = await parseFileUploadEvent(event);
      if (!file) return;
      // Get the original File object to access its type property
      const originalFile = event.target.files?.[0];
      await processFileUpload(file, originalFile?.type);
    },
    [processFileUpload]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];

        // Create a mock event object for parseFileUploadEvent
        const mockEvent = {
          target: {
            files: [droppedFile],
          },
        } as any;
        const parsedFile = await parseFileUploadEvent(mockEvent);
        if (parsedFile) {
          await processFileUpload(parsedFile, droppedFile.type);
        }
      }
    },
    [processFileUpload]
  );

  const handleDownloadClick = useCallback(async () => {
    if (!currentFileUrl) return;

    // Try accessUrl first (for recently uploaded certificate templates)
    if (accessUrl) {
      window.open(accessUrl, '_blank');
      return;
    }

    // Try public URL
    const downloadUrl = getPublicUrl(currentFileUrl);
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return;
    }

    // For private files (e.g. certificate templates), fetch authenticated signed URL
    try {
      const result = await getFileSignedUrl({ variables: { path: currentFileUrl } });
      const signedUrl = result.data?.getSignedUrl?.link;
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to get signed URL for download:', error);
      if (onUploadError) {
        onUploadError(t('file_upload.upload_error'));
      }
    }
  }, [currentFileUrl, accessUrl, getFileSignedUrl, onUploadError, t]);

  const handleRemoveClick = useCallback(async () => {
    if (!currentFileUrl) return;

    try {
      // Build remove variables - set file path to null
      let removeVariables: Record<string, any>;

      if (useChangesObject) {
        removeVariables = {
          ...identifierVariables,
          changes: {
            [updateFieldName]: null,
          },
        };
      } else {
        removeVariables = {
          ...identifierVariables,
          [updateFieldName]: null,
        };
      }

      await remove({
        variables: removeVariables,
      });

      if (onUploadSuccess) {
        onUploadSuccess('');
      }
    } catch (error) {
      console.error('Remove error:', error);
      const errorMessage = error instanceof Error ? error.message : t('file_upload.upload_error');
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [remove, identifierVariables, updateFieldName, useChangesObject, currentFileUrl, onUploadSuccess, onUploadError, t]);

  const handleClick = useCallback(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
        e.preventDefault();
        handleClick();
      }
    },
    [isUploading, handleClick]
  );

  const filename = useMemo(() => getFilename(currentFileUrl), [currentFileUrl]);

  // Reset accessUrl when currentFileUrl changes to a different value
  // This ensures we use the stored accessUrl only for recently uploaded files
  // and clears stale accessUrl when the component receives updated props
  const previousFileUrlRef = useRef<string | null>(currentFileUrl);
  useEffect(() => {
    // Clear accessUrl if currentFileUrl changed to a different value (not just falsy)
    if (previousFileUrlRef.current !== currentFileUrl) {
      setAccessUrl(null);
      previousFileUrlRef.current = currentFileUrl;
    }
  }, [currentFileUrl]);

  // Format accepted types and max size for display
  const acceptedTypesText = useMemo(
    () => acceptedTypesDisplay ?? formatAcceptedTypes(acceptedFileTypes),
    [acceptedTypesDisplay, acceptedFileTypes]
  );
  const maxSizeText = useMemo(() => formatMaxSize(maxFileSize), [maxFileSize]);

  // Determine container classes based on state
  const containerClasses = useMemo(() => {
    const densityPad = isCompact ? 'p-2' : 'p-4';
    const densityRadius = isCompact ? 'rounded-md' : 'rounded-lg';
    const densityBorder = isCompact ? 'border' : 'border-2';
    const baseClasses = `${densityBorder} ${densityRadius} ${densityPad} transition-all duration-200`;
    let stateClasses = 'border-dashed border-gray-300 bg-gray-50';

    if (isDragging) {
      stateClasses = 'border-solid border-blue-500 bg-blue-50';
    } else if (isHovering && !currentFileUrl) {
      stateClasses = 'border-dashed border-gray-400 bg-gray-100';
    } else if (currentFileUrl && !isUploading) {
      stateClasses = 'border-solid border-gray-300 bg-white';
    }

    const infoInset = infoTooltip ? (isCompact ? ' pr-9' : ' pr-11') : '';
    return `${baseClasses} ${stateClasses} ${infoInset} ${className}`;
  }, [isCompact, infoTooltip, isDragging, isHovering, currentFileUrl, isUploading, className]);

  const fileIconBoxPx = isCompact ? 52 : 96;

  const showRestrictionLine =
    !infoTooltip && (acceptedTypesText !== 'All file types' || maxSizeText);

  const renderActionButtons = (vertical: boolean, inlineBesideMeta = false) => (
    <div
      className={
        vertical
          ? 'flex flex-col gap-0.5 shrink-0 justify-center'
          : inlineBesideMeta
            ? 'flex shrink-0 flex-wrap items-center justify-center gap-0.5 sm:justify-end'
            : `flex flex-wrap gap-2 ${isCompact ? 'mt-1' : 'mt-2'}`
      }
    >
      <Tooltip title={t('file_upload.replace')} placement={vertical ? 'left' : 'top'}>
        <IconButton
          size="small"
          onClick={handleClick}
          disabled={isUploading}
          aria-label={t('file_upload.replace')}
          className="text-label-primary hover:bg-bg-secondary"
        >
          <MdUpload />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('file_upload.download')} placement={vertical ? 'left' : 'top'}>
        <IconButton
          size="small"
          onClick={handleDownloadClick}
          disabled={isUploading}
          aria-label={t('file_upload.download')}
          className="border border-border-primary text-label-primary hover:bg-bg-secondary"
        >
          <MdDownload />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('file_upload.remove')} placement={vertical ? 'left' : 'top'}>
        <IconButton
          size="small"
          onClick={handleRemoveClick}
          disabled={isUploading}
          aria-label={t('file_upload.remove')}
          className="text-error hover:opacity-80"
        >
          <MdDelete />
        </IconButton>
      </Tooltip>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div
      className={`flex flex-col items-center justify-center cursor-pointer ${
        isCompact ? 'space-y-1 py-2' : 'space-y-3 py-6'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={uploadText || t('file_upload.click_or_drag')}
      aria-describedby={showRestrictionLine ? `${inputId}-restrictions` : undefined}
    >
      <MdCloudUpload className={isCompact ? 'w-8 h-8 text-gray-400' : 'w-16 h-16 text-gray-400'} />
      <div className={`flex flex-col items-center ${isCompact ? 'space-y-0.5' : 'space-y-1'}`}>
        <span
          className={
            isCompact ? 'text-xs font-medium text-gray-700 text-center px-2' : 'text-sm font-medium text-gray-700'
          }
        >
          {uploadText || t('file_upload.click_or_drag')}
        </span>
        {showRestrictionLine && (
          <div id={`${inputId}-restrictions`} className="text-xs text-gray-500 text-center">
            {acceptedTypesText !== 'All file types' && <span>{acceptedTypesText}</span>}
            {acceptedTypesText !== 'All file types' && maxSizeText && <span> • </span>}
            {maxSizeText && <span>{t('file_upload.max_size')}: {maxSizeText}</span>}
          </div>
        )}
      </div>
    </div>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className={`flex flex-col items-center justify-center w-full ${isCompact ? 'space-y-2 py-3' : 'space-y-3 py-6'}`}>
      <CircularProgress size={isCompact ? 28 : 40} />
      <div className={`flex flex-col items-center w-full max-w-xs ${isCompact ? 'space-y-1' : 'space-y-2'}`}>
        <span className={isCompact ? 'text-xs text-gray-600' : 'text-sm text-gray-600'}>{t('file_upload.uploading')}</span>
        <div className="w-full">
          <LinearProgress variant="determinate" value={uploadProgress} className="w-full" />
          <span className={`text-xs text-gray-500 ${isCompact ? 'mt-0.5' : 'mt-1'}`}>{uploadProgress}%</span>
        </div>
      </div>
    </div>
  );

  const renderDefaultUploadedLayout = (preview: ReactNode, meta: ReactNode | null) => (
    <div className="flex w-full justify-center">
      <div
        className={`flex w-full max-w-full flex-col items-center ${
          isCompact ? 'gap-2' : 'gap-3'
        } sm:flex-row sm:items-center sm:justify-center ${isCompact ? 'sm:gap-3' : 'sm:gap-4'}`}
      >
        <div className="shrink-0">{preview}</div>
        {meta ? (
          <div
            className={`flex min-w-0 w-full max-w-full flex-col items-center ${
              isCompact ? 'gap-2' : 'gap-3'
            } sm:w-auto sm:max-w-md sm:flex-1 sm:flex-row sm:items-center sm:justify-between ${
              isCompact ? 'sm:gap-3' : 'sm:gap-4'
            }`}
          >
            <div className="flex min-w-0 flex-col items-center text-center sm:items-start sm:text-left sm:pr-2">
              {meta}
            </div>
            {renderActionButtons(false, true)}
          </div>
        ) : (
          renderActionButtons(false, true)
        )}
      </div>
    </div>
  );

  // Render uploaded state - image
  const renderImageState = () => {
    // If we don't have a display URL and the file is not actually an image, show file icon instead
    if (!displayUrl && detectedType !== 'image') {
      return renderFileState();
    }

    if (isStackedLayout) {
      return (
        <div className="flex w-full min-w-0 items-stretch gap-2">
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt={altText}
                width={imageWidth}
                height={imageHeight}
                className="w-full aspect-video max-h-48 object-cover"
              />
            ) : (
              <div className="flex aspect-video max-h-48 w-full items-center justify-center text-xs text-gray-400">
                {t('file_upload.upload_image_text')}
              </div>
            )}
          </div>
          {renderActionButtons(true)}
        </div>
      );
    }

    const preview = displayUrl ? (
      <Image
        src={displayUrl}
        alt={altText}
        width={imageWidth}
        height={imageHeight}
        className="rounded border border-gray-200 bg-gray-100 object-contain"
        style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
      />
    ) : (
      <div
        className="flex items-center justify-center rounded border border-gray-200 bg-gray-100 text-xs text-gray-400"
        style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
      >
        {filename || t('file_upload.upload_image_text')}
      </div>
    );

    const meta =
      showFileName && filename ? (
        <Tooltip title={filename}>
          <span
            className={`block max-w-full truncate font-medium text-gray-900 ${
              isCompact ? 'text-xs' : 'text-sm'
            }`}
          >
            {filename}
          </span>
        </Tooltip>
      ) : null;

    return renderDefaultUploadedLayout(preview, meta ?? null);
  };

  // Render uploaded state - non-image file
  const renderFileState = () => {
    if (!fileIconInfo) return null;
    const { Icon, color, labelKey } = fileIconInfo;

    const iconClass = isCompact ? 'w-8 h-8' : 'w-16 h-16';

    if (isStackedLayout) {
      return (
        <div className="flex w-full min-w-0 items-stretch gap-2">
          <div
            className="flex min-w-0 flex-1 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 aspect-video max-h-48"
          >
            <Icon className={`${iconClass} ${color}`} />
          </div>
          {renderActionButtons(true)}
        </div>
      );
    }

    const preview = (
      <div
        className="flex shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50"
        style={{ width: `${fileIconBoxPx}px`, height: `${fileIconBoxPx}px` }}
      >
        <Icon className={`${iconClass} ${color}`} />
      </div>
    );

    const meta = (
      <div className={`flex flex-col ${isCompact ? 'gap-0' : 'gap-0.5'}`}>
        {showFileName && filename ? (
          <Tooltip title={filename}>
            <span
              className={`block max-w-full truncate font-medium text-gray-900 ${
                isCompact ? 'text-xs' : 'text-sm'
              }`}
            >
              {filename}
            </span>
          </Tooltip>
        ) : null}
        <span className={isCompact ? 'text-[10px] text-gray-500' : 'text-xs text-gray-500'}>
          {t(labelKey)}
        </span>
      </div>
    );

    return renderDefaultUploadedLayout(preview, meta);
  };

  const infoTooltipTitle = infoTooltip ? (
    <span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{infoTooltip}</span>
  ) : null;

  // Main render
  return (
    <div className="relative">
      {infoTooltip && infoTooltipTitle ? (
        <div className="absolute top-1 right-1 z-[1]" onClick={(e) => e.stopPropagation()}>
          <Tooltip title={infoTooltipTitle} placement="left" enterTouchDelay={0}>
            <IconButton
              size="small"
              aria-label={t('file_upload.info_tooltip_label')}
              edge="end"
              className="text-gray-500 touch-manipulation"
              sx={{
                minWidth: { xs: 44, sm: isCompact ? 28 : 32 },
                minHeight: { xs: 44, sm: isCompact ? 28 : 32 },
              }}
            >
              <MdInfoOutline className={isCompact ? 'text-base' : 'text-lg'} />
            </IconButton>
          </Tooltip>
        </div>
      ) : null}
      <div
        className={containerClasses}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        role="region"
        aria-label={t('file_upload.upload_text')}
      >
      {isUploading ? (
        renderLoadingState()
      ) : currentFileUrl ? (
        detectedType === 'image' ? (
          renderImageState()
        ) : (
          renderFileState()
        )
      ) : (
        renderEmptyState()
      )}
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileChange}
        className="sr-only"
        disabled={isUploading}
        aria-hidden="true"
      />
      </div>
    </div>
  );
};

export default FileUploadField;
