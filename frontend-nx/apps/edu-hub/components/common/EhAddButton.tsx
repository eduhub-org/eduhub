import { FC } from 'react';
import { MdAddCircle } from 'react-icons/md';
import { Button } from '@material-ui/core';

interface IProps {
  text?: string;
  buttonClickCallBack: () => void;
  buttonSize?: 'small' | 'medium' | 'large';
}

const EhAddButton: FC<IProps> = ({ text, buttonClickCallBack, buttonSize }) => {
  return (
    <Button
      onClick={buttonClickCallBack}
      className="focus:outline-none"
      size={buttonSize || 'medium'}
      startIcon={<MdAddCircle />}
    >
      {text ?? ''}
    </Button>
  );
};

export default EhAddButton;
