import React, { useState } from 'react';
import { useAdminMutation } from '../../hooks/authedMutation';
import { IconButton } from '@material-ui/core';
import { MdDelete } from 'react-icons/md';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';
import { QuestionConfirmationDialog } from './dialogs/QuestionConfirmationDialog';

interface TableGridDeleteButtonProps {
  deleteMutation: DocumentNode;
  id: string | number;
  refetchQueries: string[];
  idType: 'number' | 'uuidString';
}

const TableGridDeleteButton = ({ 
  deleteMutation, 
  id, 
  refetchQueries, 
  idType
}: TableGridDeleteButtonProps) => {
  const [deleteItem] = useAdminMutation(deleteMutation);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const { t } = useTranslation();

  const handleDeleteClick = () => {
    setIsConfirmationOpen(true);
  };

  const handleConfirmationClose = (confirmed: boolean) => {
    setIsConfirmationOpen(false);
    if (confirmed) {
      performDelete();
    }
  };

  const performDelete = () => {
    let variableId: string | number = id;
    
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
      // Optionally, you could add a UUID validation regex here
    }

    deleteItem({ 
      variables: { id: variableId },
      refetchQueries 
    });
  };

  return (
    <>
      <IconButton size="small" onClick={handleDeleteClick}>
        <MdDelete size="1.25em" style={{ color: 'red' }} />
      </IconButton>
      <QuestionConfirmationDialog
        question={t('deleteConfirmationQuestion')}
        confirmationText={t('confirmDelete')}
        open={isConfirmationOpen}
        onClose={handleConfirmationClose}
      />
    </>
  );
};

export default TableGridDeleteButton;