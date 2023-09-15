import { Dialog, DialogContent, DialogTitle } from '@material-ui/core';
import React, { FC, ReactNode, useCallback } from 'react';
import { MdClose } from 'react-icons/md';

interface IProps {
  isOpen: boolean;
  close: (showModal: boolean) => void;
  title?: string;
  children?: ReactNode;
}

const Modal: FC<IProps> = ({
  isOpen,
  close,
  title,
  children,
}) => {
  const onCloseHandler = useCallback(() => {
    close(!isOpen);
  }, [isOpen, close]);

  return (
    <>
      <Dialog open={isOpen} onClose={onCloseHandler}>
        <DialogTitle>
          <div className="flex flex-row justify-between">
            {title && <p>{title}</p>}
            <MdClose onClick={onCloseHandler} className="cursor-pointer" />
          </div>
        </DialogTitle>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    </>
  );
};

export default Modal;
