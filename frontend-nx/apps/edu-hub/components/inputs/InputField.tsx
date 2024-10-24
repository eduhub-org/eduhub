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
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';
import { isLinkFormat, isECTSFormat } from '../../helpers/util';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';

type InputFieldProps = {
  /**
   * Determines the visual style and behavior of the component.
   * 'material' uses Material-UI components, 'eduhub' uses custom styling.
   */
  variant: 'material' | 'eduhub';

  /**
   * HTML element type to use for input.
   * Both variants fully support: 'input', 'textarea', 'link', 'email', 'ects', 'number'.
   * 'markdown' is only supported for 'eduhub' variant.
   * 'link', 'email', 'ects', and 'number' are specialized input types with custom validation.
   * @default 'textarea'
   */
  type?: 'input' | 'textarea' | 'markdown' | 'link' | 'email' | 'ects' | 'number';

  /**
   * The label text for the input field.
   */
  label?: string;

  /**
   * Placeholder text shown when the input is empty.
   */
  placeholder?: string;

  /**
   * Unique identifier for the item being edited.
   */
  itemId: number;

  /**
   * The current value of the input field.
   */
  value: string;

  /**
   * GraphQL mutation to update the text.
   * The mutation should accept two variables: 'itemId' and 'text'.
   * Example:
   * const UPDATE_TEXT = gql`
   *   mutation UpdateText($itemId: Int!, $text: String!) {
   *     updateText(itemId: $itemId, text: $text) {
   *       id
   *       text
   *     }
   *   }
   * `;
   */
  updateValueMutation: DocumentNode;

  /**
   * Callback function called after successful text update.
   * @param data - The data returned from the mutation.
   */
  onValueUpdated?: (data: any) => void;

  /**
   * List of GraphQL query names to refetch after mutation.
   * @default []
   */
  refetchQueries?: string[];

  /**
   * Text shown in tooltip to provide additional information.
   */
  helpText?: string;

  /**
   * Indicates if the field is required.
   * @default false
   */
  // isMandatory?: boolean;

  /**
   * Delay in milliseconds before triggering update after input.
   * @default 1000
   */
  debounceTimeout?: number;

  /**
   * Maximum number of characters allowed in the input.
   * @default 200
   */
  maxLength?: number;

  /**
   * Additional CSS classes to apply to the input.
   * @default ''
   */
  className?: string;

  /**
   * If true, triggers update on Enter key press.
   * @default false
   */
  forceNotifyByEnter?: boolean;

  /**
   * If true, shows character count.
   * @default true
   */
  showCharacterCount?: boolean;

  /**
   * If true, inverts the color scheme (for dark mode).
   * @default false
   */
  invertColors?: boolean;

  /**
   * Minimum value for number input.
   */
  min?: number;

  /**
   * Maximum value for number input.
   */
  max?: number;

  /**
   * Controls whether the input field should update the server immediately on change or wait for external trigger.
   *
   * @default true
   *
   * When true (default):
   * - The component will call the updateValueMutation as soon as the input changes (with debounce).
   * - This is suitable for standalone fields or when immediate updates are desired.
   *
   * When false:
   * - The component will not call the updateValueMutation directly.
   * - Instead, it will call onValueUpdated with the new value.
   * - This allows the parent component to control when the update should occur (e.g., on form submission).
   * - Useful for multi-field forms where you want to submit all changes at once.
   */
  immediateUpdate?: boolean;

  /**
   * Allows for additional props to be passed.
   */
  [x: string]: any;
};

const InputField: React.FC<InputFieldProps> = ({
  variant,
  type = 'textarea',
  label,
  placeholder,
  itemId,
  value,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  // isMandatory = false,
  // EduHub specific props
  debounceTimeout = 1000,
  maxLength = 200,
  className = '',
  forceNotifyByEnter = false,
  showCharacterCount = true,
  invertColors = false,
  min,
  max,
  immediateUpdate = true,
  ...props
}) => {
  const { t } = useTranslation();
  const [localText, setLocalText] = useState(value);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const theme = useTheme();
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  useEffect(() => {
    setLocalText(value);
  }, [value]);

  const [updateText] = useRoleMutation(updateValueMutation, {
    onError: (error) => handleError(t(error.message)),
    onCompleted: (data) => {
      if (onValueUpdated) onValueUpdated(data);
      setShowSavedNotification(true);
    },
    refetchQueries: refetchQueries,
  });

  const handleNonImmediateUpdate = (newText: string) => {
    if (onValueUpdated) {
      onValueUpdated({ text: newText });
    }
  };

  const validateInput = (text: string): boolean => {
    switch (type) {
      case 'link':
        return isLinkFormat(text);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
      case 'ects':
        return isECTSFormat(text);
      case 'number': {
        const num = parseInt(text, 10);
        return (
          !isNaN(num) && Number.isInteger(num) && (min === undefined || num >= min) && (max === undefined || num <= max)
        );
      }
      default:
        return true;
    }
  };

  const getErrorMessage = (inputType: string): string => {
    switch (inputType) {
      case 'link':
        return t('input_field.invalid_link_format');
      case 'email':
        return t('input_field.invalid_email_format');
      case 'ects':
        return t('input_field.invalid_ects_format');
      case 'number': {
        if (!Number.isInteger(parseInt(value, 10))) {
          return t('input_field.invalid_integer_format');
        }
        if (min !== undefined && max !== undefined) {
          return t(`input_field.invalid_minimum_maximum_integer`, { min, max });
        }
        if (min !== undefined) {
          return t(`input_field.invalid_minimum_integer`, { min });
        }
        if (max !== undefined) {
          return t(`input_field.invalid_maximum_integer`, { max });
        }
        return t('input_field.invalid_integer_format');
      }
      default:
        return t('input_field.invalid_input');
    }
  };

  const debouncedUpdateText = useDebouncedCallback((newText: string) => {
    if (validateInput(newText)) {
      if (immediateUpdate) {
        updateText({ variables: { itemId, text: newText } });
      } else {
        handleNonImmediateUpdate(newText);
      }
      setErrorMessage('');
      setShowSavedNotification(immediateUpdate);
    } else {
      setErrorMessage(getErrorMessage(type));
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
      setErrorMessage(getErrorMessage(type));
      if (variant === 'eduhub') {
        handleError(getErrorMessage(type));
      }
    } else {
      setErrorMessage('');
      if (variant === 'eduhub') {
        resetError();
      }
    }
    debouncedUpdateText.flush();
  }, [variant, localText, validateInput, debouncedUpdateText, type, handleError, resetError, getErrorMessage]);

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
        slotProps={{
          inputLabel: {
            style: { color: hasBlurred && errorMessage ? 'red' : 'rgb(34, 34, 34)' },
          },
          input: {
            style: { color: hasBlurred && errorMessage ? 'red' : 'inherit' },
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={t(helpText || '')} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
        {...props}
      />
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message="notification_snackbar.saved"
      />
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
              element={type === 'textarea' || type === 'markdown' ? 'textarea' : 'input'}
              type={type === 'number' ? 'number' : type === 'ects' ? 'number' : 'text'}
              debounceTimeout={debounceTimeout}
              forceNotifyByEnter={forceNotifyByEnter}
              className={`${finalClassName} ${errorMessage ? 'border-red-500' : ''}`}
              value={localText}
              onChange={handleTextChange}
              onBlur={handleBlur}
              maxLength={maxLength}
              placeholder={t(placeholder || '')}
              min={type === 'number' ? min : undefined}
              max={type === 'number' ? max : undefined}
              step={type === 'number' ? 1 : undefined}
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
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message="notification_snackbar.saved"
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

export default InputField;
