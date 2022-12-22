import { ListItemText } from "@material-ui/core";
import Fade from "@material-ui/core/Fade";
import MaterialMenu, { MenuProps } from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import React, { FC, createElement, useCallback } from "react";
import { AchievementOptionCourses_AchievementOptionCourse } from "../../queries/__generated__/AchievementOptionCourses";

interface IProps {
  anchorElement: HTMLElement | undefined;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  courseAchievementOptions: AchievementOptionCourses_AchievementOptionCourse[];
  callback: (item: AchievementOptionCourses_AchievementOptionCourse) => void;
}

const StyledMenu = withStyles({
  paper: {
    minWidth: "225px",
    padding: "1rem 2rem",
  },
})((props: MenuProps) => (
  <MaterialMenu
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
));

export const AchievementOptionDropDown: FC<IProps> = ({
  anchorElement,
  isVisible,
  setVisible,
  courseAchievementOptions,
  callback,
}) => {
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);
  const onOptionClick = useCallback(
    (data: AchievementOptionCourses_AchievementOptionCourse) => {
      setVisible(false);
      callback(data);
    },
    [setVisible, callback]
  );

  return (
    <StyledMenu
      id="fade-menu"
      anchorEl={anchorElement}
      // keepMounted
      open={isVisible}
      onClose={hideMenu}
      TransitionComponent={Fade}
      className="min-w-full"
    >
      {courseAchievementOptions.map((data, index) =>
        createElement(
          "div",
          { key: `items-${index}` },
          <SingleOption callback={onOptionClick} item={data} />
        )
      )}
    </StyledMenu>
  );
};

export default AchievementOptionDropDown;
interface IPropsSingleItem {
  callback: (data: AchievementOptionCourses_AchievementOptionCourse) => void;
  item: AchievementOptionCourses_AchievementOptionCourse;
}
const SingleOption: FC<IPropsSingleItem> = (option) => {
  const onOptionClick = useCallback(() => {
    option.callback(option.item);
  }, [option]);
  return (
    <MenuItem onClick={onOptionClick}>
      <ListItemText
        primary={option.item.AchievementOption.title}
        className="text"
      />
    </MenuItem>
  );
};
