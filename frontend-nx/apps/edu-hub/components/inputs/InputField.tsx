import React, { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react';
import { DocumentNode } from 'graphql';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { useDebouncedCallback } from 'use-debounce';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import { DebounceInput } from 'react-debounce-input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { prioritizeClasses, isLinkFormat, isECTSFormat } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';
import { gql } from 'graphql-tag';

/**
 * InputField Component
 *
 * This component provides a flexible input field that can operate in two modes:
 * 1. Immediate server update mode
 * 2. Local update mode
 *
 * The mode is determined by the presence or absence of the `updateValueMutation` prop:
 *
 * 1. When `updateValueMutation` is provided:
 *    - The component will update the server immediately when the input value changes.
 *    - It will call the provided mutation to update the server.
 *    - After a successful update, it will call `onValueUpdated` with the server response.
 *    - It will show a "Saved" notification after each successful update.
 *
 * 2. When `updateValueMutation` is not provided:
 *    - The component will not attempt to update the server.
 *    - It will only call `onValueUpdated` with the new input value.
 *    - No "Saved" notification will be shown.
 *
 * In both modes:
 * - Input changes are debounced to prevent excessive updates or callbacks.
 * - Input validation is performed, and error messages are displayed if the input is invalid.
 * - The component supports both Material-UI and custom EduHub styling variants.
 *
 * This behavior allows the component to be used in various scenarios:
 * - As a standalone input field that immediately persists changes to the server.
 * - As part of a larger form where updates are collected locally and submitted together later.
 *
 * Conflict-safe sync: When the server refetches after a save, the incoming `value` prop may be
 * stale (from before the user resumed typing). We only sync `localText` from `value` when it is
 * safe: when local state matches what we last sent, so we never overwrite in-progress edits.
 * Focus is preserved by avoiding unnecessary state updates during typing/save cycles.
 */

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
  updateValueMutation?: DocumentNode;

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Extract this prop to prevent it from being spread to DOM elements
  immediateUpdate: _immediateUpdate,
  ...props
}) => {
  const t = useTranslations('common');
  const [localText, setLocalText] = useState(value);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  // Conflict-safe sync: only accept server value when we're not mid-edit (local matches last sent).
  // Prevents stale refetch responses from overwriting text typed after a save.
  const lastSentValueRef = useRef(value);
  const prevItemIdRef = useRef(itemId);

  useEffect(() => {
    if (prevItemIdRef.current !== itemId) {
      prevItemIdRef.current = itemId;
      setLocalText(value);
      lastSentValueRef.current = value;
      return;
    }
    const isDirty = localText !== lastSentValueRef.current;
    if (!isDirty) {
      setLocalText(value);
      lastSentValueRef.current = value;
    }
  }, [value, localText, itemId]);

  const [updateText] = useRoleMutation(
    updateValueMutation ||
      gql`
        mutation NoOp {
          __typename
        }
      `,
    {
      onError: (error) => handleError(t(error.message)),
      onCompleted: (data) => {
        if (onValueUpdated) onValueUpdated(data);
        setShowSavedNotification(true);
      },
      variables: {
        itemId,
        // If type is number, convert the text to number
        ...(type === 'number' 
          ? { text: Number.parseInt(localText, 10) }
          : { text: localText }
        )
      },
      refetchQueries,
    }
  );

  const validateInput = useCallback(
    (text: string): boolean => {
      // Allow empty input for all types
      if (!text) return true;

      switch (type) {
        case 'link':
          return isLinkFormat(text);
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
        case 'ects':
          return isECTSFormat(text);
        case 'number': {
          const num = Number.parseInt(text, 10);
          return (
            !Number.isNaN(num) &&
            Number.isInteger(num) &&
            (min === undefined || num >= min) &&
            (max === undefined || num <= max)
          );
        }
        default:
          return true;
      }
    },
    [type, min, max]
  );

  const getErrorMessage = useCallback(
    (inputType: string): string => {
      switch (inputType) {
        case 'link':
          return t('input_field.invalid_link_format');
        case 'email':
          return t('input_field.invalid_email_format');
        case 'ects':
          return t('input_field.invalid_ects_format');
        case 'number': {
          if (!Number.isInteger(Number.parseInt(value, 10))) {
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
    },
    [t, value, min, max]
  );

  const debouncedUpdateText = useDebouncedCallback((newText: string) => {
    if (validateInput(newText)) {
      lastSentValueRef.current = newText;
      if (updateValueMutation) {
        const textValue = type === 'number' ? Number.parseInt(newText, 10) : newText;
        updateText({ variables: { itemId, text: textValue } });
      } else if (onValueUpdated) {
        onValueUpdated({ text: newText });
      }
      setErrorMessage('');
      setShowSavedNotification(!!updateValueMutation);
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

  const [syncedHeight, setSyncedHeight] = useState<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const resizableRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (node && type === 'markdown') {
        observerRef.current = new ResizeObserver(() => {
          setSyncedHeight(node.offsetHeight);
        });
        observerRef.current.observe(node);
      }
    },
    [type]
  );

  const baseClass = `w-full px-3 py-3 mb-8 rounded ${
    invertColors ? 'bg-gray-200 text-black' : 'text-label-primary bg-fill-primary'
  }`;
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const renderMaterialUI = () => (
    <div className="col-span-10 flex mt-3">
      <TextField
        className={hasBlurred && errorMessage ? 'w-3/4' : 'w-full'}
        variant="standard"
        label={label}
        placeholder={placeholder}
        value={localText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={helpText || ''} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', color: 'var(--eduhub-label-disabled)' }} />
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
        error={hasBlurred && !!errorMessage}
        {...props}
      />
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
    </div>
  );

  const renderEduHub = () => (
    <div className="px-2">
      <div className="text-label-primary">
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
        <div className={`light ${type === 'markdown' ? 'min-h-0' : ''}`}>
          {type === 'markdown' && showPreview ? (
            <div
              ref={resizableRef}
              className={`${finalClassName} bg-gray-600 overflow-y-auto resize-y`.trim()}
              style={syncedHeight ? { height: syncedHeight } : undefined}
            >
              <ReactMarkdown
                className="prose max-w-none text-white whitespace-normal break-words [&_*]:break-words"
                remarkPlugins={[remarkGfm]}
              >
                {localText}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="relative">
              <DebounceInput
                inputRef={type === 'markdown' ? resizableRef : undefined}
                element={type === 'textarea' || type === 'markdown' ? 'textarea' : 'input'}
                type={type === 'number' ? 'number' : type === 'ects' ? 'number' : 'text'}
                debounceTimeout={debounceTimeout}
                forceNotifyByEnter={forceNotifyByEnter}
                className={`${finalClassName.replace(/\bh-64\b/g, 'min-h-64')} ${errorMessage ? 'border-red-500' : ''}`}
                style={type === 'markdown' && syncedHeight ? { height: syncedHeight } : undefined}
                value={localText}
                onChange={handleTextChange}
                onBlur={handleBlur}
                maxLength={maxLength}
                placeholder={placeholder}
                min={type === 'number' ? min : undefined}
                max={type === 'number' ? max : undefined}
                step={type === 'number' ? 1 : undefined}
                {...props}
              />
              {showCharacterCount && type !== 'ects' && (
                <div className="absolute top-0 right-0 mr-2 mt-1 text-xs text-label-secondary">
                  {`${localText.length}/${maxLength}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
    </div>
  );

  return (
    <>
      {variant === 'material' ? renderMaterialUI() : renderEduHub()}
      {variant === 'material' && error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
      {variant === 'eduhub' && error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
      />
    </>
  );
};

export default InputField;
