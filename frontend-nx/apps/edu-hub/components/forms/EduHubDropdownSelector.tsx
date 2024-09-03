import React, { ChangeEvent } from 'react';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { prioritizeClasses } from '../../helpers/util';
import { DocumentNode } from 'graphql';
import { useRoleMutation } from '../../hooks/authedMutation';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import log from 'loglevel';

interface EduHubDropdownSelectorProps {
  label?: string;
  options: string[];
  className?: string;
  value: string;
  helpText?: string;
  translationPrefix?: string;
  updateMutation: DocumentNode;
  idVariables: Record<string, any>;
  refetchQueries?: string[];
  onChange?: (newValue: string) => void;
  translationNamespace?: string;
}

const EduHubDropdownSelector: React.FC<EduHubDropdownSelectorProps> = ({
  label,
  options,
  className = '',
  value,
  helpText,
  translationPrefix = '',
  updateMutation,
  idVariables,
  refetchQueries = [],
  onChange,
  translationNamespace,
}) => {
  const { t } = useTranslation(translationNamespace);
  const { error, handleError, resetError } = useErrorHandler();

  const [updateValue] = useRoleMutation(updateMutation, {
    onError: (error) => handleError(t(error.message)),
    onCompleted: (data) => {
      if (onChange) onChange(data[Object.keys(data)[0]]);
    },
  });

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    log.debug('Updating item with new value:', newValue);
    updateValue({
      variables: { ...idVariables, value: newValue },
      refetchQueries: refetchQueries,
    });
  };

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
          <select onChange={handleChange} value={value} className={finalClassName}>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {t(translationPrefix + option)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
    </div>
  );
};

export default EduHubDropdownSelector;
