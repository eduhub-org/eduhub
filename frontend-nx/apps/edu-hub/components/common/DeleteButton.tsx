import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import { MdDelete } from 'react-icons/md';

interface DeleteButtonProps {
  handleDelete: () => void;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ handleDelete }) => (
  <div>
    <IconButton onClick={handleDelete}>
      <MdDelete size="0.75em" className="text-red-500" />
    </IconButton>
  </div>
);

export default DeleteButton;
