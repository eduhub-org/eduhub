import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../../common/Button';
import { DialogShell } from '../../common/dialogs/DialogShell';
import { useAdminLazyQuery } from '../../../hooks/authedQuery';
import { useAdminMutation } from '../../../hooks/authedMutation';
import { SEARCH_RAUSGEGANGEN_LOCATIONS } from '../../../queries/actions';
import { UPDATE_LOCATION_ADDRESS_RAUSGEGANGEN_LINK } from '../../../queries/locationAddress';
import {
  SearchRausgegangenLocations,
  SearchRausgegangenLocationsVariables,
} from '../../../queries/__generated__/SearchRausgegangenLocations';
import { LocationAddressList_LocationAddress } from '../../../queries/__generated__/LocationAddressList';

type Props = {
  row: LocationAddressList_LocationAddress;
  onError: (errorMessage: string) => void;
};

/**
 * Which rausgegangen.de venue this location is. Events need one for every show:
 * the sync links an exact address match or creates our own venue there; an
 * admin can instead link an existing venue by hand to avoid a duplicate.
 */
export const RausgegangenLocationLink: React.FC<Props> = ({ row, onError }) => {
  const t = useTranslations('manageLocationAddresses');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, { data, loading }] = useAdminLazyQuery<SearchRausgegangenLocations, SearchRausgegangenLocationsVariables>(
    SEARCH_RAUSGEGANGEN_LOCATIONS,
    { fetchPolicy: 'network-only' }
  );
  const [updateLink] = useAdminMutation(UPDATE_LOCATION_ADDRESS_RAUSGEGANGEN_LINK, {
    refetchQueries: ['LocationAddressList'],
  });

  const result = data?.searchRausgegangenLocations;

  const openSearch = async () => {
    setDialogOpen(true);
    const response = await search({ variables: { locationAddressId: row.id } });
    const outcome = response.data?.searchRausgegangenLocations;
    if (response.error || (outcome && !outcome.success)) {
      setDialogOpen(false);
      onError(outcome?.error || response.error?.message || t('rausgegangen.search_failed'));
    }
  };

  const link = async (rausgegangenLocationId: string | null) => {
    try {
      await updateLink({ variables: { id: row.id, rausgegangenLocationId } });
      setDialogOpen(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };

  const status = !row.rausgegangenLocationId
    ? t('rausgegangen.status_none')
    : row.rausgegangenLocationOwned
      ? t('rausgegangen.status_owned')
      : t('rausgegangen.status_linked');

  return (
    <div className="mt-4 rounded-lg border border-border-primary/30 p-3">
      <p className="text-sm font-semibold">{t('rausgegangen.title')}</p>
      <p className="text-sm text-label-secondary mt-1">{status}</p>
      {row.rausgegangenLocationId && (
        <p className="text-xs text-label-secondary mt-1 break-all">ID: {row.rausgegangenLocationId}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button onClick={() => void openSearch()}>{t('rausgegangen.search')}</Button>
        {row.rausgegangenLocationId && (
          <Button className="border-red-600 text-red-700 hover:border-red-700" onClick={() => void link(null)}>
            {t('rausgegangen.unlink')}
          </Button>
        )}
      </div>

      <DialogShell open={dialogOpen} onClose={() => setDialogOpen(false)} title={t('rausgegangen.search_title')} maxWidth="md">
        {loading && <p className="text-sm">{t('rausgegangen.searching')}</p>}
        {!loading && result?.success && result.locations.length === 0 && (
          <p className="text-sm">{t('rausgegangen.no_results')}</p>
        )}
        {!loading && result?.success && result.locations.length > 0 && (
          <ul className="divide-y divide-border-primary/30">
            {result.locations.map((location) => (
              <li key={location.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="font-medium text-label-primary">{location.title}</p>
                  <p className="text-sm text-label-secondary">
                    {[location.street, [location.zipCode, location.city].filter(Boolean).join(' ')]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                <Button
                  filled
                  disabled={location.id === row.rausgegangenLocationId}
                  onClick={() => void link(location.id)}
                >
                  {location.id === row.rausgegangenLocationId ? t('rausgegangen.linked') : t('rausgegangen.link')}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-label-secondary mt-3">{t('rausgegangen.search_hint')}</p>
      </DialogShell>
    </div>
  );
};
