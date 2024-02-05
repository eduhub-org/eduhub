import React, { ChangeEvent, ReactNode, useState } from 'react';
import { DebounceInput } from 'react-debounce-input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@material-ui/core/Tooltip';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

interface EduHubTextFieldEditorProps {
  label?: string;
  placeholder?: string;
  element?: string;
  maxLength?: number;
  debounceTimeout?: number;
  className?: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  value: string;
  typeCheck?: (text: string) => boolean;
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  forceNotifyByEnter?: boolean;
  isMarkdown?: boolean;
  [x: string]: any; // for the rest of the props
}

const EduHubTextFieldEditor: React.FC<EduHubTextFieldEditorProps> = ({
  label = null,
  placeholder,
  element = 'textarea',
  maxLength = 200,
  debounceTimeout = 1000,
  className = '',
  onChange,
  value,
  typeCheck,
  helpText,
  errorText,
  translationNamespace,
  forceNotifyByEnter = false,
  isMarkdown = false,
  ...props // rest of the props
}) => {
  const { t } = useTranslation(translationNamespace);
  const [showPreview, setShowPreview] = useState(false);
  const togglePreview = () => setShowPreview(!showPreview);

  const baseClass = 'w-full px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = `${baseClass} ${className}`.trim();

  const renderInput = () => (
    <div className="relative">
      <DebounceInput
        label={label}
        placeholder={placeholder}
        element={element}
        maxLength={maxLength}
        debounceTimeout={debounceTimeout}
        className={finalClassName}
        onChange={onChange}
        value={value}
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
        <a href="https://www.markdownguide.org" target="_blank">
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
    </div>
  );
};

export default EduHubTextFieldEditor;
