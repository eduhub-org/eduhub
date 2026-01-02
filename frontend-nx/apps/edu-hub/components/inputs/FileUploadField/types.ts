import { DocumentNode } from 'graphql';

export interface FileUploadFieldProps {
  /**
   * Determines the visual style and behavior of the component.
   * 'material' uses Material-UI patterns, 'eduhub' uses custom styling.
   */
  variant: 'material' | 'eduhub';

  /**
   * The current file URL/path to display.
   * If null, shows the upload prompt.
   */
  currentFileUrl: string | null;


  /**
   * GraphQL mutation to upload the file.
   * Should accept: base64File, fileName, and identifierVariables
   * Returns: { success, filePath, messageKey, error }
   */
  uploadMutation: DocumentNode;

  /**
   * GraphQL mutation to update the record with the file path.
   * Should accept identifierVariables and the file path field.
   */
  updateMutation: DocumentNode;

  /**
   * Optional GraphQL mutation to remove/delete the file.
   * If not provided, updateMutation will be called with null/empty file path.
   * Should accept identifierVariables and set the file path field to null.
   */
  removeMutation?: DocumentNode;

  /**
   * Variables to identify the record being updated (e.g., { courseId: 1 } or { programId: 1 })
   */
  identifierVariables: Record<string, any>;

  /**
   * Optional variables specifically for the upload mutation.
   * If not provided, identifierVariables will be used for both upload and update mutations.
   * Use this when upload and update mutations require different variable names
   * (e.g., upload expects 'courseId' but update expects 'id').
   */
  uploadIdentifierVariables?: Record<string, any>;

  /**
   * Field name in updateMutation to set the file path.
   * For course images: 'coverImage' (used in changes object)
   * For certificate templates: 'templatePath' (direct variable)
   * @default 'templatePath'
   */
  updateFieldName?: string;

  /**
   * Whether to use changes object pattern (for UPDATE_COURSE_PROPERTY style mutations)
   * If true, wraps updateFieldName in a changes object: { changes: { [updateFieldName]: filePath } }
   * @default false
   */
  useChangesObject?: boolean;

  /**
   * Accepted file types for the file input.
   * @default '*'
   */
  acceptedFileTypes?: string;

  /**
   * Maximum file size in bytes.
   */
  maxFileSize?: number;

  /**
   * Upload instruction text shown when no file is uploaded.
   */
  uploadText?: string;

  /**
   * Alt text for image previews.
   */
  altText?: string;

  /**
   * Width of image preview in pixels.
   * @default 160
   */
  imageWidth?: number;

  /**
   * Height of image preview in pixels.
   * @default 96
   */
  imageHeight?: number;

  /**
   * Whether to show the filename below the preview/icon.
   * @default false
   */
  showFileName?: boolean;

  /**
   * GraphQL queries to refetch after successful upload.
   */
  refetchQueries?: string[];

  /**
   * Callback fired when upload succeeds.
   */
  onUploadSuccess?: (filePath: string) => void;

  /**
   * Callback fired when upload fails.
   */
  onUploadError?: (error: string) => void;

  /**
   * Additional CSS classes for the container.
   */
  className?: string;
}

