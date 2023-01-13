import { IconButton } from "@material-ui/core";
import { FC } from "react";
import { IoMdAddCircle } from "react-icons/io";
import EhTagEditTag, { TagElement } from "./EhTagEditTag";

interface IProps {
  tags: TagElement[];
  requestAddTag: () => void;
  requestDeleteTag: (id: number) => void;
}

const EhTagEdit: FC<IProps> = ({ tags, requestAddTag, requestDeleteTag }) => {
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-10">
        {tags.map((tag) => (
          <EhTagEditTag
            key={tag.id}
            requestDeleteTag={requestDeleteTag}
            tag={tag}
          />
        ))}
      </div>
      <div className="col-span-2">
        <IconButton
          className="focus:outline-none"
          size="small"
          onClick={requestAddTag}
        >
          <IoMdAddCircle />
        </IconButton>
      </div>
    </div>
  );
};

export default EhTagEdit;
