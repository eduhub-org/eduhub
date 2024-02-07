import React, { ChangeEvent, useState } from 'react';
import { DebounceInput } from 'react-debounce-input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoleMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@material-ui/core/Tooltip';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { DocumentNode } from 'graphql';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';

interface EduHubTextFieldEditorProps {
  label?: string;
  element?: string;
  value: string;
  updateMutation: DocumentNode;
  itemId: number;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  refetchQueries?: string[];
  debounceTimeout?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  typeCheck?: (text: string) => boolean;
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  forceNotifyByEnter?: boolean;
  isMarkdown?: boolean;
  [x: string]: any; // for the rest of the props
}

const EduHubTextFieldEditor: React.FC<EduHubTextFieldEditorProps> = ({
  label,
  element = 'textarea',
  value,
  updateMutation,
  itemId,
  onChange,
  refetchQueries,
  debounceTimeout = 1000,
  maxLength = 200,
  placeholder,
  className = '',
  typeCheck,
  helpText,
  errorText = 'Validation failed',
  translationNamespace,
  forceNotifyByEnter = false,
  isMarkdown = false,
  ...props // rest of the props
}) => {
  const { t } = useTranslation(translationNamespace);
  const { error, handleError, resetError } = useErrorHandler();

  const [updateItem] = useRoleMutation(updateMutation, {
    onError: (error) => handleError(t(error.message)),
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newText = event.target.value;
    if (typeCheck && !typeCheck(newText)) {
      // Here a possible type error is handled while typing
      return;
    } else {
      resetError(); // reset error if the new value passes typeCheck
    }
    updateItem({ variables: { itemId, text: newText } });
    // You might want to handle loading state, errors, or the response here
  };

  const handleBlur = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newText = event.target.value;
    if (typeCheck && !typeCheck(newText)) {
      handleError(errorText);
    } else {
      resetError(); // reset error if the new value passes typeCheck
    }
    // the valie is updated anyway, even if it's invalid
    updateItem({ variables: { itemId, text: newText } });
  };

  const [showPreview, setShowPreview] = useState(false);
  const togglePreview = () => setShowPreview(!showPreview);

  const baseClass = 'w-full px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const renderInput = () => (
    <div className="relative">
      <DebounceInput
        label={label}
        placeholder={placeholder}
        element={element}
        maxLength={maxLength}
        debounceTimeout={debounceTimeout}
        className={finalClassName}
        onChange={handleChange}
        value={value}
        onBlur={handleBlur}
        forceNotifyByEnter={forceNotifyByEnter}
        {...props} // spread the rest of the props
      />
      <div className="absolute top-0 right-0 mr-2 mt-1 text-xs text-gray-400">{`${value.length}/${maxLength}`}</div>
    </div>
  );

  const renderMarkdownInput = () => (
    <>
      {showPreview ? (
        <div className={`${finalClassName} bg-gray-600`.trim()}>
          <ReactMarkdown
            className="prose max-w-none text-white whitespace-normal break-words"
            remarkPlugins={[remarkGfm]}
          >
            {value}
          </ReactMarkdown>
        </div>
      ) : (
        <div>{renderInput()}</div>
      )}
      <div className="text-white text-xs px-3 pb-8 mt-[-26px]">
        {t('markdown_info')}
        {' ('}
        <a href="https://www.markdownguide.org" target="_blank" rel="noreferrer">
          <u>{t('markdown_guide')}</u>
          {').'}
        </a>
      </div>
    </>
  );

  return (
    <div className="px-2">
      <div className="text-gray-400">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            {helpText && (
              <Tooltip title={t(helpText)} placement="top">
                <HelpOutlineIcon style={{ cursor: 'pointer', marginRight: '5px' }} />
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
        <div>{isMarkdown ? renderMarkdownInput() : renderInput()}</div>
      </div>
      {error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default EduHubTextFieldEditor;
