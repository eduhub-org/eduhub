import { FC, useCallback, useEffect, useState } from "react";
import { ProgramListNoCourse_Program } from "../../queries/__generated__/ProgramListNoCourse";
import { SelectOption } from "../../types/UIComponents";
import Searchbar from "../common/Searchbar";
import SingleNavItem from "../common/SingleNavItem";

interface IProps {
  programs: ProgramListNoCourse_Program[];
  onClickTab: (tabId: string) => void;
  onSearch: (searchText: string) => void;
  selectedSemester: string;
}

const CourseListHeader: FC<IProps> = ({
  programs,
  onClickTab,
  onSearch,
  selectedSemester,
}) => {
  // Constants
  const ps: SelectOption[] = programs.map((program) => ({
    value: program.shortTitle ? program.shortTitle.toString() : "",
    label: program.shortTitle ?? program.title,
  }));

  // We will just show latest Three and all, Ignore the Unknown id (0)
  const semestersForTabMenu: SelectOption[] =
    ps.length > 3 ? ps.slice(0, 3) : ps;
  semestersForTabMenu.push({
    value: "", // id is null for all
    label: "All",
  });

  const [searchedTitle, setSearchedTitle] = useState("");

  /* #region Callbacks */
  const handleTabClick = useCallback(
    (tabID) => {
      // setSelectedTab(tabID);
      onClickTab(tabID);
    },
    [onClickTab]
  );

  const searchOnTitleCallback = useCallback(
    (text: string) => {
      setSearchedTitle(text);
      onSearch(text);
    },
    [setSearchedTitle, onSearch]
  );

  /* #endregion */

  return (
    <div className="">
      <div className="py-5">
        <p className="focus:outline-none text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-normal text-gray-800">
          Kurse
        </p>
      </div>
      <div className="">
        <div className="flex justify-between">
          <div className="flex items-center">
            {semestersForTabMenu.map((tab) => (
              <SingleNavItem
                key={tab.value}
                id={tab.value}
                title={tab.label}
                onClickCallback={handleTabClick}
                selected={selectedSemester}
              />
            ))}
          </div>
          <Searchbar
            placeholder="Text in Title"
            onChangeCallback={searchOnTitleCallback}
            searchText={searchedTitle}
          />
        </div>
      </div>
    </div>
  );
};

export default CourseListHeader;
