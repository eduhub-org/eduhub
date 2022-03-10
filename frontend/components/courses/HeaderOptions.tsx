import { FC, useCallback, useEffect, useState } from "react";
import { useAdminQuery } from "../../hooks/authedQuery";
import { PROGRAM_LIST } from "../../queries/programList";
import { ProgramList } from "../../queries/__generated__/ProgramList";
import { SelectOption } from "../../types/UIComponents";
import ModalControl from "../common/ModalController";
import Searchbar from "../common/Searchbar";
import SingleNavItem from "../common/SingleNavItem";
import AddCourseForm from "./AddCourseForm";

const CourseListHeader: FC = () => {
  // constants
  const [selectedTab, setSelectedTab] = useState("0");
  const [searchedTitle, setSearchedTitle] = useState("");
  const [showModal, setShowModal] = useState(false);

  // CallBacks
  const handleTabClick = useCallback(
    (tabTitle) => {
      console.log(tabTitle);
      setSelectedTab(tabTitle);
    },
    [setSelectedTab]
  );

  const searchOnTitleCallback = useCallback(
    (text: string) => {
      console.log(text);
      setSearchedTitle(text);
    },
    [setSearchedTitle]
  );

  const handleAddCourse = useCallback(
    (show: boolean) => {
      setShowModal(show);
    },
    [setShowModal]
  );

  const openModalControl = useCallback(() => {
    setShowModal(!showModal);
  }, [showModal, setShowModal]);

  // Make the database call here, if needed, Not above :)
  const qResult = useAdminQuery<ProgramList>(PROGRAM_LIST); // Load Program list from db
  if (qResult.loading) {
    return <h2>Loading</h2>;
  }

  if (qResult.error) {
    return null;
  }
  // Prepare Program List for the UI
  const ps = [...(qResult?.data?.Program || [])];
  ps.sort((a, b) => {
    return b.id - a.id;
  });
  const programs: SelectOption[] = ps.map((program) => ({
    value: program.id.toString(),
    label: program.shortTitle ?? program.title,
  }));

  // Somehow problematic

  // if (programs.length > 0) setSelectedTab(programs[0].value)

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
            {programs.map(
              (tab, index) =>
                // We will just show latest three and all
                (index === programs.length - 1 || index < 4) && (
                  <SingleNavItem
                    key={tab.value}
                    id={tab.value}
                    title={tab.label}
                    onClickCallback={handleTabClick}
                    selected={selectedTab}
                  />
                )
            )}
          </div>
          <Searchbar
            placeholder="Text in Title"
            onChangeCallback={searchOnTitleCallback}
            searchText={searchedTitle}
          />
        </div>
        <div className="bg-white py-4 flex justify-end">
          <button
            onClick={openModalControl}
            className="mt-4 sm:mt-0 flex items-start justify-start px-6 py-3 bg-indigo-700 hover:bg-indigo-600 focus:outline-none rounded"
          >
            <p className="text-sm font-medium leading-none text-white">
              Add Course
            </p>
          </button>
        </div>
      </div>
      <ModalControl
        modalTitle="Kurs hinzufügen"
        onClose={handleAddCourse}
        showModal={showModal}
      >
        <AddCourseForm semesters={programs} />
      </ModalControl>
    </>
  );
};

export default CourseListHeader;
