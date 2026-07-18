import React, { useState, ChangeEvent, KeyboardEvent, useEffect, useCallback, useRef, useMemo } from 'react';
import { DocumentNode } from 'graphql';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { useDebouncedCallback } from 'use-debounce';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
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
 *
 * Translation tabs: pass `translationTabs` with two or more entries (e.g. DE + EN). Tab labels use
 * `common.input_field.language_de` / `language_en`, or optional `label` per tab. When set,
 * `itemId` / `value` are ignored (use dummy values at the call site if required by TypeScript).
 */

export type InputFieldTranslationTab = {
  /** Language code, e.g. DE / EN — used for tab labels unless `label` is set */
  lang: string;
  itemId: number;
  value: string;
  /** Override for the tab button text */
  label?: string;
};

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
   * Unique identifier for the item being edited (ignored when `translationTabs` has 2+ tabs).
   */
  itemId: number;

  /**
   * The current value of the input field (ignored when `translationTabs` has 2+ tabs).
   */
  value: string;

  /**
   * When set with at least two entries, shows language tabs and edits each row’s `itemId` / `value`.
   */
  translationTabs?: InputFieldTranslationTab[];

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
   * Applied to the debounced text before sending `text` to `updateValueMutation` (e.g. normalize URLs).
   * Does not change what the user sees in the field.
   * Return `null` for empty/cleared input to persist null when the mutation accepts nullable `String`.
   * If the user entered non-empty text and you return `null`, the mutation is skipped and an error is shown
   * (see `transformRejectedMessage`).
   */
  transformMutationText?: (text: string) => string | null;

  /**
   * Shown when `transformMutationText` returns `null` but the trimmed input is not empty (reject invalid paste).
   * Falls back to `common.input_field.transform_rejected` when omitted.
   */
  transformRejectedMessage?: string;

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
  translationTabs,
  updateValueMutation,
  transformMutationText,
  transformRejectedMessage,
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
  const tManageCourse = useTranslations('manageCourse');
  const isTranslationMode = Boolean(translationTabs && translationTabs.length >= 2);

  const [activeLang, setActiveLang] = useState(() => translationTabs?.[0]?.lang ?? '');

  const currentTab = useMemo(() => {
    if (!translationTabs?.length) return null;
    return translationTabs.find((tab) => tab.lang === activeLang) ?? translationTabs[0];
  }, [translationTabs, activeLang]);

  const effectiveItemId = isTranslationMode && currentTab ? currentTab.itemId : itemId;
  const effectiveValue = isTranslationMode && currentTab ? currentTab.value : value;

  const [localText, setLocalText] = useState(() =>
    translationTabs && translationTabs.length >= 2 ? translationTabs[0].value : value
  );
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const togglePreview = () => setShowPreview((prev) => !prev);

  const tabButtonLabel = useCallback(
    (tab: InputFieldTranslationTab) => {
      if (tab.label) return tab.label;
      const code = tab.lang.toUpperCase();
      if (code === 'DE') return t('input_field.language_de');
      if (code === 'EN') return t('input_field.language_en');
      return tab.lang;
    },
    [t]
  );

  // Conflict-safe sync: only accept server value when we're not mid-edit (local matches last sent).
  // Prevents stale refetch responses from overwriting text typed after a save.
  const lastSentValueRef = useRef(effectiveValue);
  const prevItemIdRef = useRef(effectiveItemId);
  const effectiveItemIdRef = useRef(effectiveItemId);
  const localTextRef = useRef(localText);

  useEffect(() => {
    localTextRef.current = localText;
  }, [localText]);

  useEffect(() => {
    effectiveItemIdRef.current = effectiveItemId;
  }, [effectiveItemId]);

  useEffect(() => {
    if (!translationTabs?.length) return;
    if (!translationTabs.some((tab) => tab.lang === activeLang)) {
      setActiveLang(translationTabs[0].lang);
    }
  }, [translationTabs, activeLang]);

  useEffect(() => {
    if (prevItemIdRef.current !== effectiveItemId) {
      prevItemIdRef.current = effectiveItemId;
      setLocalText(effectiveValue);
      lastSentValueRef.current = effectiveValue;
      return;
    }
    const isDirty = localText !== lastSentValueRef.current;
    if (!isDirty) {
      setLocalText(effectiveValue);
      lastSentValueRef.current = effectiveValue;
    }
  }, [effectiveValue, localText, effectiveItemId]);

  const extractMutationFailureMessage = useCallback(
    (resultData: unknown): string | null => {
      if (!resultData || typeof resultData !== 'object') return null;

      const translateMessageKey = (messageKey: unknown): string | null => {
        if (typeof messageKey !== 'string' || !messageKey.trim()) return null;
        const translationKey = `formbricks.errors.${messageKey}`;
        if (!tManageCourse.has(translationKey)) return null;
        return tManageCourse(translationKey);
      };

      for (const value of Object.values(resultData as Record<string, unknown>)) {
        if (!value || typeof value !== 'object' || !('success' in value)) continue;
        const actionResult = value as {
          success?: boolean;
          error?: unknown;
          message?: unknown;
          messageKey?: unknown;
        };
        if (actionResult.success === false) {
          const translatedByMessageKey = translateMessageKey(actionResult.messageKey);
          if (translatedByMessageKey) {
            return translatedByMessageKey;
          }

          if (typeof actionResult.error === 'string' && actionResult.error.trim()) {
            return actionResult.error;
          }
          if (typeof actionResult.message === 'string' && actionResult.message.trim()) {
            return actionResult.message;
          }
          return t('input_field.save_failed');
        }
      }
      return null;
    },
    [t, tManageCourse]
  );

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
        const failureMessage = extractMutationFailureMessage(data);
        if (failureMessage) {
          handleError(failureMessage);
          return;
        }

        if (onValueUpdated) onValueUpdated(data);
        setShowSavedNotification(true);
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
    (inputType: string, numberText?: string): string => {
      switch (inputType) {
        case 'link':
          return t('input_field.invalid_link_format');
        case 'email':
          return t('input_field.invalid_email_format');
        case 'ects':
          return t('input_field.invalid_ects_format');
        case 'number': {
          if (!Number.isInteger(Number.parseInt(numberText ?? '', 10))) {
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
    [t, min, max]
  );

  const debouncedUpdateText = useDebouncedCallback((newText: string) => {
    if (validateInput(newText)) {
      if (updateValueMutation) {
        let textValue: string | number | null;
        if (type === 'number') {
          const parsed = newText === '' ? null : Number.parseInt(newText, 10);
          const numericValue = parsed !== null && !Number.isNaN(parsed) ? parsed : null;
          if (transformMutationText) {
            const transformed = transformMutationText(numericValue === null ? '' : String(numericValue));
            textValue = transformed ?? null;
          } else {
            textValue = numericValue;
          }
        } else {
          const transformed = transformMutationText ? transformMutationText(newText) : newText;
          textValue =
            transformMutationText && (transformed === null || transformed === undefined)
              ? null
              : transformed ?? newText;
        }

        const transformRejected =
          Boolean(transformMutationText) && newText.trim() !== '' && textValue === null;
        if (transformRejected) {
          const msg = transformRejectedMessage ?? t('input_field.transform_rejected');
          setErrorMessage(msg);
          setHasBlurred(true);
          return;
        }

        lastSentValueRef.current = newText;
        updateText({ variables: { itemId: effectiveItemIdRef.current, text: textValue } });
      } else if (onValueUpdated) {
        onValueUpdated({ text: newText });
      }
      setErrorMessage('');
    } else {
      setErrorMessage(getErrorMessage(type, newText));
    }
    setHasBlurred(false);
  }, debounceTimeout);

  const handleTranslationTabChange = useCallback(
    (nextLang: string) => {
      if (!isTranslationMode || !translationTabs || nextLang === activeLang) return;
      debouncedUpdateText.flush();
      setShowPreview(false);
      setActiveLang(nextLang);
    },
    [isTranslationMode, translationTabs, activeLang, debouncedUpdateText]
  );

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newText = event.target.value;
      if (type === 'number') {
        const numberPattern = min !== undefined && min >= 0 ? /^\d*$/ : /^-?\d*$/;
        if (!numberPattern.test(newText)) {
          return;
        }
      }
      setLocalText(newText);
      debouncedUpdateText(newText);
    },
    [debouncedUpdateText, type, min]
  );

  const handleBlur = useCallback(() => {
    setHasBlurred(true);
    if (!validateInput(localText)) {
      const currentErrorMessage = getErrorMessage(type, localText);
      setErrorMessage(currentErrorMessage);
      if (variant === 'eduhub') {
        handleError(currentErrorMessage);
      }
    } else {
      setErrorMessage('');
      if (variant === 'eduhub') {
        resetError();
      }
    }
    debouncedUpdateText.flush();
  }, [variant, localText, validateInput, debouncedUpdateText, type, handleError, resetError, getErrorMessage]);

  // Preserves react-debounce-input's forceNotifyByEnter behavior: flush the
  // pending debounced update immediately when Enter is pressed.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (forceNotifyByEnter && event.key === 'Enter') {
        debouncedUpdateText.flush();
      }
    },
    [forceNotifyByEnter, debouncedUpdateText]
  );

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
            endAdornment: helpText ? (
              <InputAdornment position="end">
                <Tooltip
                  title={<span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{helpText}</span>}
                  placement="top"
                >
                  <HelpOutline style={{ cursor: 'pointer', color: 'var(--eduhub-label-disabled)' }} />
                </Tooltip>
              </InputAdornment>
            ) : undefined,
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
      {(label || helpText) && (
        <div className="mb-2 flex items-center gap-2 text-label-primary">
          {label ? <span className="text-sm font-semibold">{label}</span> : null}
          {helpText ? (
            <Tooltip
              title={<span className="block max-w-sm whitespace-pre-line text-xs leading-snug">{helpText}</span>}
              placement="top"
            >
              <HelpOutline style={{ cursor: 'pointer', color: 'var(--eduhub-label-disabled)' }} />
            </Tooltip>
          ) : null}
        </div>
      )}
      {/* Translation mode keeps a larger shared surface for tabs + editor; regular inputs stay compact */}
      <div className={isTranslationMode ? 'rounded-lg border border-border-primary/40 bg-fill-primary p-3 light' : 'light'}>
        {(isTranslationMode || type === 'markdown') && (
          <div className="flex justify-between mb-2 items-start gap-2">
            <div className="flex items-center flex-wrap gap-2 min-w-0">
              {isTranslationMode && translationTabs && (
                <div className="flex flex-wrap gap-1 border-b border-border-primary w-full sm:w-auto">
                  {translationTabs.map((tab) => (
                    <button
                      key={tab.lang}
                      type="button"
                      onClick={() => handleTranslationTabChange(tab.lang)}
                      className={`px-3 py-1.5 text-sm rounded-t border-b-2 -mb-px transition-colors ${
                        activeLang === tab.lang
                          ? 'border-brand text-brand font-semibold'
                          : 'border-transparent text-label-secondary hover:text-label-primary'
                      }`}
                    >
                      {tabButtonLabel(tab)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {type === 'markdown' && (
              <button
                type="button"
                className={`text-xs px-3 pt-2 shrink-0 hover:text-brand ${
                  isTranslationMode ? 'text-label-primary' : 'text-white'
                }`}
                onClick={togglePreview}
              >
                {showPreview ? <u>{t('edit_markdown')}</u> : <u>{t('preview')}</u>}
              </button>
            )}
          </div>
        )}
        <div className={type === 'markdown' ? 'min-h-0' : ''}>
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
              {type === 'textarea' || type === 'markdown' ? (
                <textarea
                  {...props}
                  ref={type === 'markdown' ? resizableRef : undefined}
                  className={`${finalClassName.replace(/\bh-64\b/g, 'min-h-64')} ${errorMessage ? 'border-red-500' : ''}`}
                  style={type === 'markdown' && syncedHeight ? { height: syncedHeight } : undefined}
                  value={localText}
                  onChange={handleTextChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  maxLength={maxLength}
                  placeholder={placeholder}
                />
              ) : (
                <input
                  {...props}
                  type={
                    type === 'number' || type === 'ects'
                      ? 'number'
                      : type === 'email'
                        ? 'email'
                        : type === 'link'
                          ? 'url'
                          : 'text'
                  }
                  className={`${finalClassName.replace(/\bh-64\b/g, 'min-h-64')} ${errorMessage ? 'border-red-500' : ''}`}
                  value={localText}
                  onChange={handleTextChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  maxLength={maxLength}
                  placeholder={placeholder}
                  min={type === 'number' ? min : undefined}
                  max={type === 'number' ? max : undefined}
                  step={type === 'number' ? 1 : undefined}
                  inputMode={type === 'number' ? 'numeric' : undefined}
                  pattern={type === 'number' ? '[0-9]*' : undefined}
                />
              )}
              {showCharacterCount && type !== 'ects' && type !== 'number' && (
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
