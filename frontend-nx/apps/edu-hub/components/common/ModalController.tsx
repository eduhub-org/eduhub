import { Dialog, DialogContent, DialogTitle } from '@material-ui/core';
import React, { FC, ReactElement, useCallback } from 'react';
import { MdClose } from 'react-icons/md';

interface IPros {
  showModal: boolean;
  modalTitle?: string;
  onClose: (showModel: boolean) => void;
  children?: ReactElement;
}

const ModalControl: FC<IPros> = ({
  showModal,
  onClose,
  modalTitle,
  children,
}) => {
  const onCloseHandler = useCallback(() => {
    onClose(!showModal);
  }, [showModal, onClose]);

  return (
    <>
      <Dialog open={showModal} onClose={onCloseHandler}>
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

export default ModalControl;
