import { Dialog, DialogTitle } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { ChangeEvent, FC, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { Button } from '../../common/Button';

interface IProps {
  inputLabel: string;
  onClose: (confirmed: boolean, inputValue: string) => void;
  open: boolean;
}

export const InputDialog: FC<IProps> = ({ inputLabel, onClose, open }) => {
  const { t } = useTranslation();
  const [currentValue, setCurrentValue] = useState('');

  const handleCancel = useCallback(() => {
    onClose(false, currentValue);
    setCurrentValue('');
  }, [onClose, currentValue]);
  const handleConfirm = useCallback(() => {
    onClose(true, currentValue);
    setCurrentValue('');
  }, [onClose, currentValue]);
  const handleNewInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setCurrentValue(event.target.value);
    },
    [setCurrentValue]
  );

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{t(inputLabel)}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <div className="mt-1 mr-12 ml-12 mb-8">
        <div className="grid grid-cols-6 w-[32rem]">
          <div className="mb-2 col-span-6">
            <input
              className="w-full mb-5 bg-gray-100 focus:border-none"
              type="text"
              value={currentValue}
              onChange={handleNewInput}
              placeholder={inputLabel}
            />
          </div>

          <div className="col-span-3">
            <Button onClick={handleCancel}>{t('cancel')}</Button>
          </div>
          <div className="col-span-3 flex justify-end">
            <Button filled onClick={handleConfirm}>
              {t('add')}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
