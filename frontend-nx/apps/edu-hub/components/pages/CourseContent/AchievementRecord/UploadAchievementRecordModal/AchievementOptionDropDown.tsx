import { ListItemText } from '@mui/material';
import Fade from '@mui/material/Fade';
import MaterialMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import { MinAchievementOption } from '../../../../../helpers/achievement';
import React, { FC, createElement, useCallback } from 'react';
import { AchievementOptionCourses_AchievementOptionCourse_AchievementOption } from '../../../../../graphql/__generated__/AchievementOptionCourses';

interface IProps {
  anchorElement: HTMLElement | undefined;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  courseAchievementOptions: MinAchievementOption[];
  callback: (item: AchievementOptionCourses_AchievementOptionCourse_AchievementOption) => void;
}

// Replace with styled
const StyledMenu = styled(MaterialMenu)(() => ({
  '& .MuiPaper-root': {
    minWidth: '225px',
    padding: '1rem 2rem',
  },
}));

export const AchievementOptionDropDown: FC<IProps> = ({
  anchorElement,
  isVisible,
  setVisible,
  courseAchievementOptions,
  callback,
}) => {
  const hideMenu = useCallback(() => setVisible(false), [setVisible]);
  const onOptionClick = useCallback(
    (data: AchievementOptionCourses_AchievementOptionCourse_AchievementOption) => {
      setVisible(false);
      callback(data);
    },
    [setVisible, callback]
  );

  return (
    <StyledMenu
      id="fade-menu"
      anchorEl={anchorElement}
      open={isVisible}
      onClose={hideMenu}
      TransitionComponent={Fade}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      {courseAchievementOptions.map((data, index) =>
        createElement('div', { key: `items-${index}` }, <SingleOption callback={onOptionClick} item={data} />)
      )}
    </StyledMenu>
  );
};

export default AchievementOptionDropDown;

interface IPropsSingleItem {
  callback: (data: MinAchievementOption) => void;
  item: MinAchievementOption;
}

const SingleOption: FC<IPropsSingleItem> = ({ callback, item }) => {
  const onOptionClick = useCallback(() => {
    callback(item);
  }, [callback, item]);

  return (
    <MenuItem onClick={onOptionClick}>
      <ListItemText primary={item.title} className="text" />
    </MenuItem>
  );
};
