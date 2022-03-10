import { FC, useCallback } from "react";

interface IProps {
  buttonText: string;
  onClickCallback: () => void;
}

const EhButton: FC<IProps> = ({ buttonText, onClickCallback }) => {
  const handleOnclick = useCallback(() => {
    onClickCallback();
  }, [onClickCallback]);

  return (
    <button
      className="rounded-full
                    bg-gray-300
                    text-black
                    pt-2 pb-2 pl-10 pr-10"
      onClick={handleOnclick}
    >
      {buttonText}
    </button>
  );
};

export default EhButton;
