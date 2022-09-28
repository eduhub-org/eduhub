import { FC, useCallback } from "react";
import { DebounceInput } from "react-debounce-input";

interface IPros {
  label: string;
  placeholder: string;
  debounceTime?: number;
  inputText?: string;
  textArea?: boolean;
  bg?: string;
  disabled?: boolean;
  onChangeHandler?: (value: string) => any;
}
const EhInputWithTitle: FC<IPros> = ({
  label,
  placeholder,
  debounceTime,
  inputText,
  textArea,
  disabled,
  onChangeHandler,
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
            pl-2
            bg-white
            transition
            ease-in-out
            w-full
            border-none border-solid border-gray-300
            focus:border-none focus:outline-none`}
        element={textArea ? "textarea" : "input"}
        forceNotifyByEnter={!textArea}
        debounceTimeout={debounceTime ?? 1000}
        value={inputText ?? ""}
        onChange={handOnchange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export default EhInputWithTitle;
