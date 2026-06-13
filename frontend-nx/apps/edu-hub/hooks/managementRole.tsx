import { createContext, useContext, FC, ReactNode } from 'react';

import { AuthRoles } from '../types/enums';
import { useManageRole } from './authentication';

// Effective role for the organization-management area. Undefined outside a provider.
const ManagementRoleContext = createContext<AuthRoles | undefined>(undefined);

// Provides the management role (admin for super-admins, org_admin otherwise) to all descendants.
// Mounted around the /manage/* screens so nested data-editing widgets (CheckboxSelector, InputField,
// DatePicker, DropDownSelector, TableGrid delete, ...) issue their queries/mutations under the right
// role without each one re-deriving it or needing a role prop drilled in. The role-aware hooks
// (useRoleQuery / useRoleMutation / useFlexibleMutation) read this context and prefer it over the
// current session role. Outside a provider the context is undefined and those hooks fall back to the
// session role, so all non-management usage is unchanged. An explicit `role` passed to a hook still
// wins over the context.
export const ManagementRoleProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const role = useManageRole();
  return <ManagementRoleContext.Provider value={role}>{children}</ManagementRoleContext.Provider>;
};

export const useManagementRoleContext = (): AuthRoles | undefined => useContext(ManagementRoleContext);
