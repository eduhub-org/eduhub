import { DebounceInput } from 'react-debounce-input';
import useTranslation from 'next-translate/useTranslation';
import Tooltip from '@material-ui/core/Tooltip';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { prioritizeClasses } from '../../helpers/util';

interface EduHubNumberFieldEditorProps {
  label?: string;
  placeholder?: string;
  debounceTimeout?: number;
  className?: string;
  onChange: (event: any) => Promise<void>;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  translationNamespace?: string;
  [x: string]: any; // To accept any additional props
}

const EduHubNumberFieldEditor: React.FC<EduHubNumberFieldEditorProps> = ({
  label,
  placeholder,
  debounceTimeout = 1000,
  className = '',
  onChange,
  value,
  min,
  max,
  step = 1,
  helpText,
  translationNamespace,
  ...props // Spread the rest of the props
}) => {
  const { t } = useTranslation(translationNamespace);

  // Classes for the input field
  const baseClass = 'w-full px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  return (
    <div className="px-2">
      {label && (
        <div className="text-gray-400 flex justify-between mb-2">
          <div className="flex items-center">
            {helpText && (
              <Tooltip title={t(helpText)} placement="top">
                <HelpOutlineIcon style={{ cursor: 'pointer', marginRight: '5px' }} />
              </Tooltip>
            )}
            <span>{label}</span>
          </div>
        </div>
      )}
      <div className="relative">
        <DebounceInput
          element="input"
          type="number"
          placeholder={placeholder}
          debounceTimeout={debounceTimeout}
          className={finalClassName}
          onChange={onChange}
          value={value}
          min={min}
          max={max}
          step={step}
          {...props} // Spread the rest of the props
        />
      </div>
    </div>
  );
};

export default EduHubNumberFieldEditor;
