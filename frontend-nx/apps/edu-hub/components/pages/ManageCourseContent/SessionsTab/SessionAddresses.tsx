import { useTranslations } from 'next-intl';
import { FC, useMemo } from 'react';
import { ManagedCourse_Course_by_pk_Sessions_SessionAddresses } from '../../../../queries/__generated__/ManagedCourse';
import { UPDATE_SESSION_ADDRESS } from '../../../../queries/course';
import { LOCATION_ADDRESS_BY_LOCATION_OPTION, CREATE_LOCATION_ADDRESS } from '../../../../queries/locationAddress';
import { useRoleQuery } from '../../../../hooks/authedQuery';
import DropDownSelector from '../../../inputs/DropDownSelector';
import { isLinkFormat } from '../../../../helpers/util';
import { LocationOption_enum } from '../../../../__generated__/globalTypes';
import { Tooltip } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

interface SessionAddressesIProps {
  address: ManagedCourse_Course_by_pk_Sessions_SessionAddresses | null;
  refetchQueries: [string];
}

export const SessionAddresses: FC<SessionAddressesIProps> = ({ address, refetchQueries }) => {
  const t = useTranslations('manageCourse.SessionsTab.sessionAddresses');
  const tCommon = useTranslations('common');

  const defaultSessionAddress = address?.CourseLocation?.defaultSessionAddress;
  const defaultSessionAddressId = (address?.CourseLocation as any)?.defaultSessionAddressId;
  const sessionAddress = address?.address || defaultSessionAddress;
  const isOnline = address?.CourseLocation?.locationOption === 'ONLINE';
  const isValidLink = isLinkFormat(sessionAddress ?? '');
  
  // Get the current locationAddressId if it exists
  const currentLocationAddressId = (address as any)?.locationAddressId || null;

  const label = isOnline
    ? t('online.label')
    : tCommon('location.' + address?.CourseLocation?.locationOption);

  // Query location addresses for the selected location option
  const { data: addressData, error: addressDataError } = useRoleQuery(LOCATION_ADDRESS_BY_LOCATION_OPTION, {
    variables: {
      locationOption: address?.CourseLocation?.locationOption as LocationOption_enum,
      searchFilter: '%',
    },
    skip: !address?.CourseLocation?.locationOption || isOnline,
  });

  if (addressDataError) {
    console.log('query known session location address options error', addressDataError);
  }

  // Transform addresses for dropdown options
  const addressOptions = useMemo(() => {
    if (!addressData?.LocationAddress) return [];
    
    return addressData.LocationAddress.map((addr: any) => ({
      label: addr.shortLabel,
      value: addr.id.toString(),
      aliases: addr.aliases || [],
    }));
  }, [addressData]);

  // Find the default address label for display
  const defaultAddressLabel = useMemo(() => {
    if (!defaultSessionAddressId || !addressData?.LocationAddress) return null;
    const defaultAddr = addressData.LocationAddress.find((addr: any) => addr.id === defaultSessionAddressId);
    return defaultAddr ? defaultAddr.shortLabel : null;
  }, [defaultSessionAddressId, addressData]);

  // Custom nullable label that shows the default address if one exists
  const nullableLabel = useMemo(() => {
    if (defaultAddressLabel) {
      return `${defaultAddressLabel} (${t('default_address')})`;
    }
    return t('no_address_selected');
  }, [defaultAddressLabel, t]);


  const labelCell = (
    <span className="text-label-primary flex-shrink-0" style={{ minWidth: '5rem' }}>
      {label}:
    </span>
  );

  // For online sessions, show the link as read-only
  if (isOnline) {
    const value = isValidLink ? sessionAddress : t('online.placeholder');
    return (
      <>
        {labelCell}
        <span className="text-label-primary flex-1 min-w-0 flex items-center">
          {value}
          <Tooltip title={t('online.placeholder')} placement="top">
            <HelpOutline
              style={{
                cursor: 'pointer',
                color: 'var(--eduhub-label-disabled)',
                marginLeft: '8px',
                fontSize: '20px',
              }}
            />
          </Tooltip>
        </span>
      </>
    );
  }

  // For offline sessions, use the enhanced dropdown selector
  return (
    <>
      {labelCell}
      <div className="flex-1 min-w-0">
        <DropDownSelector
          variant="material"
          label=""
          placeholder={nullableLabel || t('offline.placeholder')}
          helpText={t('offline.placeholder')}
          value={currentLocationAddressId?.toString() || ''}
          options={addressOptions}
          updateValueMutation={UPDATE_SESSION_ADDRESS}
          identifierVariables={{ 
            itemId: address?.id,
            locationOption: address?.CourseLocation?.locationOption 
          }}
          creatable={true}
          createOptionMutation={CREATE_LOCATION_ADDRESS}
          refetchQueries={[...refetchQueries, 'LocationAddressByLocationOption']}
          nullable={true}
          nullableLabel={nullableLabel}
        />
      </div>
    </>
  );
};

export default SessionAddresses;
