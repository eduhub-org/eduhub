import { FC, useCallback } from "react";

interface IProps {
  buttonText: string;
  disabled?: boolean;
  onClickCallback: () => void;
}

const EhButton: FC<IProps> = ({ buttonText, onClickCallback, disabled }) => {
  const handleOnclick = useCallback(() => {
    onClickCallback();
  }, [onClickCallback]);

  return (
    <button
      onClick={handleOnclick}
      disabled={disabled ?? false}
      className="rounded-full py-2 px-4 border-2 border-black hover:border-indigo-300"
    >
      {buttonText}
    </button>
  );
};

export default EhButton;
