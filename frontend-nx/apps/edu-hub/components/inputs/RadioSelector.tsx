import { FC, useId } from 'react';

export type RadioSelectorOption = {
  value: string;
  /** Primary, bold option label. */
  label: string;
  /** Optional secondary description shown beneath the label. */
  description?: string;
  /** Disables this single option (the whole group can also be disabled). */
  disabled?: boolean;
};

export type RadioSelectorProps = {
  /** Currently selected value. */
  value: string;
  options: RadioSelectorOption[];
  onValueChange: (value: string) => void;
  /** Shared radio group name; auto-generated when omitted. */
  name?: string;
  disabled?: boolean;
  /**
   * 'card' (default) renders bordered, selectable cards that highlight the
   * active option; 'inline' renders compact rows without the card chrome.
   */
  layout?: 'card' | 'inline';
  className?: string;
};

/**
 * Fully controlled radio group, mirroring the controlled (no-mutation) usage of
 * `CheckboxSelector`. The selected value is owned by the parent via
 * `value` / `onValueChange`, so it stays correct when the surrounding form is
 * re-seeded or reset (unlike `RadioButtonSelector`, which keeps internal state
 * and is wired to an admin mutation). Each option supports a bold label and an
 * optional description line.
 */
const RadioSelector: FC<RadioSelectorProps> = ({
  value,
  options,
  onValueChange,
  name,
  disabled = false,
  layout = 'card',
  className = '',
}) => {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  const isCard = layout === 'card';

  return (
    <div role="radiogroup" className={`flex flex-col space-y-2 ${className}`}>
      {options.map((option) => {
        const optionDisabled = disabled || Boolean(option.disabled);
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            className={`flex items-start gap-2 ${
              isCard
                ? `rounded-md border p-3 transition-colors ${
                    checked ? 'border-brand bg-bg-secondary' : 'border-border-primary'
                  }`
                : ''
            } ${optionDisabled ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
          >
            <input
              type="radio"
              name={groupName}
              className="mt-1 cursor-pointer"
              checked={checked}
              disabled={optionDisabled}
              onChange={() => onValueChange(option.value)}
            />
            <span className="text-sm">
              <span className="font-medium text-label-primary">{option.label}</span>
              {option.description ? (
                <span className="block text-xs text-label-secondary">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default RadioSelector;
