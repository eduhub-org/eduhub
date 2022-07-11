import { FC } from "react";

export const Footer: FC = () => {
  return (
    <footer className="flex flex-col w-full p-6 bg-rsa-black text-white">
      <div className="flex justify-between items-center">
        <span className="text-sm font-light">©2022</span>
      </div>
    </footer>
  );
};
