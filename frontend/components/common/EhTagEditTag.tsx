import { FC, useCallback } from "react";

export interface TagElement {
  id: number;
  display: string;
}

interface IProps {
  tag: TagElement;
  requestDeleteTag: (id: number) => void;
}

const EhTagEditTag: FC<IProps> = ({ tag, requestDeleteTag }) => {
  const handleDelete = useCallback(() => {
    requestDeleteTag(tag.id);
  }, [tag, requestDeleteTag]);

  return (
    <div
      title={tag.display}
      className="grid grid-cols-12 rounded-full bg-edu-tag-color mb-2 last:mb-0"
      key={tag.id}
    >
      <div className="mr-2 ml-2 col-span-10 truncate">{tag.display}</div>
      <div
        onClick={handleDelete}
        className="col-span-2 text-white cursor-pointer text-center"
      >
        x
      </div>
    </div>
  );
};

export default EhTagEditTag;
