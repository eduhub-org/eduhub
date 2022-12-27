import Link from "next/link";
import { FC } from "react";

interface IProps {
  currentTab: number;
  tabs: string[];
}

export const TabSelection: FC<IProps> = ({ currentTab, tabs }) => {
  let cols = "grid-cols-2";

  // Dynamically changing the grid cols class like `grid-cols-${tabs.length}` does not work
  // as the Tailwind JIT does not catch that and leave out the class in the compiled CSS.
  switch (tabs.length) {
    case 3:
      cols = "grid-cols-3";
      break;
    case 4:
      cols = "grid-cols-4";
      break;
    case 5:
      cols = "grid-cols-5";
      break;
    case 6:
      cols = "grid-cols-6";
      break;
  }

  return (
    <div className="flex">
      <div className={`w-full sm:w-auto grid ${cols} gap-x-4`}>
        {tabs.map((tab, index) => (
          <Link key={tab} href={`?tab=${index}`}>
            <div
              className={`flex flex-1 p-3 ${
                currentTab === index ? "bg-edu-green" : "bg-gray-100"
              } rounded items-center justify-center`}
            >
              <span className="text-sm font-semibold whitespace-nowrap">
                {tab}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
