import { FC, useCallback, useState } from 'react';
import { Programs_Program } from '../queries/__generated__/Programs';
import { StaticComponentProperty } from '../types/UIComponents';
import EhMenuItem from './common/EhMenuItem';

interface IMenubarProps {
  programs: Programs_Program[];
  defaultProgramId: number;
  onTabClicked: (menuItem: StaticComponentProperty) => void;
}

export const ProgramsMenubar: FC<IMenubarProps> = ({
  programs,
  defaultProgramId,
  onTabClicked,
}) => {
  // const allTabId = -1;
  // const maxMenuCount = 3;
  // We will just show latest Three and all, Ignore the Unknown id (0)
  // const customPrograms =
  //   programs.length > maxMenuCount ? programs.slice(0, maxMenuCount) : programs;
  //TODO : Fix the problem, new fields added, lectureStart, lectureEnd, achievementRecordUploadDeadline, visibility
  // customPrograms.push({
  //   id: allTabId,
  //   shortTitle: "All",
  //   title: "All",
  //   __typename: "Program",
  // });
  // const customPrograms = programs;

  // customPrograms.push({
  //   id: allTabId,
  //   shortTitle: 'All',
  //   title: 'All',
  //   __typename: 'Program',
  //   lectureStart: new Date(),
  //   lectureEnd: new Date(),
  //   achievementRecordUploadDeadline: new Date(),
  //   published: true,
  // });
  const semesters: StaticComponentProperty[] = programs.map((p) => {
    return {
      key: p.id,
      label: p.shortTitle ?? p.title,
      selected: p.id === defaultProgramId,
    };
  });

  const [menuItems, setMenuItems] = useState(semesters);

  /* #region Callbacks */
  const updateMenuBar = useCallback(
    (selected: StaticComponentProperty) => {
      const newItems = menuItems.map((item) => {
        if (selected.key === item.key) return { ...item, selected: true };
        return { ...item, selected: false };
      });
      setMenuItems(newItems);
    },
    [menuItems, setMenuItems]
  );
  const handleTabClick = useCallback(
    (property: StaticComponentProperty) => {
      updateMenuBar(property);
      onTabClicked(property);
    },
    [updateMenuBar, onTabClicked]
  );

  /* #region */
  return (
    <div className="flex items-center space-x-0 flex-wrap">
      {menuItems.map((tab) => (
        <EhMenuItem
          key={tab.key}
          property={tab}
          onClickCallback={handleTabClick}
        />
      ))}
    </div>
  );
};
