/**
 * Module-level auth state for Apollo Link. Updated by AuthStoreUpdater from React.
 * This allows the Apollo link to add auth headers at request time without passing
 * context through useQuery options, which can trigger refetches when context changes.
 */
import { AuthRoles } from '../types/enums';

export type AuthState = {
  accessToken: string | null;
  role: AuthRoles;
};

let authState: AuthState = { accessToken: null, role: AuthRoles.anonymous };

export function getAuthState(): AuthState {
  return authState;
}

export function setAuthState(state: AuthState): void {
  authState = state;
}
