/**
 * Module-level impersonation state for the Apollo link, mirroring authStore.
 *
 * The link has to decide per request whether to go to Hasura or to the
 * impersonation proxy, and it cannot read React context. Passing the flag
 * through query options would also make it part of the Apollo context, which
 * triggers refetches (see the note in config/apollo.ts), so it lives here and
 * ImpersonationProvider keeps it in sync.
 */
export type ImpersonationState = {
  active: boolean;
  targetUserId: string | null;
};

let impersonationState: ImpersonationState = { active: false, targetUserId: null };

export function getImpersonationState(): ImpersonationState {
  return impersonationState;
}

export function setImpersonationState(state: ImpersonationState): void {
  impersonationState = state;
}
