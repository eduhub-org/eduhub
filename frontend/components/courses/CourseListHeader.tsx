import { FC, useCallback, useState } from "react";
import { Programs_Program } from "../../queries/__generated__/Programs";
import { CourseListFilterOptions } from "../../types/UIComponents";
import EhAddButton from "../common/EhAddButton";
import ModalControl from "../common/ModalController";
import AddCourseForm from "./AddCourseForm";
import HeaderOptions from "./HeaderOptions";

interface IProps {
  programs: Programs_Program[];
  refetchCourseList: () => void;
  filterOptions: CourseListFilterOptions;
  onTabClicked: (tab: string) => void;
  onSearchTitle: (text: string) => void;
}

const CourseListHeader: FC<IProps> = ({
  programs,
  refetchCourseList,
  filterOptions,
  onTabClicked,
  onSearchTitle,
}) => {
  const ADD_COURSE = "Add Course";
  const titleOfAddCourseUI = "Kurs hinzufügen";
  // State variables
  const [showModal, setShowModal] = useState(false);

  /* #region callbacks */
  const handleSemesterTabClick = useCallback(
    (tabID: string) => {
      onTabClicked(tabID);
    },
    [onTabClicked]
  );

  const handleSearchInCourseTitle = useCallback(
    (searchedText: string) => {
      onSearchTitle(searchedText);
    },
    [onSearchTitle]
  );

  const openModalControl = useCallback(() => {
    setShowModal(!showModal);
  }, [showModal, setShowModal]);

  const onCloseAddCourseWindow = useCallback(
    (show: boolean) => {
      setShowModal(show);
    },
    [setShowModal]
  );

  const onSavedCourseCallback = useCallback(
    (onsuccess: boolean) => {
      if (onsuccess) {
        refetchCourseList();
      }
      setShowModal(false);
    },
    [setShowModal, refetchCourseList]
  );
  /* #endregion */

  return (
    <>
      <HeaderOptions
        programs={programs}
        onClickTab={handleSemesterTabClick}
        onSearch={handleSearchInCourseTitle}
        selectedSemester={filterOptions.programShortTitle}
      />
      <div className="bg-white py-4 flex justify-end">
        <EhAddButton buttonClickCallBack={openModalControl} text={ADD_COURSE} />
      </div>
      <ModalControl
        modalTitle={titleOfAddCourseUI}
        onClose={onCloseAddCourseWindow}
        showModal={showModal}
      >
        <AddCourseForm
          programs={programs}
          onSavedCourse={onSavedCourseCallback}
        />
      </ModalControl>
    </>
  );
};

export default CourseListHeader;
