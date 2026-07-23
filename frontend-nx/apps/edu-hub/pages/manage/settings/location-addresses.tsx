import { FC } from 'react';

import ManageLocationAddressesContent from '../../../components/pages/ManageLocationAddressesContent';
import SettingsSectionPage from '../../../components/pages/ManageSettings/SettingsSectionPage';

const LocationAddressesSettingsPage: FC = () => (
  <SettingsSectionPage itemId="location-addresses">
    <ManageLocationAddressesContent inSettingsLayout />
  </SettingsSectionPage>
);

export default LocationAddressesSettingsPage;
