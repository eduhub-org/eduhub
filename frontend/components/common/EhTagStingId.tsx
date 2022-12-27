import { FC, useCallback } from "react";

interface IProps {
  title: string;
  id: string;
  requestDeleteTag?: (id: string) => void;
}

const EhTagStingId: FC<IProps> = ({ title, id, requestDeleteTag }) => {
  const handleDelete = useCallback(() => {
    if (requestDeleteTag) requestDeleteTag(id);
  }, [requestDeleteTag, id]);

  return (
    <div
      title={title}
      className="flex justify-between rounded-full bg-edu-tag-color px-2 py-1"
      key={id}
    >
      <p className="truncate">{title}</p>
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

export default EhTagStingId;
