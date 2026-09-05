import {
  AdminUserList_User,
  AdminUserList_User_OrganizationAdmins,
} from '../../../queries/__generated__/AdminUserList';
import { AdminPrivilege, grantHasPrivilege } from './adminPrivileges';

/**
 * One row of the access table: a person's admin rights for ONE organization, so a person who
 * administers three organizations occupies three rows and each row's delete control refers to a
 * single organization.
 *
 * A super-admin who administers no organization gets one row without a grant — otherwise they
 * would be missing from the screen entirely, with no way to see or revoke the role.
 */
export type AdminAccessRow = {
  /**
   * Unique per row and stable across refetches: the grant id for an organization row, the user id
   * for a grantless super-admin row. Grant ids are integers and user ids are uuids, so the two
   * kinds can never collide. Typed loosely because TableGrid's BaseRow declares a numeric id while
   * this table has always been keyed by uuids.
   */
  id: any;
  user: AdminUserList_User;
  grant: AdminUserList_User_OrganizationAdmins | null;
  isSuperAdmin: boolean;
};

/**
 * Flattens the queried people into one row per administered organization, keeping a person's rows
 * adjacent (the query pages and sorts by person).
 *
 * `privilegeFilter` is applied a second time here, at row level: the database filter narrows the
 * people — a person passes when any of their rows could match — while this drops the rows that do
 * not carry the privilege themselves, so filtering by "can manage events" lists the event grants
 * rather than every organization of an event admin. Super-admin is a property of the person, so it
 * keeps all of that person's rows.
 */
export const toAccessRows = (
  users: AdminUserList_User[],
  superAdminUserIds: string[],
  privilegeFilter: AdminPrivilege[]
): AdminAccessRow[] => {
  const superAdmins = new Set(superAdminUserIds);

  return users.flatMap((user) => {
    const isSuperAdmin = superAdmins.has(user.id);
    const rows: AdminAccessRow[] =
      user.OrganizationAdmins.length > 0
        ? user.OrganizationAdmins.map((grant) => ({ id: grant.id, user, grant, isSuperAdmin }))
        : [{ id: user.id, user, grant: null, isSuperAdmin }];

    if (privilegeFilter.length === 0) {
      return rows;
    }
    return rows.filter((row) =>
      privilegeFilter.some((privilege) =>
        privilege === 'superAdmin' ? row.isSuperAdmin : grantHasPrivilege(row.grant, privilege)
      )
    );
  });
};

/**
 * True when the row's grant came from a self-service claim that nothing corroborated: the claimer's
 * email domain did not match the organization's, so a human still has to confirm that this person
 * really may act for that organization.
 *
 * The other claim states are not flagged — a domain-verified claim was corroborated, and an
 * organization the claimer created with the claim has nothing to be checked against.
 */
export const claimNeedsReview = (grant: AdminUserList_User_OrganizationAdmins | null): boolean =>
  grant?.claimVerification === 'SELF_SERVICE_UNVERIFIED';
