import useTranslation from 'next-translate/useTranslation';
import { FC } from 'react';
import { ManagedCourse_Course_by_pk_Sessions_SessionAddresses } from '../../../../queries/__generated__/ManagedCourse';
import { UPDATE_SESSION_ADDRESS } from '../../../../queries/course';
import UnifiedTextFieldEditor from '../../../forms/UnifiedTextFieldEditor';
import { isLinkFormat } from '../../../../helpers/util';
import { QueryResult } from '@apollo/client';

interface SessionAddressesIProps {
  address: ManagedCourse_Course_by_pk_Sessions_SessionAddresses | null;
  refetchQuery: QueryResult<any, any>;
}

export const SessionAddresses: FC<SessionAddressesIProps> = ({ address, refetchQuery }) => {
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
        <UnifiedTextFieldEditor
          variant="eduHub"
          element="input"
          updateTextMutation={UPDATE_SESSION_ADDRESS}
          refetchQuery={refetchQuery}
          itemId={address.id}
          placeholder={placeholder}
          value={value}
          currentText={value}
          className="h-2 mb-0 ml-11 w-1/2"
          showCharacterCount={false}
          invertColors={true}
        />
      )}
    </div>
  );
};

export default SessionAddresses;
