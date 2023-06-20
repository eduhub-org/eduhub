import { Dialog, DialogContent, DialogTitle } from '@material-ui/core';
import React, { FC, ReactElement, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';

interface IPros {
  modalTitle?: string;
  onClosed: () => void;
  children?: ReactElement;
  maxWidth?: 'lg' | 'md' | 'sm' | 'xl' | 'xs' | false;
}

const ModalControl2: FC<IPros> = ({ onClosed, modalTitle, children, maxWidth }) => {
  const [open, setOpen] = useState(true);
  const onCloseHandler = useCallback(() => {
    setOpen(false);
    onClosed();
  }, [onClosed]);

  return (
    <>
      <Dialog open={open} onClose={onCloseHandler} maxWidth={maxWidth}>
        <DialogTitle>
          <div className="flex flex-row justify-between">
            {modalTitle && <p>{modalTitle}</p>}
            <MdClose onClick={onCloseHandler} className="cursor-pointer" />
          </div>
        </DialogTitle>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    </>
  );
};

export default ModalControl2;
