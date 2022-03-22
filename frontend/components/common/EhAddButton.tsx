import { FC, useCallback } from "react";
import { MdAddCircle } from "react-icons/md";
import { Button } from "@material-ui/core";

interface IProps {
  text?: string;
  buttonClickCallBack: () => void;
  buttonSize?: "small" | "medium" | "large";
}

const EhAddButton: FC<IProps> = ({ text, buttonClickCallBack, buttonSize }) => {
  const onClickCallBack = useCallback(() => {
    buttonClickCallBack();
  }, [buttonClickCallBack]);

  return (
    <Button
      onClick={buttonClickCallBack}
      size={buttonSize || "medium"}
      startIcon={<MdAddCircle />}
    >
      {text ?? ""}
    </Button>
  );
};

export default EhAddButton;
