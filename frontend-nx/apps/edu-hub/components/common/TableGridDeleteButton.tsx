import React from 'react';
import { useAdminMutation } from '../../hooks/authedMutation';
import { IconButton } from '@material-ui/core';
import { MdDelete } from 'react-icons/md';
import { DocumentNode } from 'graphql';

interface TableGridDeleteButtonProps {
  deleteMutation: DocumentNode;
  id: string | number;
  refetchQueries: string[];
}

const TableGridDeleteButton = ({ deleteMutation, id, refetchQueries }: TableGridDeleteButtonProps) => {
  const [deleteItem] = useAdminMutation(deleteMutation);

  const handleDelete = () => {
    deleteItem({ variables: { id: typeof id === 'number' ? id : parseInt(id) }, refetchQueries });
  };

  return (
    <IconButton size="small" onClick={handleDelete}>
      <MdDelete size="1.25em" />
    </IconButton>
  );
};

export default TableGridDeleteButton;
