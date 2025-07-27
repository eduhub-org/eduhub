import { FC, useCallback, useState } from 'react';

import CommonPageHeader from '../../common/CommonPageHeader';
import { ProgramsMenubar } from '../../layout/ProgramsMenubar';

import type { StaticComponentProperty } from '../../../types/UIComponents';
import type { Programs_Program } from '../../../queries/__generated__/Programs';
import type { AdminCourseListVariables } from '../../../queries/__generated__/AdminCourseList';

interface IProps {
  programs: Programs_Program[];
  defaultProgramId: number;
  t: any;
  updateFilter: (newState: AdminCourseListVariables) => void;
  currentFilter: AdminCourseListVariables;
}

const CoursesHeader: FC<IProps> = ({ programs, defaultProgramId, t, updateFilter, currentFilter }) => {
  return (
    <>
      <CommonPageHeader headline={t('coursesHeadline')} />
      <Menubar
        t={t}
        programs={programs}
        defaultProgramId={defaultProgramId}
        updateFilter={updateFilter}
        currentFilter={currentFilter}
      />
    </>
  );
};
export default CoursesHeader;

interface IMenubarProps {
  t: any;
  programs: Programs_Program[];
  defaultProgramId: number;
  updateFilter: (newState: AdminCourseListVariables) => void;
  currentFilter: AdminCourseListVariables;
}

const Menubar: FC<IMenubarProps> = ({ t, programs, defaultProgramId, updateFilter, currentFilter }) => {
  const allTabId = -1;
  const maxMenuCount = 3;
  const [programID, setProgramID] = useState(defaultProgramId);
  // We will just show latest Three and all, Ignore the Unknown id (0)
  const customPrograms = programs.length > maxMenuCount ? programs.slice(0, maxMenuCount) : programs;
  const semesters: StaticComponentProperty[] = customPrograms.map((p) => {
    return {
      key: p.id,
      label: p.shortTitle ?? p.title,
      selected: p.id === defaultProgramId,
    };
  });
  semesters.push({
    key: allTabId,
    label: 'All',
    selected: false,
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
      updateFilter({
        ...currentFilter,
        where: property.key === allTabId ? {} : { programId: { _eq: property.key } },
        offset: 0, // Because, we need to reinitiate the offset from the beginning
      });
      setProgramID(property.key);
    },
    [updateMenuBar, setProgramID, currentFilter, updateFilter, allTabId]
  );

  /* #region */
  return (
    <div className="flex justify-start mb-5 text-white">
      <ProgramsMenubar programs={programs} defaultProgramId={defaultProgramId} onTabClicked={handleTabClick} />
    </div>
  );
};
