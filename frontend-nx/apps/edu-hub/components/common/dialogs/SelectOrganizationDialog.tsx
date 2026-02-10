import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ChangeEvent, FC, useCallback, useState, useMemo } from 'react';
import { MdClose } from 'react-icons/md';
import { useAuthedQuery } from '../../../hooks/authedQuery';
import { ORGANIZATION_LIST } from '../../../queries/organization';
import { OrganizationList_Organization } from '../../../queries/__generated__/OrganizationList';
import { Button } from '../Button';
import { createMultiWordSearchCondition } from '../../../helpers/searchUtils';

interface IProps {
  title: string;
  onClose: (confirmed: boolean, organization: OrganizationList_Organization | null) => void;
  open: boolean;
}

// Search organization by name, description, or aliases
export const SelectOrganizationDialog: FC<IProps> = ({ onClose, open, title }) => {
  const [searchValue, setSearchValue] = useState('');
  const t = useTranslations();

  const handleNewInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchValue(event.target.value);
    },
    []
  );

  const handleCancel = useCallback(() => {
    setSearchValue('');
    onClose(false, null);
  }, [onClose]);

  const handleConfirm = useCallback(
    (organization: OrganizationList_Organization) => {
      setSearchValue('');
      onClose(true, organization);
    },
    [onClose]
  );

  // Create filter condition using multi-word search with aliases support
  const filter = useMemo(() => {
    if (searchValue.trim().length < 2) {
      return {};
    }
    return createMultiWordSearchCondition(searchValue.trim(), ['name', 'description', 'aliases'], {
      arrayFields: ['aliases'],
    });
  }, [searchValue]);

  // Query organizations with search filter
  const { data } = useAuthedQuery(ORGANIZATION_LIST, {
    variables: {
      limit: 100,
      filter,
      order_by: { name: 'asc' },
    },
    skip: !open,
  });

  const organizations = data?.Organization || [];

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle className="light">
        <div className="grid grid-cols-2">
          <div className="text-label-primary">{title}</div>
          <div className="cursor-pointer flex justify-end text-label-primary">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <DialogContent className="light">
        <div className="mb-4 text-label-primary">{t('organization_dialog.type_organization_name_minimum_2_letters')}</div>

        <div className="mb-4">
          <input
            placeholder={t('organization_dialog.search_organizations')}
            className="w-full border border-solid border-gray-300 rounded px-3 py-2"
            type="text"
            value={searchValue}
            onChange={handleNewInput}
          />
        </div>

        <div className="h-[32rem] overflow-auto border border-gray-200 rounded">
          {organizations.map((organization) => (
            <div
              key={organization.id}
              className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleConfirm(organization)}
            >
              <div className="font-medium">{organization.name}</div>
              {organization.description && <div className="text-sm text-gray-600 mt-1">{organization.description}</div>}
              <div className="text-xs text-gray-500 mt-1">{organization.type}</div>
            </div>
          ))}
          {organizations.length === 0 && searchValue.length >= 2 && (
            <div className="p-4 text-center text-label-secondary">{t('organization_dialog.no_organizations_found')}</div>
          )}
          {searchValue.length < 2 && (
            <div className="p-4 text-center text-label-secondary">{t('organization_dialog.type_at_least_2_characters')}</div>
          )}
        </div>

        <div className="grid grid-cols-2 mt-4">
          <div>
            <Button onClick={handleCancel}>{t('cancel')}</Button>
          </div>
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};
