import { FC, useCallback, useState } from "react";
import Searchbar from "../common/Searchbar";
import SingleNavItem from "../common/SingleNavItem";
interface IPros {
  semesters: string[];
}

const CourseListHeader: FC<IPros> = ({ semesters }) => {
  // constants
  const [selectedTab, setSelectedTab] = useState(semesters[0]);
  const [searchedTitle, setSearchedTitle] = useState("");

  // Single Tab helper
  const handleTabClick = useCallback(
    (tabTitle) => {
      setSelectedTab(tabTitle);
    },
    [setSelectedTab]
  );

  // Searchbar helpers
  const searchOnTitleCallback = useCallback(
    (text: string) => {
      console.log(text);
      setSearchedTitle(text);
    },
    [setSearchedTitle]
  );

  return (
    <>
      <div className="px-4 md:px-10 py-4 md:py-7">
        <div className="flex items-center justify-between">
          <p className="focus:outline-none text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-normal text-gray-800">
            Kurse
          </p>
        </div>
      </div>
      <div className="bg-white py-4 md:py-7 px-4 md:px-8 xl:px-10">
        <div className="sm:flex items-center justify-between">
          <div className="flex items-center">
            {semesters.map((tab) => (
              <SingleNavItem
                key={tab}
                title={tab}
                onClickCallback={handleTabClick}
                selected={selectedTab}
              />
            ))}
          </div>
          <Searchbar
            placeholder="Text in Title"
            onChangeCallback={searchOnTitleCallback}
            searchText={searchedTitle}
          />
        </div>
        <div className="bg-white py-4 flex justify-end">
          <button className="mt-4 sm:mt-0 flex items-start justify-start px-6 py-3 bg-indigo-700 hover:bg-indigo-600 focus:outline-none rounded">
            <p className="text-sm font-medium leading-none text-white">
              Add Course
            </p>
          </button>
        </div>
      </div>
    </>
  );
};

export default CourseListHeader;
