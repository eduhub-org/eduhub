import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdOpenInNew } from 'react-icons/md';

import { useDisplayDate } from '../../../helpers/dateTimeHelpers';
import { useManageMutation } from '../../../hooks/authedMutation';
import { useManageQuery } from '../../../hooks/authedQuery';
import CheckboxSelector from '../../inputs/CheckboxSelector';
import DropDownSelector from '../../inputs/DropDownSelector';
import CreatableTagSelector from '../../inputs/CreatableTagSelector';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { SYNC_RAUSGEGANGEN_EVENT_NOW } from '../../../queries/actions';
import {
  INSERT_RAUSGEGANGEN_LISTING,
  RAUSGEGANGEN_LISTING_FOR_COURSE,
  UPDATE_RAUSGEGANGEN_LISTING_CATEGORY,
  UPDATE_RAUSGEGANGEN_LISTING_ENABLED,
  UPDATE_RAUSGEGANGEN_LISTING_TAGS,
} from '../../../queries/rausgegangen';
import {
  RausgegangenListingForCourse,
  RausgegangenListingForCourseVariables,
} from '../../../queries/__generated__/RausgegangenListingForCourse';
import {
  SyncRausgegangenEventNow,
  SyncRausgegangenEventNowVariables,
} from '../../../queries/__generated__/SyncRausgegangenEventNow';

const BUTTON =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-full border-[1.5px] border-white px-4 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50';

/** The sync runs in an event trigger; look again shortly after a change. */
const REFRESH_DELAY_MS = 4000;

/**
 * Sharing an event on rausgegangen.de. Shown to super admins and org admins
 * once a super admin has activated the feature for the organization.
 */
export const RausgegangenEventSection: FC<{ courseId: number }> = ({ courseId }) => {
  const t = useTranslations('manageCourse.rausgegangen');
  const displayDate = useDisplayDate();
  const [error, setError] = useState<string | null>(null);

  const { data, refetch } = useManageQuery<RausgegangenListingForCourse, RausgegangenListingForCourseVariables>(
    RAUSGEGANGEN_LISTING_FOR_COURSE,
    { variables: { courseId }, fetchPolicy: 'cache-and-network' }
  );
  const [insertListing] = useManageMutation(INSERT_RAUSGEGANGEN_LISTING);
  const [syncNow, { loading: syncing }] = useManageMutation<SyncRausgegangenEventNow, SyncRausgegangenEventNowVariables>(
    SYNC_RAUSGEGANGEN_EVENT_NOW
  );

  const course = data?.Course_by_pk;
  const listing = data?.RausgegangenListing?.[0];
  const featureActive = (course?.Program?.Organization?.Features?.length ?? 0) > 0;
  if (!course || !featureActive) return null;

  const refreshSoon = () => {
    void refetch();
    setTimeout(() => void refetch(), REFRESH_DELAY_MS);
  };

  const enable = async () => {
    try {
      await insertListing({ variables: { courseId, enabled: true } });
      refreshSoon();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSyncNow = async () => {
    try {
      const result = await syncNow({ variables: { courseId } });
      const outcome = result.data?.syncRausgegangenEventNow;
      if (outcome && !outcome.success && outcome.error) setError(outcome.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    void refetch();
  };

  const status = (() => {
    if (!listing?.enabled) return t('status.disabled');
    switch (listing.syncStatus) {
      case 'SYNCED':
        return listing.published ? t('status.published') : t('status.unpublished');
      case 'SKIPPED':
        return listing.syncError || t('status.disabled');
      case 'ERROR':
        return t('status.error', { error: listing.syncError ?? '' });
      default:
        return t('status.pending');
    }
  })();

  const tags = Array.isArray(listing?.tags) ? (listing?.tags as unknown[]).map(String) : [];

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl border border-white/30 bg-white/5 p-4 text-white md:p-6">
      <div>
        <p className="text-lg font-semibold">{t('title')}</p>
        <p className="text-sm text-white/80">{t('description')}</p>
      </div>

      <div className="light rounded-lg bg-fill-primary p-3 text-label-primary">
        <CheckboxSelector
          variant="switch"
          labelPlacement="end"
          label={t('enabled')}
          helpText={t('enabled_help')}
          checked={Boolean(listing?.enabled)}
          // An unpublished event cannot be shared, but an already shared one can be switched off.
          disabled={!course.published && !listing?.enabled}
          {...(listing
            ? {
                updateValueMutation: UPDATE_RAUSGEGANGEN_LISTING_ENABLED,
                identifierVariables: { id: listing.id },
                onValueUpdated: refreshSoon,
              }
            : { onValueUpdated: (value: boolean) => value && void enable() })}
        />
        {!course.published && !listing?.enabled && (
          <p className="text-sm text-label-secondary">{t('publish_first')}</p>
        )}

        {listing && (
          <div className="mt-2 grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <DropDownSelector
              variant="material"
              label={t('category')}
              helpText={t('category_help')}
              identifierVariables={{ id: listing.id }}
              value={listing.category}
              options={(data?.RausgegangenEventCategory ?? []).map(({ value }) => ({
                value,
                label: t(`categories.${value}`),
              }))}
              updateValueMutation={UPDATE_RAUSGEGANGEN_LISTING_CATEGORY}
              refetchQueries={['RausgegangenListingForCourse']}
            />
            <CreatableTagSelector
              variant="material"
              label={t('tags')}
              placeholder={t('tags_placeholder')}
              helpText={t('tags_help')}
              itemId={listing.id}
              values={tags}
              options={[]}
              updateValuesMutation={UPDATE_RAUSGEGANGEN_LISTING_TAGS}
              mutationPreset="role"
              refetchQueries={['RausgegangenListingForCourse']}
              onError={(e) => setError(e.message)}
            />
          </div>
        )}
      </div>

      {listing && (
        <>
          <p className="text-sm">
            {status}
            {listing.lastSyncedAt && (
              <span className="text-white/70"> · {t('last_synced', { date: displayDate(listing.lastSyncedAt) })}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            {listing.publicUrl && listing.published && (
              <a href={listing.publicUrl} target="_blank" rel="noopener noreferrer" className={BUTTON}>
                <MdOpenInNew aria-hidden />
                {t('view')}
              </a>
            )}
            {listing.previewUrl && (
              <a href={listing.previewUrl} target="_blank" rel="noopener noreferrer" className={BUTTON}>
                <MdOpenInNew aria-hidden />
                {t('preview')}
              </a>
            )}
            {listing.enabled && (
              <button type="button" className={BUTTON} disabled={syncing} onClick={() => void handleSyncNow()}>
                {syncing ? t('syncing') : t('sync_now')}
              </button>
            )}
          </div>
        </>
      )}

      {error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={() => setError(null)} />}
    </div>
  );
};
