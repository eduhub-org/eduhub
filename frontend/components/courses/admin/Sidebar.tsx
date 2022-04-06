import { FC } from "react";
import { SelectOption } from "../../../types/UIComponents";
import SidebarMenuItem from "./SidebarMenueItem";

interface IProps {
  sidebarItems: SelectOption[];
  selectedItem: SelectOption;
  handleMenuSelection: (obj: SelectOption) => void;
}
const Sidebar: FC<IProps> = ({
  selectedItem,
  sidebarItems,
  handleMenuSelection,
}) => {
  return (
    <>
      <ul className="absolute">
        {sidebarItems.map((option) => (
          <SidebarMenuItem
            key={option.key}
            object={option}
            selectedOption={selectedItem}
            onClickHandler={handleMenuSelection}
          />
        ))}
      </ul>
    </>
  );
};

export default Sidebar;
