import { FC, useCallback, useEffect, useState } from "react";
import { Programs_Program } from "../../queries/__generated__/Programs";
import { SelectOption } from "../../types/UIComponents";
import Searchbar from "../common/Searchbar";
import SingleNavItem from "../common/SingleNavItem";

interface IProps {
  programs: Programs_Program[];
  onClickTab: (tabId: number) => void;
  onSearch: (searchText: string) => void;
  selectedProgramId: number;
  previousSearchedTitle: string;
}

const HeaderOptions: FC<IProps> = ({
  programs,
  onClickTab,
  onSearch,
  selectedProgramId,
  previousSearchedTitle,
}) => {
  // Constants
  const ps: SelectOption[] = programs.map((program) => ({
    key: program.id,
    label: program.shortTitle ?? program.title,
  }));

  // We will just show latest Three and all, Ignore the Unknown id (0)
  const semestersForTabMenu: SelectOption[] =
    ps.length > 3 ? ps.slice(0, 3) : ps;
  semestersForTabMenu.push({
    key: -1, // id is null for all
    label: "All",
  });

  const [searchedTitle, setSearchedTitle] = useState(previousSearchedTitle);

  /* #region Callbacks */
  const handleTabClick = useCallback(
    (tabID: number) => {
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
                key={tab.key}
                id={tab.key}
                title={tab.label}
                onClickCallback={handleTabClick}
                selected={selectedProgramId}
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

export default HeaderOptions;
