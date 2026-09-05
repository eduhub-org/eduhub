import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useTranslations } from 'next-intl';
import { FC, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { Programs_Program } from '../../../queries/__generated__/Programs';
import { Button } from '../../common/Button';
import { programTypeMessageKey } from '../../../helpers/programType';
import { ProgramType } from '../../../types/enums';

interface SelectProgramDialogProps {
  open: boolean;
  programs: Programs_Program[];
  onClose: (confirmed: boolean, selectedProgram: Programs_Program | null) => void;
  /** Decides whether the dialog talks about courses, events or degrees. */
  programType: ProgramType;
}

export const SelectProgramDialog: FC<SelectProgramDialogProps> = ({ open, programs, onClose, programType }) => {
  const t = useTranslations('manageCourses');
  const messageKey = programTypeMessageKey(programType);
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
      <DialogTitle className="light">
        <div className="flex justify-between items-center">
          <span className="text-label-primary">{t(`copy_to_program_dialog.title.${messageKey}`)}</span>
          <button
            onClick={handleCancel}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors text-label-primary"
            aria-label={t('close')}
          >
            <MdClose className="text-xl" />
          </button>
        </div>
      </DialogTitle>

      <DialogContent className="light">
        <div className="mb-4">
          <p className="text-label-primary">{t(`copy_to_program_dialog.description.${messageKey}`)}</p>
        </div>

        <div className="max-h-96 overflow-auto mb-6">
          {programs.map((program) => (
            <div
              key={program.id}
              className={`p-3 border rounded mb-2 cursor-pointer transition-colors ${
                selectedProgram?.id === program.id
                  ? 'border-brand bg-brand/10'
                  : 'border-border-primary hover:border-border-secondary'
              }`}
              onClick={() => handleProgramSelect(program)}
            >
              <div className="font-medium text-label-primary">{program.title}</div>
              {program.shortTitle && <div className="text-sm text-label-secondary">{program.shortTitle}</div>}
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button onClick={handleCancel}>{t('cancel')}</Button>
          <Button filled onClick={handleConfirm} disabled={!selectedProgram}>
            {t(`copy_to_program_dialog.button.${messageKey}`)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
