import { ReactElement, useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useManageMutation } from '../../../hooks/authedMutation';
import { useLazyRoleQuery } from '../../../hooks/authedQuery';
import { useIsAdmin, useIsOrgAdmin, useManageRole } from '../../../hooks/authentication';
import { DISABLE_RAUSGEGANGEN_LISTINGS, ENABLED_RAUSGEGANGEN_LISTINGS } from '../../../queries/rausgegangen';
import {
  EnabledRausgegangenListings,
  EnabledRausgegangenListingsVariables,
} from '../../../queries/__generated__/EnabledRausgegangenListings';
import { Button } from '../../common/Button';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import CheckboxSelector from '../../inputs/CheckboxSelector';

type Prompt = { count: number; resolve: (proceed: boolean) => void; courseIds: number[] };

/**
 * Before events are unpublished in EduHub: when some of them are shared on
 * rausgegangen.de, ask whether to unpublish them there too (pre-selected).
 * Returns false when the editor cancels, or when the shared events cannot be
 * looked up or taken off Rausgegangen as requested (the error is shown); the
 * caller then leaves the events published in EduHub too. Without shared events
 * it resolves to true right away, without asking.
 *
 * Unpublishing there happens by disabling the listing; its trigger takes care
 * of the rest.
 */
export const useRausgegangenUnpublishPrompt = (): {
  confirmUnpublish: (courseIds: number[]) => Promise<boolean>;
  dialog: ReactElement;
} => {
  const t = useTranslations('manageCourse.rausgegangen.unpublish_prompt');
  const tCommon = useTranslations('common');
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const role = useManageRole();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [alsoRausgegangen, setAlsoRausgegangen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const promptRef = useRef<Prompt | null>(null);

  const [fetchEnabled] = useLazyRoleQuery<EnabledRausgegangenListings, EnabledRausgegangenListingsVariables>(
    ENABLED_RAUSGEGANGEN_LISTINGS,
    { fetchPolicy: 'network-only', context: { role } }
  );
  const [disableListings] = useManageMutation(DISABLE_RAUSGEGANGEN_LISTINGS, {
    refetchQueries: ['RausgegangenListingForCourse'],
  });

  const confirmUnpublish = useCallback(
    async (courseIds: number[]) => {
      // Only super admins and org admins can share events; nobody else has listings to ask about.
      if (!isAdmin && !isOrgAdmin) return true;
      let sharedCourseIds: number[] = [];
      try {
        const { data, error: queryError } = await fetchEnabled({ variables: { courseIds } });
        if (queryError) throw queryError;
        sharedCourseIds = (data?.RausgegangenListing ?? []).map((listing) => listing.courseId);
      } catch (lookupError) {
        setError(t('lookup_failed', { error: lookupError instanceof Error ? lookupError.message : String(lookupError) }));
        return false;
      }
      if (sharedCourseIds.length === 0) return true;

      setAlsoRausgegangen(true);
      return new Promise<boolean>((resolve) => {
        const next = { count: sharedCourseIds.length, resolve, courseIds: sharedCourseIds };
        promptRef.current = next;
        setPrompt(next);
      });
    },
    [fetchEnabled, isAdmin, isOrgAdmin, t]
  );

  const close = async (proceed: boolean) => {
    const current = promptRef.current;
    promptRef.current = null;
    setPrompt(null);
    if (!current) return;
    if (proceed && alsoRausgegangen) {
      try {
        await disableListings({ variables: { courseIds: current.courseIds } });
      } catch (disableError) {
        setError(t('disable_failed', { error: disableError instanceof Error ? disableError.message : String(disableError) }));
        current.resolve(false);
        return;
      }
    }
    current.resolve(proceed);
  };

  const dialog = (
    <>
      <ErrorMessageDialog errorMessage={error || ''} open={!!error} onClose={() => setError(null)} />
      <DialogShell
      open={!!prompt}
      onClose={() => void close(false)}
      title={t('title')}
      actions={
        <div className="grid grid-cols-2 w-full gap-2">
          <div>
            <Button onClick={() => void close(false)}>{tCommon('cancel')}</Button>
          </div>
          <div className="flex justify-end">
            <Button filled onClick={() => void close(true)}>
              {t('confirm')}
            </Button>
          </div>
        </div>
      }
    >
      <p className="whitespace-pre-line">{t('question', { count: prompt?.count ?? 0 })}</p>
      <CheckboxSelector
        variant="material"
        className="mt-3"
        label={t('also_rausgegangen')}
        checked={alsoRausgegangen}
        onValueUpdated={(value: boolean) => setAlsoRausgegangen(value)}
      />
      {!alsoRausgegangen && <p className="text-sm text-label-secondary mt-1">{t('keep_hint')}</p>}
      </DialogShell>
    </>
  );

  return { confirmUnpublish, dialog };
};
