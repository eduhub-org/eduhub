import { Dialog, DialogTitle } from "@material-ui/core";
import { FC, useCallback, useState } from "react";
import { MdClose } from "react-icons/md";
import { Button } from "../../common/Button";

interface IProps {
  question: string;
  confirmText: string;
  inputLabel: string;
  onClose: (confirmed: boolean, inputValue: string) => void;
  open: boolean;
}

export const InputDialog: FC<IProps> = ({
  question,
  inputLabel,
  onClose,
  open,
  confirmText,
}) => {
  const [currentValue, setCurrentValue] = useState("");

  const handleCancel = useCallback(() => {
    onClose(false, currentValue);
    setCurrentValue("");
  }, [onClose, currentValue]);
  const handleConfirm = useCallback(() => {
    onClose(true, currentValue);
    setCurrentValue("");
  }, [onClose, currentValue]);
  const handleNewInput = useCallback(
    (event) => {
      setCurrentValue(event.target.value);
    },
    [setCurrentValue]
  );

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>Eingabe</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <div className="mt-1 mr-12 ml-12 mb-8">
        <div className="mb-2">{question}</div>
        <div className="grid grid-cols-6 w-[32rem]">
          <div className="mb-2 col-span-2">{inputLabel}</div>
          <div className="mb-2 col-span-4">
            <input
              className="w-full border border-solid"
              type="text"
              value={currentValue}
              onChange={handleNewInput}
            />
          </div>

          <div className="col-span-3">
            <Button onClick={handleCancel}>Abbrechen</Button>
          </div>
          <div className="col-span-3 flex justify-end">
            <Button filled onClick={handleConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
