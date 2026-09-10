import { FC, ReactElement, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApolloError } from '@apollo/client';
import { IconButton } from '@mui/material';
import { MdDelete } from 'react-icons/md';

import { TableGridDeleteButtonProps } from '../types';
import { QuestionConfirmationDialog } from '../../dialogs/QuestionConfirmationDialog';
import { ErrorMessageDialog } from '../../dialogs/ErrorMessageDialog';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { handleForeignKeyError } from '../../../../helpers/errorHandling';

/**
 * The trash icon plus the confirmation and error dialogs. What "delete" actually does is left to
 * the caller (a single mutation, or an arbitrary async operation), so both flavors below share the
 * exact same control.
 */
const DeleteButtonShell: FC<{
  deletionConfirmationQuestion?: string;
  disabled: boolean;
  /** Returns an error message to display, or null when the deletion succeeded. */
  onConfirm: () => Promise<string | null>;
}> = ({ deletionConfirmationQuestion, disabled, onConfirm }) => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = useTranslations('common');

  // If no question is provided, use the default one
  const confirmationQuestion =
    deletionConfirmationQuestion || t('table_grid_delete_button.deletion_confirmation_question');

  const handleConfirmationClose = async (confirmed: boolean) => {
    setIsConfirmationOpen(false);
    if (confirmed) {
      setErrorMessage(await onConfirm());
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={() => {
          if (!disabled) {
            setIsConfirmationOpen(true);
          }
        }}
        disabled={disabled}
        className="delete-button"
        sx={{
          backgroundColor: 'transparent !important',
          padding: 0,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: disabled ? undefined : 'rgba(255, 0, 0, 0.1) !important',
          },
        }}
      >
        <MdDelete size="1.25em" color={disabled ? 'gray' : 'red'} />
      </IconButton>
      <QuestionConfirmationDialog
        question={confirmationQuestion}
        confirmationText={t('table_grid_delete_button.confirm_delete')}
        open={isConfirmationOpen}
        onClose={() => handleConfirmationClose(false)}
        onConfirm={() => handleConfirmationClose(true)}
      />
      {errorMessage && (
        <ErrorMessageDialog errorMessage={errorMessage} open={!!errorMessage} onClose={() => setErrorMessage(null)} />
      )}
    </>
  );
};

/** Deletion expressed as a single GraphQL mutation taking the row id. */
const MutationDeleteButton = ({
  deleteMutation,
  id,
  refetchQueries,
  idType,
  deletionConfirmationQuestion,
  role,
  deleteVariableName = 'id',
  disabled = false,
  validateDeleteResult,
}: TableGridDeleteButtonProps & { deleteMutation: NonNullable<TableGridDeleteButtonProps['deleteMutation']> }) => {
  const t = useTranslations('common');
  const [deleteItem] = useRoleMutation(deleteMutation, {
    onError: (error) => {
      console.error('Error during deletion:', error);
    },
    onCompleted: (data) => {
      if (data?.anonymizeUser?.error) {
        console.error('Anonymization error:', data.anonymizeUser.error);
      }
    },
    ...(role ? { context: { role } } : {}),
  });

  const performDelete = async (): Promise<string | null> => {
    let variableId = id;
    if (idType === 'number') {
      if (typeof id === 'string') {
        variableId = parseInt(id, 10);
        if (isNaN(variableId)) {
          console.error('Invalid numeric ID:', id);
          return null;
        }
      }
    } else if (idType === 'uuidString') {
      if (typeof id !== 'string') {
        console.error('Invalid UUID string:', id);
        return null;
      }
    }

    // Apollo swallows the rejection because onError is set, so the message is collected in a
    // holder object and read back once the mutation has settled.
    const captured: { message: string | null } = { message: null };
    try {
      const result = await deleteItem({
        variables: { [deleteVariableName]: variableId },
        refetchQueries,
        onError: (error) => {
          captured.message = handleForeignKeyError(error, t);
          console.error('Error deleting item:', error.message);
        },
      });
      return captured.message ?? validateDeleteResult?.(result.data) ?? null;
    } catch (error) {
      console.error('Error during deletion:', error);
      return captured.message;
    }
  };

  return (
    <DeleteButtonShell
      deletionConfirmationQuestion={deletionConfirmationQuestion}
      disabled={disabled}
      onConfirm={performDelete}
    />
  );
};

/** Deletion delegated to the caller, for rows that take more than one mutation to remove. */
const CallbackDeleteButton = ({
  deletionConfirmationQuestion,
  disabled = false,
  onDelete,
}: TableGridDeleteButtonProps & { onDelete: NonNullable<TableGridDeleteButtonProps['onDelete']> }) => {
  const t = useTranslations('common');

  const performDelete = async (): Promise<string | null> => {
    try {
      await onDelete();
      return null;
    } catch (error) {
      console.error('Error during deletion:', error);
      return error instanceof ApolloError
        ? handleForeignKeyError(error, t)
        : t('error_handling.generic_error');
    }
  };

  return (
    <DeleteButtonShell
      deletionConfirmationQuestion={deletionConfirmationQuestion}
      disabled={disabled}
      onConfirm={performDelete}
    />
  );
};

const TableGridDeleteButton = (props: TableGridDeleteButtonProps): ReactElement | null => {
  if (props.onDelete) {
    return <CallbackDeleteButton {...props} onDelete={props.onDelete} />;
  }
  if (props.deleteMutation) {
    return <MutationDeleteButton {...props} deleteMutation={props.deleteMutation} />;
  }
  console.warn('TableGridDeleteButton: either deleteMutation or onDelete is required');
  return null;
};

export default TableGridDeleteButton;
