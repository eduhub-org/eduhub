import { FC } from "react";

interface IProps {
  filled?: boolean;
}

export const Button: FC<IProps> = ({ children, filled }) => {
  return (
    <span
      className={`px-6 py-2 border-2 border-edu-black rounded-full items-center ${
        filled ? "bg-edu-black text-white" : "text-edu-black"
      }`}
    >
      {children}
    </span>
  );
};
