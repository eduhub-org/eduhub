import { IconButton } from '@mui/material';
import { FC } from 'react';
import { IoMdAddCircle } from 'react-icons/io';
import EhTag, { TagElement } from './EhTag';

interface IProps {
  tags: TagElement[];
  requestAddTag: () => void;
  requestDeleteTag: (id: number) => void;
}

const EhMultipleTag: FC<IProps> = ({ tags, requestAddTag, requestDeleteTag }) => {
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-10">
        {tags.map((tag) => (
          <EhTag key={tag.id} requestDeleteTag={requestDeleteTag} tag={tag} />
        ))}
      </div>
      <div className="col-span-2">
        <IconButton className="focus:outline-none mt-1" size="small" onClick={requestAddTag}>
          <IoMdAddCircle />
        </IconButton>
      </div>
    </div>
  );
};

export default EhMultipleTag;
