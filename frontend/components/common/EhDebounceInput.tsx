import { FC, useCallback } from "react";
import { DebounceInput } from "react-debounce-input";

interface IPros {
  placeholder: string;
  debounceTime?: number;
  inputText?: string;
  onChangeHandler: (value: string) => any;
}

const EhDebounceInput: FC<IPros> = ({
  placeholder,
  debounceTime,
  inputText,
  onChangeHandler,
}) => {
  const handOnchange = useCallback(
    (event) => {
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
      debounceTimeout={debounceTime ?? 1000}
      value={inputText ?? ""}
      onChange={handOnchange}
      placeholder={placeholder}
    />
  );
};

export default EhDebounceInput;
