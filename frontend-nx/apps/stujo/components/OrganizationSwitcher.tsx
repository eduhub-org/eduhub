import { ChangeEvent, FC, useCallback } from 'react';

import type { EmployerOrganization } from '../lib/useEmployerOrganization';

interface Props {
  organizations: EmployerOrganization[];
  selectedId: number;
  label: string;
  onSelect: (id: number) => void;
}

/**
 * Company picker for users who may post jobs for more than one organization.
 * Callers render it only in that case — with a single organization the screens
 * show its name as plain text instead.
 */
const OrganizationSwitcher: FC<Props> = ({ organizations, selectedId, label, onSelect }) => {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onSelect(Number(event.target.value)),
    [onSelect]
  );

  return (
    <label className="stujo-org-switcher">
      <span className="stujo-muted">{label}</span>
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
