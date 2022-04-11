import { FC, useCallback } from "react";

interface IPros {
  title: string;
  id: number;
  selected: number;
  onClickCallback: (p: number) => any;
}

const SingleNavItem: FC<IPros> = ({ title, selected, id, onClickCallback }) => {
  const tabClickCallback = useCallback(() => {
    onClickCallback(id);
  }, [id, onClickCallback]);

  return (
    <button
      onClick={tabClickCallback}
      className={`
    border-b-2 border-solid hover:border-black
    mr-6
    last:mr-0
    px-5
    focus:outline-none
    ${selected === id ? "border-black font-bold" : "border-white"}`}
    >
      {title}
    </button>
  );
};

export default SingleNavItem;
