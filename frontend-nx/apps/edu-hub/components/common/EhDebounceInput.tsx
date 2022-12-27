import { ChangeEvent, FC, useCallback } from "react";
import { DebounceInput } from "react-debounce-input";

interface IPros {
  placeholder: string;
  debounceTime?: number;
  inputText?: string;
  textArea?: boolean;
  onChangeHandler: (value: string) => any;
}

const EhDebounceInput: FC<IPros> = ({
  placeholder,
  debounceTime,
  inputText,
  textArea,
  onChangeHandler,
}) => {
  const handOnchange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChangeHandler(event.target.value);
    },
    [onChangeHandler]
  );

  return (
    <DebounceInput
      className="h-15 
            bg-transparent
            transition
            ease-in-out
            w-full
            border-b border-solid border-gray-300
            focus:border-blue-600 focus:outline-none"
      element={textArea ? "textarea" : "input"}
      forceNotifyByEnter={!textArea}
      debounceTimeout={debounceTime ?? 1000}
      value={inputText ?? ""}
      onChange={handOnchange}
      placeholder={placeholder}
    />
  );
};

export default EhDebounceInput;
