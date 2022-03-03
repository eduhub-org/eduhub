import { Dialog, DialogTitle } from "@material-ui/core";
import { FC, useCallback } from "react";
import { MdClose } from "react-icons/md";

import { Button } from "../common/Button";

interface QuestionProps {
  question: string;
  confirmationText: string;
  onClose: (confirmed: boolean) => void;
  open: boolean;
}

export const QuestionConfirmationDialog: FC<QuestionProps> = ({
  question,
  confirmationText,
  onClose,
  open,
}) => {
  const handleCancel = useCallback(() => onClose(false), [onClose]);
  const handleConfirm = useCallback(() => onClose(true), [onClose]);

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>Bestätigung</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <div className="m-16">
        <div className="mb-8">{question}</div>
        <div className="grid grid-cols-2">
          <div>
            <Button onClick={handleCancel}>Abbrechen</Button>
          </div>
          <div className="flex justify-end">
            <Button filled onClick={handleConfirm}>
              {confirmationText}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
