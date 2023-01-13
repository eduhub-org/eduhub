import { Dialog, DialogContent, DialogTitle } from "@material-ui/core";
import { FC, ReactNode, useCallback, useState } from "react";
import { MdClose } from "react-icons/md";
import { Button } from "../Button";

interface IProps {
  title: string;
  onClose: () => void;
  open: boolean;
  content: ReactNode;
}

const CommonDialog: FC<IProps> = (props) => {
  const handleCancel = useCallback(() => {
    props.onClose();
  }, [props]);

  return (
    <Dialog open={props.open} onClose={handleCancel}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{props.title}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <DialogContent>
        <div>{props.content}</div>
        <div className="flex justify-center my-2">
          <div>
            <Button onClick={handleCancel}>Abbrechen</Button>
          </div>
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommonDialog;
