import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import useTranslation from 'next-translate/useTranslation';
import { FC, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { Programs_Program } from '../../../queries/__generated__/Programs';
import { Button } from '../../common/Button';

interface SelectProgramDialogProps {
  open: boolean;
  programs: Programs_Program[];
  onClose: (confirmed: boolean, selectedProgram: Programs_Program | null) => void;
  title: string;
}

export const SelectProgramDialog: FC<SelectProgramDialogProps> = ({ open, programs, onClose, title }) => {
  const { t } = useTranslation('manageCourses');
  const [selectedProgram, setSelectedProgram] = useState<Programs_Program | null>(null);

  const handleCancel = useCallback(() => {
    setSelectedProgram(null);
    onClose(false, null);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    onClose(true, selectedProgram);
    setSelectedProgram(null);
  }, [onClose, selectedProgram]);

  const handleProgramSelect = useCallback((program: Programs_Program) => {
    setSelectedProgram(program);
  }, []);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex justify-between items-center">
          <span>{title}</span>
          <button
            onClick={handleCancel}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label={t('close')}
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent>
        <div className="mb-4">
          <p className="text-gray-600">{t('select_target_program')}</p>
        </div>

        <div className="max-h-96 overflow-auto mb-6">
          {programs.map((program) => (
            <div
              key={program.id}
              className={`p-3 border rounded mb-2 cursor-pointer transition-colors ${
                selectedProgram?.id === program.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleProgramSelect(program)}
            >
              <div className="font-medium">{program.title}</div>
              {program.shortTitle && <div className="text-sm text-gray-500">{program.shortTitle}</div>}
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button onClick={handleCancel}>{t('cancel')}</Button>
          <Button filled onClick={handleConfirm} disabled={!selectedProgram}>
            {t('copy_courses')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
