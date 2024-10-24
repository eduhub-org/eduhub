import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';
import { ManagedCourse_Course_by_pk_Sessions_SessionAddresses } from '../../../../queries/__generated__/ManagedCourse';
import { UPDATE_SESSION_ADDRESS } from '../../../../queries/course';
import InputField from '../../../inputs/InputField';
import { isLinkFormat } from '../../../../helpers/util';

interface SessionAddressesIProps {
  address: ManagedCourse_Course_by_pk_Sessions_SessionAddresses | null;
  refetchQueries: [string];
}

export const SessionAddresses: FC<SessionAddressesIProps> = ({ address, refetchQueries }) => {
  const { t } = useTranslation('course-page');

  const defaultSessionAddress = address?.CourseLocation?.defaultSessionAddress;
  const sessionAddress = address?.address || defaultSessionAddress;
  const isOnline = address?.CourseLocation?.locationOption === 'ONLINE';
  const isValidLink = isLinkFormat(sessionAddress);

  const label = isOnline
    ? t('sessionAddress.online.label')
    : t('sessionAddress.offline.label') + t('common:location.' + address?.CourseLocation?.locationOption);
  const value = isOnline ? (isValidLink ? sessionAddress : t('sessionAddress.online.placeholder')) : sessionAddress;
  const placeholder = isOnline ? null : t('sessionAddress.offline.placeholder');

  return (
    <div className="mb-2">
      <span>{label}:</span>
      {isOnline ? (
        <div className="h-2 mb-0 ml-16">{value}</div>
      ) : (
        <InputField
          variant="eduhub"
          type="input"
          updateValueMutation={UPDATE_SESSION_ADDRESS}
          refetchQueries={refetchQueries}
          itemId={address.id}
          placeholder={placeholder}
          value={value}
          className="h-2 mb-0 ml-11 w-1/2"
          showCharacterCount={false}
          invertColors={true}
        />
      )}
    </div>
  );
};

export default SessionAddresses;
