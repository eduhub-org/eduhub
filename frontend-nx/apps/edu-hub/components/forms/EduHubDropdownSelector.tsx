import React, { ChangeEvent, ReactNode } from 'react';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@material-ui/core/Tooltip';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

interface EduHubDropdownSelectorProps {
  label?: ReactNode;
  options: { value: string; label: string }[];
  className?: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  value: string;
  helpText?: string;
  translationNamespace?: string;
}

const EduHubDropdownSelector: React.FC<EduHubDropdownSelectorProps> = ({
  label = null,
  options,
  className = '',
  onChange,
  value,
  helpText,
  translationNamespace,
  ...props // rest of the props
}) => {
  const { t } = useTranslation(translationNamespace);
  const baseClass = 'w-full h-12 px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = `${baseClass} ${className}`.trim();

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
        </div>
        <div>
          <select
            onChange={onChange}
            value={value}
            className={finalClassName}
            {...props} // spread the rest of the props
          >
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default EduHubDropdownSelector;
