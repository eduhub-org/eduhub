import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { IconButton } from '@mui/material';
import { MdDelete } from 'react-icons/md';

import { TableGridDeleteButtonProps } from '../types';
import { QuestionConfirmationDialog } from '../../dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../dialogs/ErrorMessageDialog';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { handleForeignKeyError } from '../../../../helpers/errorHandling';

const TableGridDeleteButton = ({
  deleteMutation,
  id,
  refetchQueries,
  idType,
  deletionConfirmationQuestion,
}: TableGridDeleteButtonProps) => {
  const [deleteItem] = useRoleMutation(deleteMutation, {
    onError: (error) => {
      console.error('Error during deletion:', error);
    },
    onCompleted: (data) => {
     
      if (data?.anonymizeUser?.error) {
        console.error('Anonymization error:', data.anonymizeUser.error);
      }
    }
  });

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslations();

  // If no question is provided, use the default one
  const confirmationQuestion =
    deletionConfirmationQuestion || t('table_grid_delete_button:deletion_confirmation_question');

  const handleDeleteClick = () => {
    setIsConfirmationOpen(true);
  };

  const handleConfirmationClose = (confirmed: boolean) => {
    setIsConfirmationOpen(false);
    if (confirmed) {
      performDelete();
    }
  };

  const handleErrorClose = () => {
    setErrorMessage(null);
  };

  const performDelete = async () => {
    let variableId = id;
    if (idType === 'number') {
      if (typeof id === 'string') {
        variableId = parseInt(id, 10);
        if (isNaN(variableId)) {
          console.error('Invalid numeric ID:', id);
          return;
        }
      }
    } else if (idType === 'uuidString') {
      if (typeof id !== 'string') {
        console.error('Invalid UUID string:', id);
        return;
      }
    }
  
    try {
      await deleteItem({
        variables: { id: variableId },
        refetchQueries,
        onError: (error) => {
          // Use the generic foreign key error handler
          const message = handleForeignKeyError(error, t);
          setErrorMessage(message);
          console.error('Error deleting item:', error.message);
        },
      });
    } catch (error) {
      console.error('Error during deletion:', error);
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleDeleteClick}
        className="delete-button"
        sx={{
          backgroundColor: 'transparent !important',
          padding: 0,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: 'rgba(255, 0, 0, 0.1) !important',
          },
        }}
      >
        <MdDelete size="1.25em" color="red" />
      </IconButton>
      <QuestionConfirmationDialog
        question={confirmationQuestion}
        confirmationText={t('table_grid_delete_button.confirm_delete')}
        open={isConfirmationOpen}
        onClose={() => handleConfirmationClose(false)}
        onConfirm={() => handleConfirmationClose(true)}
      />
      {errorMessage && (
        <ErrorMessageDialog errorMessage={errorMessage} open={!!errorMessage} onClose={handleErrorClose} />
      )}
    </>
  );
};

export default TableGridDeleteButton;