import { FC, useCallback, useMemo } from 'react';
import { Programs_Program } from '../../queries/__generated__/Programs';
import { StaticComponentProperty } from '../../types/UIComponents';
import MenuItem from '../common/MenuItem';

interface IMenubarProps {
  programs: Programs_Program[];
  defaultProgramId: number;
  onTabClicked: (menuItem: StaticComponentProperty) => void;
  currentSelectedId?: number; // Add current selection prop
}

export const ProgramsMenubar: FC<IMenubarProps> = ({ programs, defaultProgramId, onTabClicked, currentSelectedId }) => {
  // Use currentSelectedId if provided, otherwise fall back to defaultProgramId
  const selectedId = currentSelectedId ?? defaultProgramId;

  // Compute menu items based on current selection (no internal state)
  const menuItems: StaticComponentProperty[] = useMemo(() => {
    return programs.map((p) => ({
      key: p.id,
      label: p.shortTitle ?? p.title,
      selected: p.id === selectedId,
    }));
  }, [programs, selectedId]);

  const handleTabClick = useCallback(
    (property: StaticComponentProperty) => {
      onTabClicked(property);
    },
    [onTabClicked]
  );

  return (
    <div className="flex items-center space-x-0 flex-wrap">
      {menuItems.map((tab) => (
        <MenuItem key={tab.key} property={tab} onClickCallback={handleTabClick} />
      ))}
    </div>
  );
};
