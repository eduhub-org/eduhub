import { FC, useCallback, useState } from "react";
import { Programs_Program } from "../../queries/__generated__/Programs";
import { CourseListFilterOptions } from "../../types/UIComponents";
import EhAddButton from "../common/EhAddButton";
import ModalControl from "../common/ModalController";
import AddCourseDataLoaderUI from "./AddCourseDataLoaderUI";
import HeaderOptions from "./HeaderOptions";

interface IProps {
  programs: Programs_Program[];
  refetchCourseList: () => void;
  filterOptions: CourseListFilterOptions;
  onTabClicked: (tab: number) => void;
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
  // const handleSemesterTabClick = useCallback(
  //   (tabID: number) => {
  //     onTabClicked(tabID);
  //   },
  //   [onTabClicked]
  // );

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

  const onSavedCourseCallback = useCallback(() => {
    refetchCourseList();
    setShowModal(false);
  }, [setShowModal, refetchCourseList]);
  /* #endregion */

  return (
    <>
      <HeaderOptions
        programs={programs}
        onClickTab={onTabClicked}
        onSearch={handleSearchInCourseTitle}
        selectedProgramId={filterOptions.programId}
        previousSearchedTitle={filterOptions.courseTitle}
      />
      <div className="bg-white py-4 flex justify-end">
        <EhAddButton buttonClickCallBack={openModalControl} text={ADD_COURSE} />
      </div>
      <ModalControl
        modalTitle={titleOfAddCourseUI}
        onClose={onCloseAddCourseWindow}
        showModal={showModal}
      >
        <AddCourseDataLoaderUI
          programs={programs}
          refetchCourseList={onSavedCourseCallback}
        />
      </ModalControl>
    </>
  );
};

export default CourseListHeader;
