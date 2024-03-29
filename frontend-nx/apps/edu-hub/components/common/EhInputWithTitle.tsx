import { FC, useCallback } from 'react';
import { DebounceInput } from 'react-debounce-input';

interface IPros {
  label: string;
  placeholder: string;
  debounceTime?: number;
  inputText?: string;
  textArea?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onChangeHandler?: (value: string) => any;
  id?: string;
  name?: string;
}
const EhInputWithTitle: FC<IPros> = ({
  label,
  placeholder,
  debounceTime,
  inputText,
  textArea,
  disabled,
  autoFocus,
  maxLength,
  onChangeHandler,
  id,
  name,
}) => {
  const handOnchange = useCallback(
    (event) => {
      if (onChangeHandler) onChangeHandler(event.target.value);
    },
    [onChangeHandler]
  );
  return (
    <div className="flex flex-col space-y-1">
      <p>{label}</p>
      <DebounceInput
        className={`h-12
            px-2
            bg-white
            transition
            ease-in-out
            w-full
            border border-solid border-gray-300
            focus:border-none focus:outline-none`}
        element={textArea ? 'textarea' : 'input'}
        forceNotifyByEnter={!textArea}
        debounceTimeout={debounceTime ?? 1000}
        value={inputText ?? ''}
        onChange={handOnchange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus ?? false}
        maxLength={maxLength ?? 200}
        id={id}
        name={name}
      />
    </div>
  );
};

export default EhInputWithTitle;
