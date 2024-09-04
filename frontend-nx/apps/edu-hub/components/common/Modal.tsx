import React, { FC, ReactNode, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@material-ui/core';
import { MdClose } from 'react-icons/md';
// import styles from './Modal.module.css'; // Uncomment if using CSS modules

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  maxWidth?: 'lg' | 'md' | 'sm' | 'xl' | 'xs' | false;
  // Additional Dialog props
  dialogProps?: React.ComponentProps<typeof Dialog>;
}

const Modal: FC<IProps> = ({ isOpen, onClose, title, children, maxWidth, dialogProps }) => {
  const onCloseHandler = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    // Focus management and accessibility features can be added here
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onCloseHandler} maxWidth={maxWidth} {...dialogProps}>
      <DialogTitle>
        <div className="flex flex-row justify-between">
          {title && <p>{title}</p>}
          <MdClose onClick={onCloseHandler} className="cursor-pointer" aria-label="Close" />
        </div>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};

export default React.memo(Modal);
