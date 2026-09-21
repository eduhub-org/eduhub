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
  const { target, loading } = useImpersonation();
  if (target) return { userId: target.id, asPlainUser: true };

  // The transport switches identity before this does: the marker cookie routes
  // Apollo through the proxy on the first render of every page load, while the
  // target is still a fetch away. Answering as the signed-in admin across that
  // gap would open the management surface and, worse, hand `useCurrentUserId`
  // the admin's id for queries Hasura is about to answer as somebody else.
  //
  // So a pending impersonation counts as one. There is no id to view as yet,
  // which is exactly right: a component that needs one has nothing to ask for
  // until the answer arrives.
  if (loading) return { userId: null, asPlainUser: true };

  return { userId: null, asPlainUser: false };
};
