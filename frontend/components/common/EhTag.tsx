import { FC, useCallback } from "react";

export interface TagElement {
  id: number;
  display: string;
}

interface IProps {
  tag: TagElement;
  requestDeleteTag?: (id: number) => void;
}

const EhTag: FC<IProps> = ({ tag, requestDeleteTag }) => {
  const handleDelete = useCallback(() => {
    if (requestDeleteTag) requestDeleteTag(tag.id);
  }, [tag, requestDeleteTag]);

  return (
    <div
      title={tag.display}
      className="flex justify-between rounded-full bg-edu-tag-color px-2 py-1"
      key={tag.id}
    >
      <p className="truncate">{tag.display}</p>
      {requestDeleteTag && (
        <div
          onClick={handleDelete}
          className="text-white cursor-pointer text-center ml-2"
        >
          x
        </div>
      )}
    </div>
  );
};

export default EhTag;
