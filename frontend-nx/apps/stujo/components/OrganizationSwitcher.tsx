import { ChangeEvent, FC, useCallback } from 'react';

import type { EmployerOrganization } from '../lib/useEmployerOrganization';

interface Props {
  organizations: EmployerOrganization[];
  selectedId: number;
  label: string;
  onSelect: (id: number) => void;
  /**
   * 'block' (default): stacked caption above a full-width select, used on
   * /mein-stujo/neu. 'inline': the select *is* the company name inside the
   * dashboard identity row, so its caption is for assistive tech only.
   */
  variant?: 'block' | 'inline';
}

/**
 * Company picker for users who may post jobs for more than one organization.
 * Callers render it only in that case — with a single organization the screens
 * show its name as plain text instead.
 */
const OrganizationSwitcher: FC<Props> = ({
  organizations,
  selectedId,
  label,
  onSelect,
  variant = 'block',
}) => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onSelect(Number(event.target.value)),
    [onSelect]
  );

  return (
    <label
      className={
        variant === 'inline' ? 'stujo-org-switcher stujo-org-switcher--inline' : 'stujo-org-switcher'
      }
    >
      <span className={variant === 'inline' ? 'stujo-visually-hidden' : 'stujo-muted'}>{label}</span>
      <select value={selectedId} onChange={handleChange}>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default OrganizationSwitcher;
