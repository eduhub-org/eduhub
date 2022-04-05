import { FC, useCallback } from "react";

interface IPros {
  title: string;
  id: number;
  selected: number;
  onClickCallback: (p: number) => any;
}

const SingleNavItem: FC<IPros> = ({ title, selected, id, onClickCallback }) => {
  const tabStyle = () => {
    return selected === id
      ? "bg-blue-400 py-2 px-10 text-white hover:text-gray-300 rounded-full focus:outline-none m-1"
      : "py-2 px-10 hover:text-indigo-700 hover:bg-blue-100 rounded-full focus:outline-none m-1";
  };

  const tabClickCallback = useCallback(() => {
    onClickCallback(id);
  }, [id, onClickCallback]); // [title, selected, onClickCallback] : useCallback is basically a memoized function. It needs to know all references to variables the lambda has

  return (
    <button onClick={tabClickCallback} className={tabStyle()}>
      {title}
    </button>
  );
};

export default SingleNavItem;
