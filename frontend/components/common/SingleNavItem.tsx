import { FC, useCallback } from "react";

interface IPros {
  title: string;
  selected: string;
  onClickCallback: (p: string) => any;
}

const SingleNavItem: FC<IPros> = ({ title, selected, onClickCallback }) => {
  const tabStyle = () => {
    return selected === title
      ? "py-2 px-8 bg-indigo-100 text-indigo-700 rounded-full"
      : "py-2 px-8 text-gray-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-full";
  };

  const tabClickCallback = useCallback(() => {
    onClickCallback(title);
  }, [title, onClickCallback]); // [title, selected, onClickCallback] : useCallback is basically a memoized function. It needs to know all references to variables the lambda has

  return (
    <a
      onClick={tabClickCallback}
      className="rounded-full focus:outline-none focus:ring-2  focus:bg-indigo-50 focus:ring-indigo-800 mr-2"
    >
      <div className={tabStyle()}>
        <p>{title}</p>
      </div>
    </a>
  );
};

export default SingleNavItem;
