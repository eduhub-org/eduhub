import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { DocumentNode } from 'graphql';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useDebouncedCallback } from 'use-debounce';
import { useRoleMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';
import { DebounceInput } from 'react-debounce-input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import { QueryResult } from '@apollo/client';
import Snackbar from '@mui/material/Snackbar';
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';
import { isLinkFormat, isECTSFormat } from '../../helpers/util';

type UnifiedTextFieldEditorProps = {
  // Determines the visual style and behavior of the component
  // 'material' uses Material-UI components, 'eduhub' uses custom styling
  variant: 'material' | 'eduhub';

  // HTML element type to use for input, now including 'markdown' option
  type?: 'input' | 'textarea' | 'markdown' | 'link' | 'email' | 'ects';

  // The label text for the input field
  label?: string;

  // Placeholder text shown when the input is empty
  placeholder?: string;

  // Unique identifier for the item being edited
  itemId: number;

  // The current text value of the input field
  currentText: string;

  // GraphQL mutation to update the text
  // The mutation should accept two variables: 'itemId' and 'text'
  // Example:
  // const UPDATE_TEXT = gql`
  //   mutation UpdateText($itemId: Int!, $text: String!) {
  //     updateText(itemId: $itemId, text: $text) {
  //       id
  //       text
  //     }
  //   }
  // `;
  updateTextMutation: DocumentNode;

  // Callback function called after successful text update
  onTextUpdated?: (data: any) => void;

  // List of GraphQL query names to refetch after mutation
  refetchQueries?: string[];

  // Text shown in tooltip to provide additional information
  helpText?: string;

  // Error message displayed when input is invalid
  errorText?: string;

  // Namespace for translations
  translationNamespace?: string;

  // Indicates if the field is required
  isMandatory?: boolean;

  // EduHub specific props

  // Delay in milliseconds before triggering update after input
  debounceTimeout?: number;

  // Maximum number of characters allowed in the input
  maxLength?: number;

  // Additional CSS classes to apply to the input
  className?: string;

  // If true, triggers update on Enter key press
  forceNotifyByEnter?: boolean;

  // If true, shows character count
  showCharacterCount?: boolean;

  // If true, inverts the color scheme (for dark mode)
  invertColors?: boolean;

  // Allows for additional props to be passed
  [x: string]: any;
};

const UnifiedTextFieldEditor: React.FC<UnifiedTextFieldEditorProps> = ({
  variant,
  type = 'textarea',
  label,
  placeholder,
  itemId,
  currentText,
  updateTextMutation,
  onTextUpdated,
  refetchQueries = [],
  helpText,
  errorText = 'Invalid input',
  translationNamespace,
  isMandatory = false,
  // EduHub specific props
  debounceTimeout = 1000,
  maxLength = 200,
  className = '',
  forceNotifyByEnter = false,
  showCharacterCount = true,
  invertColors = false,
  ...props
}) => {
  const { t } = useTranslation(translationNamespace);
  const [localText, setLocalText] = useState(currentText);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const theme = useTheme();
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    setLocalText(currentText);
  }, [currentText]);

  const [updateText] = useRoleMutation(updateTextMutation, {
    onError: (error) => handleError(t(error.message)),
    onCompleted: (data) => {
      if (onTextUpdated) onTextUpdated(data);
      setShowSavedNotification(true);
    },
    refetchQueries: refetchQueries,
  });

  const validateInput = (text: string): boolean => {
    switch (type) {
      case 'link':
        return isLinkFormat(text);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      case 'ects':
        return isECTSFormat(text);
      default:
        return true;
    }
  };

  const debouncedUpdateText = useDebouncedCallback((newText: string) => {
    if (validateInput(newText)) {
      updateText({ variables: { itemId, text: newText } });
      setErrorMessage('');
      setShowSavedNotification(true);
    } else {
      setErrorMessage(t(errorText));
    }
    setHasBlurred(false);
  }, debounceTimeout);

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newText = event.target.value;
      setLocalText(newText);
      debouncedUpdateText(newText);
    },
    [debouncedUpdateText]
  );

  const handleBlur = useCallback(() => {
    setHasBlurred(true);
    if (!validateInput(localText)) {
      setErrorMessage(t(errorText));
      if (variant === 'eduhub') {
        handleError(t(errorText)); // Only trigger error handling for eduhub variant
      }
    } else {
      setErrorMessage('');
      if (variant === 'eduhub') {
        resetError(); // Only reset error state for eduhub variant
      }
    }
    debouncedUpdateText.flush();
  }, [variant, localText, validateInput, debouncedUpdateText, t, errorText, handleError, resetError]);

  const [showPreview, setShowPreview] = useState(false);
  const togglePreview = () => setShowPreview(!showPreview);

  const baseClass = `w-full px-3 py-3 mb-8 rounded ${
    invertColors ? 'bg-gray-200 text-black' : 'text-gray-500 bg-edu-light-gray'
  }`;
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const renderMaterialUI = () => (
    <div className="col-span-10 flex mt-3">
      <TextField
        className={hasBlurred && errorMessage ? 'w-3/4' : 'w-full'}
        variant="standard"
        label={label ? t(label) : undefined}
        placeholder={t(placeholder || '')}
        value={localText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        InputLabelProps={{
          style: { color: hasBlurred && errorMessage ? 'red' : 'rgb(34, 34, 34)' },
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={t(helpText || '')} placement="top">
                <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
              </Tooltip>
            </InputAdornment>
          ),
          style: { color: hasBlurred && errorMessage ? 'red' : 'inherit' },
        }}
        {...props}
      />
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
    </div>
  );

  const renderEduHub = () => (
    <div className="px-2">
      <div className="text-gray-400">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            {helpText && (
              <Tooltip title={helpText} placement="top">
                <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
              </Tooltip>
            )}
            {label}
          </div>
          {type === 'markdown' && (
            <button className="text-white text-xs px-3 pt-2" onClick={togglePreview}>
              {showPreview ? <u>{t('edit_markdown')}</u> : <u>{t('preview')}</u>}
            </button>
          )}
        </div>
        {type === 'markdown' && showPreview ? (
          <div className={`${finalClassName} bg-gray-600`.trim()}>
            <ReactMarkdown
              className="prose max-w-none text-white whitespace-normal break-words"
              remarkPlugins={[remarkGfm]}
            >
              {localText}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="relative">
            <DebounceInput
              element={type === 'markdown' ? 'textarea' : 'input'}
              type={type === 'ects' ? 'number' : 'text'}
              debounceTimeout={debounceTimeout}
              forceNotifyByEnter={forceNotifyByEnter}
              className={`${finalClassName} ${errorState ? 'border-red-500' : ''}`}
              value={localText}
              onChange={handleTextChange}
              onBlur={handleBlur}
              maxLength={maxLength}
              placeholder={t(placeholder || '')}
              {...props}
            />
            {showCharacterCount && type !== 'ects' && (
              <div className="absolute top-0 right-0 mr-2 mt-1 text-xs text-gray-400">
                {`${localText.length}/${maxLength}`}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={showSavedNotification}
        autoHideDuration={2000}
        onClose={() => setShowSavedNotification(false)}
        message={t('Saved')}
      />
    </div>
  );

  return (
    <>
      {variant === 'material' ? renderMaterialUI() : renderEduHub()}
      {variant === 'eduhub' && error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </>
  );
};

export default UnifiedTextFieldEditor;
