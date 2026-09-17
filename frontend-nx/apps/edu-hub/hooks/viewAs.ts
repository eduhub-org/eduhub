import { useImpersonation } from '../contexts/ImpersonationContext';

/**
 * "Whose eyes am I looking through?"
 *
 * One answer for every identity hook. Today only impersonation moves it, but the
 * shape is deliberately about the viewed identity rather than about
 * impersonation, so anything else that needs the app to behave as a plain
 * participant can set it too.
 */
export type ViewAs = {
  /** The user the UI should behave as, or null for the signed-in user. */
  userId: string | null;
  /** True when the viewer must be treated as an ordinary `user`, whatever they really are. */
  asPlainUser: boolean;
};

export const useViewAs = (): ViewAs => {
  const { target } = useImpersonation();
  return target ? { userId: target.id, asPlainUser: true } : { userId: null, asPlainUser: false };
};
