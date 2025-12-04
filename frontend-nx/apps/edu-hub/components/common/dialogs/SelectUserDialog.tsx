import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import useTranslation from 'next-translate/useTranslation';
import { ChangeEvent, FC, useCallback, useState, useMemo } from 'react';
import { MdClose } from 'react-icons/md';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { USER_SELECTION_WITH_FILTER } from '../../../queries/user';
import {
  UserSelectionWithFilter,
  UserSelectionWithFilterVariables,
  UserSelectionWithFilter_User,
} from '../../../queries/__generated__/UserSelectionWithFilter';
import { createMultiWordSearchCondition } from '../../../helpers/searchUtils';
import { order_by } from '../../../__generated__/globalTypes';

import { Button } from '../Button';
import SelectUserRow from './SelectUserRow';

interface IProps {
  title: string;
  onClose: (confirmed: boolean, user: UserSelectionWithFilter_User | null) => void;
  open: boolean;
  onAddNewUser?: (searchValue: string) => void;
  showAddNewUserOption?: boolean;
}

// Search user by some search value (partial name or email)
// then select the user from a select
export const SelectUserDialog: FC<IProps> = ({ onClose, open, title, onAddNewUser, showAddNewUserOption = false }) => {
  const [searchValue, setSearchValue] = useState('');
  const { t } = useTranslation();

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
    (user: UserSelectionWithFilter_User) => {
      setSearchValue('');
      onClose(true, user);
    },
    [onClose]
  );

  // Create filter condition using multi-word search
  const filter = useMemo(() => {
    if (searchValue.trim().length < 2) {
      return {};
    }
    return createMultiWordSearchCondition(searchValue.trim(), ['firstName', 'lastName', 'email']);
  }, [searchValue]);

  // Query users with dynamic filter - uses current user's role (admin/instructor) to access email column
  const { data, loading } = useRoleQuery<UserSelectionWithFilter, UserSelectionWithFilterVariables>(
    USER_SELECTION_WITH_FILTER,
    {
      variables: {
        limit: 100,
        filter,
        order_by: [{ lastName: order_by.asc }, { firstName: order_by.asc }],
      },
      skip: !open,
    }
  );

  const users = data?.User || [];
  const hasSearched = searchValue.trim().length >= 2;
  const showNoResults = hasSearched && !loading && users.length === 0;
  const shouldShowAddNewUser = showAddNewUserOption && onAddNewUser && showNoResults;

  const handleAddNewUser = useCallback(() => {
    if (onAddNewUser) {
      onAddNewUser(searchValue);
    }
  }, [onAddNewUser, searchValue]);

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{title}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <DialogContent>
        <div className="mb-4">{t('common:select_user_dialog.type_name_or_email_minimum_2_letters')}</div>

        <div className="mb-4">
          <input
            placeholder={t('common:search')}
            className="w-full border border-solid border-gray-300 rounded px-3 py-2"
            type="text"
            value={searchValue}
            onChange={handleNewInput}
          />
        </div>

        <div className="h-[32rem] overflow-auto border border-gray-200 rounded">
          {users.length > 0 && (
            <>
              {users.map((user) => (
                <SelectUserRow user={user} key={user.id} onClick={handleConfirm} />
              ))}
            </>
          )}
          {showNoResults && shouldShowAddNewUser && (
            <div className="p-4">
              <div className="text-gray-500 mb-2 text-center">{t('common:select_user_dialog.no_users_found')}</div>
              <div
                onClick={handleAddNewUser}
                className="w-full cursor-pointer bg-blue-50 hover:bg-blue-100 p-3 rounded text-blue-600 font-medium text-center"
              >
                {t('common:select_user_dialog.add_new_user')}
              </div>
            </div>
          )}
          {showNoResults && !shouldShowAddNewUser && (
            <div className="p-4 text-center text-gray-500">{t('common:select_user_dialog.no_users_found')}</div>
          )}
          {loading && hasSearched && (
            <div className="p-4 text-center text-gray-500">{t('common:loading')}</div>
          )}
          {searchValue.trim().length < 2 && (
            <div className="p-4 text-center text-gray-500">{t('common:select_user_dialog.type_name_or_email_minimum_2_letters')}</div>
          )}
        </div>

        <div className="grid grid-cols-2 mt-4">
          <div>
            <Button onClick={handleCancel}>{t('common:cancel')}</Button>
          </div>
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};
