import { FC } from "react";

interface IProps {
  filled?: boolean;
  onClick?: () => void;
}

export const Button: FC<IProps> = ({ children, filled, onClick }) => {
  return (
    <span
      className={`px-6 py-2 border-2 border-edu-black rounded-full items-center ${
        filled ? "bg-edu-black text-white" : "text-edu-black"
      }`}
      onClick={onClick}
    >
      {children}
    </span>
  );
};
