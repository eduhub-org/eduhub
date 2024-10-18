import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { DocumentNode } from 'graphql';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useDebouncedCallback } from 'use-debounce';
import { useAdminMutation, useRoleMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';
import { DebounceInput } from 'react-debounce-input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import { QueryResult } from '@apollo/client';
import Snackbar from '@mui/material/Snackbar';

type UnifiedTextFieldEditorProps = {
  variant: 'material' | 'eduHub';
  label?: string;
  placeholder?: string;
  itemId: number;
  currentText: string;
  updateTextMutation: DocumentNode;
  onTextUpdated?: (data: any) => void;
  refetchQueries?: string[];
  typeCheck?: (text: string) => boolean;
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  isMandatory?: boolean;
  // EduHub specific props
  element?: string;
  refetchQuery?: QueryResult<any, any>;
  debounceTimeout?: number;
  maxLength?: number;
  className?: string;
  forceNotifyByEnter?: boolean;
  isMarkdown?: boolean;
  showCharacterCount?: boolean;
  invertColors?: boolean;
  [x: string]: any; // for the rest of the props
};

const UnifiedTextFieldEditor: React.FC<UnifiedTextFieldEditorProps> = ({
  variant,
  label,
  placeholder,
  itemId,
  currentText,
  updateTextMutation,
  onTextUpdated,
  refetchQueries = [],
  typeCheck,
  helpText,
  errorText = 'Invalid input',
  translationNamespace,
  isMandatory = false,
  // EduHub specific props
  element = 'textarea',
  refetchQuery,
  debounceTimeout = 1000,
  maxLength = 200,
  className = '',
  forceNotifyByEnter = false,
  isMarkdown = false,
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

  useEffect(() => {
    setLocalText(currentText);
  }, [currentText]);

  const [updateTextAdmin] = useAdminMutation(updateTextMutation, {
    onCompleted: (data) => {
      if (onTextUpdated) onTextUpdated(data);
    },
    refetchQueries,
  });

  const [updateTextRole] = useRoleMutation(updateTextMutation, {
    onError: (error) => handleError(t(error.message)),
    onCompleted: (data) => {
      if (onTextUpdated) onTextUpdated(data);
    },
  });

  const updateText = useCallback(
    (variables: { itemId: number; text: string }) => {
      if (variant === 'material') {
        return updateTextAdmin({ variables, refetchQueries });
      } else {
        return updateTextRole({ variables });
      }
    },
    [variant, updateTextAdmin, updateTextRole, refetchQueries]
  );

  const validateText = useCallback(
    (newText: string) => {
      if (typeCheck) {
        return typeCheck(newText) || (!isMandatory && newText === '');
      }
      return isMandatory ? newText !== '' : true;
    },
    [typeCheck, isMandatory]
  );

  const debouncedUpdateText = useDebouncedCallback((newText: string) => {
    if (validateText(newText)) {
      updateText({ itemId, text: newText });
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
    if (!validateText(localText)) {
      setErrorMessage(t(errorText));
    } else {
      setErrorMessage('');
    }
    debouncedUpdateText.flush();
  }, [localText, validateText, debouncedUpdateText, t, errorText]);

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
          {isMarkdown && (
            <button className="text-white text-xs px-3 pt-2" onClick={togglePreview}>
              {showPreview ? <u>{t('edit_markdown')}</u> : <u>{t('preview')}</u>}
            </button>
          )}
        </div>
        {isMarkdown && showPreview ? (
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
              element={element}
              debounceTimeout={debounceTimeout}
              forceNotifyByEnter={forceNotifyByEnter}
              className={finalClassName}
              value={localText}
              onChange={handleTextChange}
              onBlur={handleBlur}
              maxLength={maxLength}
              placeholder={t(placeholder || '')}
              {...props}
            />
            {showCharacterCount && (
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

  return <>{variant === 'material' ? renderMaterialUI() : renderEduHub()}</>;
};

export default UnifiedTextFieldEditor;
