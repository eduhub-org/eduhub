import React, { ChangeEvent, ReactNode } from 'react';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@material-ui/core/Tooltip';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { prioritizeClasses } from '../../helpers/util';

interface EduHubDropdownSelectorProps {
  label?: ReactNode;
  options: string[];
  className?: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  value: string;
  helpText?: string;
  translationPrefix?: string;
}

const EduHubDropdownSelector: React.FC<EduHubDropdownSelectorProps> = ({
  label = null,
  options,
  className = '',
  onChange,
  value,
  helpText,
  translationPrefix,
  ...props // rest of the props
}) => {
  const { t } = useTranslation();
  const baseClass = 'w-full px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

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
              <option key={index} value={option}>
                {t(translationPrefix + option)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default EduHubDropdownSelector;
