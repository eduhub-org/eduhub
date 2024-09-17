import { ListItemText } from '@mui/material';
import Fade from '@mui/material/Fade';
import MaterialMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import { FragmentType, useFragment } from '../../../../../types/generated';
import { ACHIEVEMENT_OPTION_FRAGMENT } from '../../../../../graphql/fragments/achievementOptionFragment';
import React, { FC, createElement, useCallback } from 'react';

interface IProps {
  anchorElement: HTMLElement | undefined;
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  courseAchievementOptions: FragmentType<typeof ACHIEVEMENT_OPTION_FRAGMENT>[];
  callback: (item: FragmentType<typeof ACHIEVEMENT_OPTION_FRAGMENT>) => void;
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
    (data: FragmentType<typeof ACHIEVEMENT_OPTION_FRAGMENT>) => {
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
  callback: (data: FragmentType<typeof ACHIEVEMENT_OPTION_FRAGMENT>) => void;
  item: FragmentType<typeof ACHIEVEMENT_OPTION_FRAGMENT>;
}

const SingleOption: FC<IPropsSingleItem> = ({ callback, item }) => {
  const onOptionClick = useCallback(() => {
    callback(item);
  }, [callback, item]);

  const unmaskedItem = useFragment(ACHIEVEMENT_OPTION_FRAGMENT, item);

  return (
    <MenuItem onClick={onOptionClick}>
      <ListItemText primary={unmaskedItem.title} className="text" />
    </MenuItem>
  );
};
