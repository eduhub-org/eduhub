import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Which course, if any, the page below is currently being previewed as a
 * participant of.
 *
 * This exists because the notice is page chrome rather than page content. The
 * header is positioned absolutely over the top of `<main>`, so a bar rendered at
 * the top of the page body ends up underneath it: the text sits behind the logo
 * and the "end preview" button behind the avatar, where it cannot be clicked at
 * all. Page renders the notice above that wrapper, next to ImpersonationBanner,
 * and the course page says from down here what it should show -- the same shape
 * as ImpersonationContext, for the same reason.
 */

type ParticipantPreviewContextValue = {
  /** The previewed course, or null when this page is not a preview. */
  courseId: number | null;
  setCourseId: (courseId: number | null) => void;
};

const ParticipantPreviewContext = createContext<ParticipantPreviewContextValue>({
  courseId: null,
  setCourseId: () => undefined,
});

export const ParticipantPreviewProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [courseId, setCourseId] = useState<number | null>(null);
  const value = useMemo(() => ({ courseId, setCourseId }), [courseId]);

  return <ParticipantPreviewContext.Provider value={value}>{children}</ParticipantPreviewContext.Provider>;
};

export const useParticipantPreview = () => useContext(ParticipantPreviewContext);

/**
 * Declares the preview notice for as long as the calling component is mounted.
 * Pass null when the page is not a preview. Clearing on unmount is what keeps
 * the bar from outliving the course page it belongs to.
 */
export const useDeclareParticipantPreview = (courseId: number | null) => {
  const { setCourseId } = useParticipantPreview();

  useEffect(() => {
    setCourseId(courseId);
    return () => setCourseId(null);
  }, [courseId, setCourseId]);
};
