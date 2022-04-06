import { TFunction } from "next-i18next";
import { FC, useCallback, useState } from "react";
import { SelectOption } from "../../../types/UIComponents";
import CourseList from "./CourseList";
import Sidebar from "./Sidebar";

interface IProps {
  t: TFunction;
}
const Dashboard: FC<IProps> = ({ t }) => {
  // TODO: Come up with Valid Category
  const sidebarItems: SelectOption[] = [
    { key: 0, label: "All Programs" },
    { key: 1, label: "Tech" },
    { key: 2, label: "Business" },
    { key: 3, label: "Creative" },
    { key: 4, label: "Programmieren" },
  ];

  const [selected, setSelected] = useState(sidebarItems[0]);

  /* #region Callbacks */
  const handleMenuClick = useCallback(
    (key: SelectOption) => {
      setSelected(key);
    },
    [setSelected]
  );
  /* #endregion */

  return (
    <>
      <div className="pt-10">
        <p className="text-base sm:text-lg lg:text-3xl leading-normal text-edu-modal-bg-color">
          {t("headline")}
        </p>
      </div>
      <div className="flex flex-row py-10">
        <div className="w-3/12 min-h-[50vh]">
          <Sidebar
            handleMenuSelection={handleMenuClick}
            selectedItem={selected}
            sidebarItems={sidebarItems}
          />
        </div>
        <div className="w-9/12 p-4">
          {<CourseList selectedOption={selected} />}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
