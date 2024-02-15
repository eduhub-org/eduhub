import { Dialog, DialogContent, DialogTitle } from '@material-ui/core';
import useTranslation from 'next-translate/useTranslation';
import { ChangeEvent, FC, useCallback, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useAuthedQuery } from '../../../hooks/authedQuery';
import { USER_SELECTION_ONE_PARAM, USER_SELECTION_TWO_PARAMS } from '../../../queries/user';
import {
  UserForSelection1,
  UserForSelection1Variables,
  UserForSelection1_User,
} from '../../../queries/__generated__/UserForSelection1';
import { UserForSelection2, UserForSelection2Variables } from '../../../queries/__generated__/UserForSelection2';

import { Button } from '../Button';
import SelectUserRow from './SelectUserRow';

interface IProps {
  title: string;
  onClose: (confirmed: boolean, user: UserForSelection1_User | null) => void;
  open: boolean;
}

const getSearchVars = (searchValue: string) => {
  const split = searchValue.split(' ');
  if (split.length > 1) {
    return {
      searchValue1: `%${split[0]}%`,
      searchValue2: `%${split[1]}%`,
    };
  } else {
    return {
      searchValue1: `%${searchValue}%`,
      searchValue2: '',
    };
  }
};

// Search user by some search value (partial name or email)
// then select the user from a select
export const SelectUserDialog: FC<IProps> = ({ onClose, open, title }) => {
  const [searchValue, setSearchValue] = useState('');
  const handleNewInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchValue(event.target.value);
    },
    [setSearchValue]
  );

  const handleCancel = useCallback(() => {
    setSearchValue('');
    onClose(false, null);
  }, [onClose]);
  const handleConfirm = useCallback(
    (user: UserForSelection1_User) => {
      setSearchValue('');
      onClose(true, user);
    },
    [onClose]
  );

  // I can't figure out to do a single graphql query
  // that handles search hits on firstName and lastName together and separately.
  // Thus I have defined two query types and they are used depending on the provided input

  // in case there is no space just search with the full value
  const result1 = useAuthedQuery<UserForSelection1, UserForSelection1Variables>(USER_SELECTION_ONE_PARAM, {
    variables: {
      searchValue: `%${searchValue.trim()}%`,
    },
    skip: searchValue.length < 3 || searchValue.trim().includes(' '),
  });
  // in case there is a space search for a user that has a fitting first and last name
  // by splitting the search string
  const result2 = useAuthedQuery<UserForSelection2, UserForSelection2Variables>(USER_SELECTION_TWO_PARAMS, {
    variables: getSearchVars(searchValue.trim()),
    skip: searchValue.length < 3 || !searchValue.trim().includes(' '),
  });

  const users = [...(result1.data?.User || []), ...(result2.data?.User || [])];

  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{title}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <DialogContent>
        <div>{t('type_name_or_email_minimum_3_letters')}</div>

        <div>
          <input
            placeholder="Suchwert"
            className="mb-2 w-full border border-solid"
            type="text"
            value={searchValue}
            onChange={handleNewInput}
          />
        </div>

        <div className="h-[32rem] w-[26rem] overflow-auto">
          {users.map((user) => (
            <SelectUserRow user={user} key={user.id} onClick={handleConfirm} />
          ))}
        </div>

        <div className="grid grid-cols-2 mb-2">
          <div>
            <Button onClick={handleCancel}>{t('cancel')}</Button>
          </div>
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};
