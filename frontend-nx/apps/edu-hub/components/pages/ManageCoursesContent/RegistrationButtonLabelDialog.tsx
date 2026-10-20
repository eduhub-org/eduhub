import { FC, useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { useTranslations } from 'next-intl';

import { useManageMutation } from '../../../hooks/authedMutation';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { UPDATE_COURSE_PROPERTY } from '../../../queries/mutateCourse';
import { AdminCourseList_Course } from '../../../queries/__generated__/AdminCourseList';
import { Button } from '../../common/Button';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import FieldHint from './FieldHint';

interface RegistrationButtonLabelDialogProps {
  open: boolean;
  course: AdminCourseList_Course;
  onClose: () => void;
}

/**
 * Edits the custom label of the register/apply button on the course page, in German and
 * English. An empty field falls back to the label derived from the registration type.
 */
const RegistrationButtonLabelDialog: FC<RegistrationButtonLabelDialogProps> = ({ open, course, onClose }) => {
  const t = useTranslations();
  const { error, handleError, resetError } = useErrorHandler();
  const [labelDe, setLabelDe] = useState('');
  const [labelEn, setLabelEn] = useState('');

  const [updateCourse, { loading }] = useManageMutation(UPDATE_COURSE_PROPERTY, {
    refetchQueries: ['AdminCourseList'],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    if (!open) return;
    setLabelDe(course.registrationButtonLabelDe ?? '');
    setLabelEn(course.registrationButtonLabelEn ?? '');
  }, [open, course.registrationButtonLabelDe, course.registrationButtonLabelEn]);

  const handleSave = async () => {
    try {
      await updateCourse({
        variables: {
          id: course.id,
          changes: {
            registrationButtonLabelDe: labelDe.trim() || null,
            registrationButtonLabelEn: labelEn.trim() || null,
          },
        },
      });
      onClose();
    } catch (err) {
      handleError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <DialogShell
        open={open}
        onClose={onClose}
        title={t('manageCourses.registration_button_label.dialog_title')}
        actions={
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button filled onClick={handleSave} disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <FieldHint>{t('manageCourses.registration_button_label.help_text')}</FieldHint>
          <TextField
            label={t('manageCourses.registration_button_label.label_de')}
            value={labelDe}
            onChange={(event) => setLabelDe(event.target.value)}
            fullWidth
            size="small"
            inputProps={{ maxLength: 60 }}
          />
          <TextField
            label={t('manageCourses.registration_button_label.label_en')}
            value={labelEn}
            onChange={(event) => setLabelEn(event.target.value)}
            fullWidth
            size="small"
            inputProps={{ maxLength: 60 }}
          />
        </div>
      </DialogShell>
      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
    </>
  );
};

export default RegistrationButtonLabelDialog;
