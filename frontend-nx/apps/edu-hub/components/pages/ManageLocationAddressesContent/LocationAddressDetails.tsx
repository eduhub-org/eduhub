import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import InputField from '../../inputs/InputField';
import DropDownSelector from '../../inputs/DropDownSelector';
import FileUploadField from '../../inputs/FileUploadField';
import { Button } from '../../common/Button';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { useAdminMutation } from '../../../hooks/authedMutation';
import {
  UPDATE_LOCATION_ADDRESS_STREET,
  UPDATE_LOCATION_ADDRESS_ZIP_CODE,
  UPDATE_LOCATION_ADDRESS_CITY,
  UPDATE_LOCATION_ADDRESS_COUNTRY,
  UPDATE_LOCATION_ADDRESS_ADDITIONAL_INFO,
  UPDATE_LOCATION_ADDRESS_DIRECTIONS,
  UPDATE_LOCATION_ADDRESS_ACCESSIBILITY_INFO,
  UPDATE_LOCATION_ADDRESS_LATITUDE,
  UPDATE_LOCATION_ADDRESS_LONGITUDE,
  UPDATE_LOCATION_ADDRESS_CATEGORY,
  UPDATE_LOCATION_ADDRESS_IMAGE,
  UPDATE_LOCATION_ADDRESS_IMAGE_CREDITS,
  UPDATE_LOCATION_ADDRESS_WEBSITE_URL,
  UPDATE_LOCATION_ADDRESS_PUBLIC_EMAIL,
  UPDATE_LOCATION_ADDRESS_PUBLIC_PHONE,
  UPDATE_LOCATION_ADDRESS_INSTAGRAM_URL,
} from '../../../queries/locationAddress';
import { GEOCODE_LOCATION_ADDRESS, SAVE_LOCATION_ADDRESS_IMAGE } from '../../../queries/actions';
import {
  GeocodeLocationAddress,
  GeocodeLocationAddressVariables,
} from '../../../queries/__generated__/GeocodeLocationAddress';
import { LocationAddressList_LocationAddress } from '../../../queries/__generated__/LocationAddressList';
import { RausgegangenLocationLink } from './RausgegangenLocationLink';

const REFETCH = ['LocationAddressList'];
const toNullable = (text: string) => text.trim() || null;

type Props = {
  row: LocationAddressList_LocationAddress;
  categories: string[];
  /** At least one organization has the Rausgegangen feature. */
  rausgegangenAvailable: boolean;
  onError: (errorMessage: string) => void;
};

/** A section heading with its fields in a responsive two-column grid. */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-4 rounded-lg border border-border-primary/30 p-3">
    <p className="text-sm font-semibold mb-2">{title}</p>
    <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">{children}</div>
  </div>
);

/**
 * The structured venue data of a location address: address and coordinates,
 * venue details, contact, image and the Rausgegangen link.
 */
export const LocationAddressDetails: React.FC<Props> = ({ row, categories, rausgegangenAvailable, onError }) => {
  const t = useTranslations('manageLocationAddresses');
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  const [geocode, { loading: geocoding }] = useAdminMutation<GeocodeLocationAddress, GeocodeLocationAddressVariables>(
    GEOCODE_LOCATION_ADDRESS,
    { refetchQueries: REFETCH }
  );

  const textField = (
    field: keyof LocationAddressList_LocationAddress,
    mutation: Parameters<typeof InputField>[0]['updateValueMutation'],
    type: 'input' | 'textarea' | 'link' | 'email' = 'input'
  ) => (
    <InputField
      key={field}
      variant="material"
      type={type}
      label={t(`venue.${field}`)}
      helpText={t(`venue_help.${field}`)}
      itemId={row.id}
      value={(row[field] as string | null) ?? ''}
      updateValueMutation={mutation}
      transformMutationText={toNullable}
      refetchQueries={REFETCH}
      showCharacterCount={false}
    />
  );

  const coordinateField = (field: 'latitude' | 'longitude', mutation: typeof UPDATE_LOCATION_ADDRESS_LATITUDE) => (
    <InputField
      key={`${field}-${row[field] ?? ''}`}
      variant="material"
      type="decimal"
      label={t(`venue.${field}`)}
      helpText={t(`venue_help.${field}`)}
      itemId={row.id}
      value={row[field] === null || row[field] === undefined ? '' : String(row[field])}
      updateValueMutation={mutation}
      refetchQueries={REFETCH}
      showCharacterCount={false}
    />
  );

  const handleGeocode = async () => {
    try {
      const result = await geocode({ variables: { locationAddressId: row.id } });
      const outcome = result.data?.geocodeLocationAddress;
      if (outcome?.success) {
        setGeocodeMessage(t('venue.geocode_success', { place: outcome.displayName ?? '' }));
      } else {
        onError(outcome?.error || t('venue.geocode_failed'));
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : t('venue.geocode_failed'));
    }
  };

  return (
    <>
      <Section title={t('venue.section_address')}>
        {textField('street', UPDATE_LOCATION_ADDRESS_STREET)}
        {textField('addressAdditionalInfo', UPDATE_LOCATION_ADDRESS_ADDITIONAL_INFO)}
        {textField('zipCode', UPDATE_LOCATION_ADDRESS_ZIP_CODE)}
        {textField('city', UPDATE_LOCATION_ADDRESS_CITY)}
        {textField('country', UPDATE_LOCATION_ADDRESS_COUNTRY)}
        <div />
        {coordinateField('latitude', UPDATE_LOCATION_ADDRESS_LATITUDE)}
        {coordinateField('longitude', UPDATE_LOCATION_ADDRESS_LONGITUDE)}
        <div className="md:col-span-2 mt-1 flex flex-wrap items-center gap-2">
          <Button disabled={geocoding || !row.street || !row.city} onClick={() => void handleGeocode()}>
            {geocoding ? t('venue.geocoding') : t('venue.geocode')}
          </Button>
          {row.latitude !== null && row.longitude !== null && (
            <a
              className="text-sm underline text-label-secondary"
              href={`https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=18/${row.latitude}/${row.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('venue.show_on_map')}
            </a>
          )}
        </div>
      </Section>

      <Section title={t('venue.section_venue')}>
        <DropDownSelector
          variant="material"
          label={t('venue.category')}
          helpText={t('venue_help.category')}
          identifierVariables={{ id: row.id }}
          value={row.category ?? ''}
          options={categories.map((value) => ({ value, label: t(`venue.categories.${value}`) }))}
          updateValueMutation={UPDATE_LOCATION_ADDRESS_CATEGORY}
          refetchQueries={REFETCH}
        />
        <div />
        {textField('directions', UPDATE_LOCATION_ADDRESS_DIRECTIONS, 'textarea')}
        {textField('accessibilityInfo', UPDATE_LOCATION_ADDRESS_ACCESSIBILITY_INFO, 'textarea')}
      </Section>

      <Section title={t('venue.section_contact')}>
        {textField('websiteUrl', UPDATE_LOCATION_ADDRESS_WEBSITE_URL, 'link')}
        {textField('instagramUrl', UPDATE_LOCATION_ADDRESS_INSTAGRAM_URL, 'link')}
        {textField('publicEmail', UPDATE_LOCATION_ADDRESS_PUBLIC_EMAIL, 'email')}
        {textField('publicPhone', UPDATE_LOCATION_ADDRESS_PUBLIC_PHONE)}
      </Section>

      <Section title={t('venue.section_image')}>
        <FileUploadField
          variant="material"
          currentFileUrl={row.image}
          uploadMutation={SAVE_LOCATION_ADDRESS_IMAGE}
          updateMutation={UPDATE_LOCATION_ADDRESS_IMAGE}
          identifierVariables={{ id: row.id }}
          uploadIdentifierVariables={{ locationAddressId: row.id }}
          updateFieldName="image"
          acceptedFileTypes="image/*"
          maxFileSize={5 * 1024 * 1024}
          uploadText={t('venue.image_upload')}
          altText={row.shortLabel}
          refetchQueries={REFETCH}
          onUploadError={(error) => onError(error)}
        />
        <InputField
          variant="material"
          type="input"
          label={t('venue.imageCredits')}
          helpText={t('venue_help.imageCredits')}
          itemId={row.id}
          value={row.imageCredits ?? ''}
          updateValueMutation={UPDATE_LOCATION_ADDRESS_IMAGE_CREDITS}
          transformMutationText={toNullable}
          refetchQueries={REFETCH}
          maxLength={120}
        />
      </Section>

      {rausgegangenAvailable && <RausgegangenLocationLink row={row} onError={onError} />}

      <NotificationSnackbar
        open={!!geocodeMessage}
        onClose={() => setGeocodeMessage(null)}
        message={geocodeMessage ?? ''}
      />
    </>
  );
};
