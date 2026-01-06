import { FC, useCallback, useMemo, useState, useId, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MdUpload, MdDownload, MdCloudUpload, MdDelete } from 'react-icons/md';
import { CircularProgress, IconButton, Tooltip, LinearProgress } from '@mui/material';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { getPublicImageUrl, parseFileUploadEvent, getPublicUrl, UploadFile } from '../../../helpers/filehandling';
import {
  detectFileType,
  getFilename,
  formatAcceptedTypes,
  formatMaxSize,
  getFileIcon,
  validateMimeType,
} from './utils';
import { FileUploadFieldProps } from './types';
import { useTranslations } from 'next-intl';

export const FileUploadField: FC<FileUploadFieldProps> = ({
  variant,
  currentFileUrl,
  uploadMutation,
  updateMutation,
  removeMutation,
  identifierVariables,
  uploadIdentifierVariables,
  updateFieldName = 'templatePath',
  useChangesObject = false,
  acceptedFileTypes = '*',
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
}) => {
  const t = useTranslations('common');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Always auto-detect file type from URL
  // This ensures the component always shows the correct icon/preview for the actual file
  const detectedType = useMemo(() => detectFileType(currentFileUrl), [currentFileUrl]);

  // Get file icon info for non-image files
  const fileIconInfo = useMemo(() => {
    if (detectedType === 'image') return null;
    return getFileIcon(detectedType);
  }, [detectedType]);

  // Get display URL for images
  // For certificate templates, try accessUrl first, then try constructing URL from filePath
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
      
      // For certificate templates or other private files, try constructing URL from storage bucket
      // This handles cases where files are stored but not in /public/ directory
      const serverAddress = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
      if (serverAddress && currentFileUrl && !currentFileUrl.startsWith('http')) {
        // Try constructing URL - certificate templates might be accessible this way
        return `${serverAddress}/${currentFileUrl}`;
      }
    }
    return null;
  }, [currentFileUrl, detectedType, accessUrl]);

  // Mutations
  const [upload] = useAdminMutation(uploadMutation, {
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

  const [update] = useAdminMutation(updateMutation, {
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

  const [remove] = useAdminMutation(removeMutation ?? updateMutation, {
    refetchQueries,
    onError: (error) => {
      const errorMessage = error.message || t('file_upload.upload_error');
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    },
  });

  // Process file upload
  // Note: Server-side GraphQL mutation must independently validate MIME types
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

      // Validate MIME type if file type is provided and acceptedFileTypes is not '*'
      if (fileType && acceptedFileTypes !== '*') {
        if (!validateMimeType(fileType, acceptedFileTypes)) {
          const acceptedTypesText = formatAcceptedTypes(acceptedFileTypes);
          const errorMessage = t('file_upload.invalid_file_type', { types: acceptedTypesText });
          setIsUploading(false);
          setUploadProgress(0);
          if (onUploadError) {
            onUploadError(errorMessage);
          }
          return;
        }
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
        
        // Validate file type before processing (drag-and-drop bypasses file input accept attribute)
        if (acceptedFileTypes !== '*') {
          const fileType = droppedFile.type;
          if (!validateMimeType(fileType, acceptedFileTypes)) {
            const acceptedTypesText = formatAcceptedTypes(acceptedFileTypes);
            const errorMessage = t('file_upload.invalid_file_type', { types: acceptedTypesText });
            if (onUploadError) {
              onUploadError(errorMessage);
            }
            return;
          }
        }

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
    [processFileUpload, acceptedFileTypes, onUploadError, t]
  );

  const handleDownloadClick = useCallback(() => {
    if (currentFileUrl) {
      // Try accessUrl first (for certificate templates)
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
      
      // For certificate templates or other private files, try constructing URL from storage bucket
      const serverAddress = process.env.NEXT_PUBLIC_STORAGE_BUCKET_URL;
      if (serverAddress && currentFileUrl && !currentFileUrl.startsWith('http')) {
        const constructedUrl = `${serverAddress}/${currentFileUrl}`;
        window.open(constructedUrl, '_blank');
      }
    }
  }, [currentFileUrl, accessUrl]);

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
  const acceptedTypesText = useMemo(() => formatAcceptedTypes(acceptedFileTypes), [acceptedFileTypes]);
  const maxSizeText = useMemo(() => formatMaxSize(maxFileSize), [maxFileSize]);

  // Determine container classes based on state
  const containerClasses = useMemo(() => {
    const baseClasses = 'border-2 rounded-lg p-4 transition-all duration-200';
    let stateClasses = 'border-dashed border-gray-300 bg-gray-50';

    if (isDragging) {
      stateClasses = 'border-solid border-blue-500 bg-blue-50';
    } else if (isHovering && !currentFileUrl) {
      stateClasses = 'border-dashed border-gray-400 bg-gray-100';
    } else if (currentFileUrl && !isUploading) {
      stateClasses = 'border-solid border-gray-300 bg-white';
    }

    return `${baseClasses} ${stateClasses} ${className}`;
  }, [isDragging, isHovering, currentFileUrl, isUploading, className]);

  // Render empty state
  const renderEmptyState = () => (
    <div
      className="flex flex-col items-center justify-center space-y-3 py-6 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={uploadText || t('file_upload.click_or_drag')}
      aria-describedby={`${inputId}-restrictions`}
    >
      <MdCloudUpload className="w-16 h-16 text-gray-400" />
      <div className="flex flex-col items-center space-y-1">
        <span className="text-sm font-medium text-gray-700">{uploadText || t('file_upload.click_or_drag')}</span>
        {(acceptedTypesText !== 'All file types' || maxSizeText) && (
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
    <div className="flex flex-col items-center justify-center space-y-3 py-6 w-full">
      <CircularProgress size={40} />
      <div className="flex flex-col items-center space-y-2 w-full max-w-xs">
        <span className="text-sm text-gray-600">{t('file_upload.uploading')}</span>
        <div className="w-full">
          <LinearProgress variant="determinate" value={uploadProgress} className="w-full" />
          <span className="text-xs text-gray-500 mt-1">{uploadProgress}%</span>
        </div>
      </div>
    </div>
  );

  // Render uploaded state - image
  const renderImageState = () => {
    // If we don't have a display URL and the file is not actually an image, show file icon instead
    if (!displayUrl && detectedType !== 'image') {
      return renderFileState();
    }

    return (
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex items-start space-x-4">
          <div className="relative flex-shrink-0">
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt={altText}
                width={imageWidth}
                height={imageHeight}
                className="object-contain rounded bg-gray-100 border border-gray-200"
                style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
              />
            ) : (
              <div
                className="bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-xs"
                style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
              >
                {filename || t('file_upload.upload_image_text')}
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="flex flex-col space-y-1">
              {showFileName && filename && (
                <Tooltip title={filename}>
                  <span className="text-sm font-medium text-gray-900 truncate">{filename}</span>
                </Tooltip>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Tooltip title={t('file_upload.replace')} placement="top">
                <IconButton
                  size="small"
                  onClick={handleClick}
                  disabled={isUploading}
                  aria-label={t('file_upload.replace')}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <MdUpload />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('file_upload.download')} placement="top">
                <IconButton
                  size="small"
                  onClick={handleDownloadClick}
                  disabled={isUploading}
                  aria-label={t('file_upload.download')}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <MdDownload />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('file_upload.remove')} placement="top">
                <IconButton
                  size="small"
                  onClick={handleRemoveClick}
                  disabled={isUploading}
                  aria-label={t('file_upload.remove')}
                  className="text-red-600 hover:text-red-700"
                >
                  <MdDelete />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render uploaded state - non-image file
  const renderFileState = () => {
    if (!fileIconInfo) return null;
    const { Icon, color, labelKey } = fileIconInfo;

    return (
      <div className="flex flex-col space-y-4 w-full">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 flex items-center justify-center bg-gray-50 rounded border border-gray-200" style={{ width: '96px', height: '96px' }}>
            <Icon className={`w-16 h-16 ${color}`} />
          </div>
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="flex flex-col space-y-1">
              {showFileName && filename && (
                <Tooltip title={filename}>
                  <span className="text-sm font-medium text-gray-900 truncate">{filename}</span>
                </Tooltip>
              )}
              <span className="text-xs text-gray-500">{t(labelKey)}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Tooltip title={t('file_upload.replace')} placement="top">
                <IconButton
                  size="small"
                  onClick={handleClick}
                  disabled={isUploading}
                  aria-label={t('file_upload.replace')}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  <MdUpload />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('file_upload.download')} placement="top">
                <IconButton
                  size="small"
                  onClick={handleDownloadClick}
                  disabled={isUploading}
                  aria-label={t('file_upload.download')}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <MdDownload />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('file_upload.remove')} placement="top">
                <IconButton
                  size="small"
                  onClick={handleRemoveClick}
                  disabled={isUploading}
                  aria-label={t('file_upload.remove')}
                  className="text-red-600 hover:text-red-700"
                >
                  <MdDelete />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
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
  );
};

export default FileUploadField;
