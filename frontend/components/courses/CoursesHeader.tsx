import { QueryResult } from "@apollo/client";
import { TFunction, useTranslation } from "next-i18next";
import { FC, useCallback, useState } from "react";
import { AdminCourseListVariables } from "../../queries/__generated__/AdminCourseList";
import { Programs_Program } from "../../queries/__generated__/Programs";
import { StaticComponentProperty } from "../../types/UIComponents";
import { Course_bool_exp } from "../../__generated__/globalTypes";
import CommonPageHeader from "../common/CommonPageHeader";
import EhAddButton from "../common/EhAddButton";
import EhMenuItem from "../common/EhMenuItem";
import ModalControl from "../common/ModalController";
import Searchbar from "../common/Searchbar";
import AddCourseForm from "./AddCourseForm";

interface IProps {
  programs: Programs_Program[];
  defaultProgramId: number;
  courseListRequest: any;
  t: TFunction;
  updateFilter: (newState: AdminCourseListVariables) => void;
}

const CoursesHeader: FC<IProps> = ({
  programs,
  defaultProgramId,
  courseListRequest,
  t,
  updateFilter,
}) => {
  const [showModal, setShowModal] = useState(false);

  const openModalControl = useCallback(() => {
    setShowModal(!showModal);
  }, [showModal, setShowModal]);

  const onCloseAddCourseWindow = useCallback(
    (show: boolean) => {
      setShowModal(show);
    },
    [setShowModal]
  );
  const closeModalHandler = useCallback(
    (refetch: boolean) => {
      setShowModal(false);
      if (refetch) {
        courseListRequest.refetch();
      }
    },
    [setShowModal, courseListRequest]
  );

  return (
    <>
      <CommonPageHeader headline={t("coursesHeadline")} />
      <Menubar
        t={t}
        programs={programs}
        defaultProgramId={defaultProgramId}
        courseListRequest={courseListRequest}
        updateFilter={updateFilter}
      />
      <div className="bg-white pb-10 flex justify-end">
        <EhAddButton
          buttonClickCallBack={openModalControl}
          text={t("addCourseText")}
        />
      </div>
      <ModalControl
        modalTitle={t("addCourseFormTitle")}
        onClose={onCloseAddCourseWindow}
        showModal={showModal}
      >
        <AddCourseForm
          defaultProgramId={defaultProgramId}
          programs={programs}
          closeModalHandler={closeModalHandler}
        />
      </ModalControl>
    </>
  );
};
export default CoursesHeader;

const convertToILikeFilter = (input: string) => `%${input}%`;
const createWhereClauseForCourse = (
  courseTitle: string,
  programId: number
): Course_bool_exp => {
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
    _and: [
      { title: { _ilike: convertToILikeFilter(courseTitle) } },
      { programId: { _eq: programId } },
    ],
  };
};

interface IMenubarProps extends IProps {
  t: TFunction;
}
const Menubar: FC<IMenubarProps> = ({
  t,
  programs,
  defaultProgramId,
  courseListRequest,
  updateFilter,
}) => {
  const allTabId = -1;
  const maxMenuCount = 3;
  const [searchedTitle, setSearchedTitle] = useState("");
  const [programID, setProgramID] = useState(defaultProgramId);
  // We will just show latest Three and all, Ignore the Unknown id (0)
  const customPrograms =
    programs.length > maxMenuCount ? programs.slice(0, maxMenuCount) : programs;
  const semesters: StaticComponentProperty[] = customPrograms.map((p) => {
    return {
      key: p.id,
      label: p.shortTitle ?? p.title,
      selected: p.id === defaultProgramId,
    };
  });
  semesters.push({
    key: allTabId,
    label: "All",
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
        offset: 0, // Because, we need to reinitiate the offset from the begining
      });
      setProgramID(property.key);
    },
    [
      updateMenuBar,
      setProgramID,
      searchedTitle,
      courseListRequest,
      updateFilter,
    ]
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
    <div className="flex justify-between mb-5">
      <div className="flex items-center space-x-5">
        {menuItems.map((tab) => (
          <EhMenuItem
            key={tab.key}
            property={tab}
            onClickCallback={handleTabClick}
          />
        ))}
      </div>
      <Searchbar
        placeholder={t("courseSearchPlaceholder")}
        onChangeCallback={searchOnTitleCallback}
        searchText={searchedTitle}
      />
    </div>
  );
};
