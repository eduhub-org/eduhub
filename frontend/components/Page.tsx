import React, { FC } from "react";

export const Page: FC = ({ children }) => {
  return (
    <>
      <main className="flex-column items-center">
        <div className="flex max-w-screen-xl mx-auto border-2">{children}</div>
      </main>
    </>
  );
};
