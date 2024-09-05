import { FC, useCallback, useState } from 'react';
import { Button } from '@mui/material';
import { MdAddCircle } from 'react-icons/md';

import CommonPageHeader from '../../common/CommonPageHeader';
import SearchBox from '../../common/SearchBox';
import { ProgramsMenubar } from '../../layout/ProgramsMenubar';

import { useAdminMutation } from '../../../hooks/authedMutation';
import { INSERT_COURSE } from '../../../queries/mutateCourse';

import type { StaticComponentProperty } from '../../../types/UIComponents';
import type { Programs_Program } from '../../../queries/__generated__/Programs';
import type { Course_bool_exp } from '../../../__generated__/globalTypes';
import type {
  InsertCourseWithLocation,
  InsertCourseWithLocationVariables,
} from '../../../queries/__generated__/InsertCourseWithLocation';
import type { QueryResult } from '@apollo/client';
import type { AdminCourseList, AdminCourseListVariables } from '../../../queries/__generated__/AdminCourseList';
import { LocationOption_enum } from '../../../__generated__/globalTypes';

interface IProps {
  programs: Programs_Program[];
  defaultProgramId: number;
  courseListRequest: QueryResult<AdminCourseList, AdminCourseListVariables>;
  t: any;
  updateFilter: (newState: AdminCourseListVariables) => void;
  currentFilter: AdminCourseListVariables;
}

const CoursesHeader: FC<IProps> = ({
  programs,
  defaultProgramId,
  courseListRequest,
  t,
  updateFilter,
  currentFilter,
}) => {
  const [insertCourse] = useAdminMutation<InsertCourseWithLocation, InsertCourseWithLocationVariables>(INSERT_COURSE);
  const selectedProgramId = currentFilter.where.programId?._eq;
  const selectedProgram = programs.find((program) => program.id === selectedProgramId);

  const insertDefaultCourse = useCallback(async () => {
    await insertCourse({
      variables: {
        title: t('course-page:default-course-title'),
        // applicationEnd: new Date(),
        applicationEnd:
          selectedProgram?.defaultApplicationEnd && new Date(selectedProgram.defaultApplicationEnd) > new Date()
            ? selectedProgram.defaultApplicationEnd
            : new Date(),
        maxMissedSessions: 2,
        programId: selectedProgramId,
        locationOption: LocationOption_enum.ONLINE,
      },
    });

    courseListRequest.refetch();
  }, [selectedProgram.defaultApplicationEnd, selectedProgramId, insertCourse, t, courseListRequest]);

  return (
    <>
      <CommonPageHeader headline={t('coursesHeadline')} />
      <Menubar
        t={t}
        programs={programs}
        defaultProgramId={defaultProgramId}
        courseListRequest={courseListRequest}
        updateFilter={updateFilter}
        currentFilter={currentFilter}
      />
      <div className="flex justify-start mt-8  text-white">
        <Button onClick={insertDefaultCourse} startIcon={<MdAddCircle />} color="inherit">
          {t('course-page:add-course')}
        </Button>
      </div>
    </>
  );
};
export default CoursesHeader;

const convertToILikeFilter = (input: string) => `%${input}%`;
const createWhereClauseForCourse = (courseTitle: string, programId: number): Course_bool_exp => {
  if (courseTitle.trim().length === 0 && programId < 0) {
    return {};
  }
  if (courseTitle.trim().length === 0 && programId >= 0) {
    return { programId: { _eq: programId } };
  }
  if (courseTitle.trim().length > 0 && programId < 0) {
    return { title: { _ilike: convertToILikeFilter(courseTitle) } };
  }
  return {
    _and: [{ title: { _ilike: convertToILikeFilter(courseTitle) } }, { programId: { _eq: programId } }],
  };
};

interface IMenubarProps extends IProps {
  t: any;
}
const Menubar: FC<IMenubarProps> = ({ t, programs, defaultProgramId, courseListRequest, updateFilter }) => {
  const allTabId = -1;
  const maxMenuCount = 3;
  const [searchedTitle, setSearchedTitle] = useState('');
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
        ...courseListRequest.variables,
        where: createWhereClauseForCourse(searchedTitle, property.key),
        offset: 0, // Because, we need to reinitiate the offset from the beginning
      });
      setProgramID(property.key);
    },
    [updateMenuBar, setProgramID, searchedTitle, courseListRequest, updateFilter]
  );

  const searchOnTitleCallback = useCallback(
    (text: string) => {
      updateFilter({
        ...courseListRequest.variables,
        where: createWhereClauseForCourse(text, programID),
      });
      setSearchedTitle(text);
    },
    [courseListRequest, setSearchedTitle, programID, updateFilter]
  );

  /* #region */
  return (
    <div className="flex justify-between mb-5 text-white">
      <ProgramsMenubar programs={programs} defaultProgramId={defaultProgramId} onTabClicked={handleTabClick} />
      <SearchBox
        placeholder={t('courseSearchPlaceholder')}
        onChangeCallback={searchOnTitleCallback}
        searchText={searchedTitle}
      />
    </div>
  );
};
