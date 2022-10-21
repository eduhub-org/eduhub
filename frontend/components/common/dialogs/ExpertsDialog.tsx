import { Dialog, DialogContent, DialogTitle } from "@material-ui/core";
import { FC, useCallback, useState } from "react";
import { DebounceInput } from "react-debounce-input";
import { MdClose } from "react-icons/md";
import { makeFullName } from "../../../helpers/util";
import { useAdminQuery } from "../../../hooks/authedQuery";
import { EXPERT_LIST } from "../../../queries/expert";
import {
  ExpertList,
  ExpertListVariables,
  ExpertList_Expert,
} from "../../../queries/__generated__/ExpertList";
import { Button } from "../Button";
import Searchbar from "../Searchbar";

interface IProps {
  title: string;
  onClose: (confirmed: boolean, user: ExpertList_Expert | null) => void;
  open: boolean;
}

const ExpertsDialog: FC<IProps> = (props) => {
  const [searchValue, setSearchValue] = useState("");

  const handleCancel = useCallback(() => {
    setSearchValue("");
    props.onClose(false, null);
  }, [props]);

  const experts = useAdminQuery<ExpertList, ExpertListVariables>(EXPERT_LIST, {
    variables: {
      limit: 15,
      offset: 0,
      where: {
        _or: [
          { User: { firstName: { _ilike: `%${searchValue}%` } } },
          { User: { lastName: { _ilike: `%${searchValue}%` } } },
          { User: { email: { _ilike: `%${searchValue}%` } } },
        ],
      },
    },
    skip: searchValue.trim().length < 3,
  });

  const handleNewInput = useCallback(
    (value) => {
      setSearchValue(value);
    },
    [setSearchValue]
  );

  const onUserClick = useCallback(
    (course: ExpertList_Expert) => {
      setSearchValue("");
      props.onClose(false, course);
    },
    [setSearchValue, props]
  );
  const users = experts.data?.Expert || [];

  return (
    <Dialog open={props.open} onClose={handleCancel}>
      <DialogTitle>
        <div className="grid grid-cols-2">
          <div>{props.title}</div>
          <div className="cursor-pointer flex justify-end">
            <MdClose onClick={handleCancel} />
          </div>
        </div>
      </DialogTitle>

      <DialogContent>
        <div>
          Suche Nutzer anhand Vorname, Nachname oder E-Mail.
          <br />
          Mindestens 3 Buchstaben eingeben. <br />
          Nutzer per Klick auswählen.
        </div>
        <div className="py-2">
          <Searchbar
            placeholder="Suchwert"
            onChangeCallback={handleNewInput}
            searchText={searchValue}
            autoFocus={true}
          />
        </div>

        {props.open && (
          <div className="h-[32rem] w-[26rem] overflow-auto">
            {users.map((expert, index) => (
              <div key={index} className="pb-1">
                <TagWithTwoText expert={expert} onClick={onUserClick} />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center my-2">
          <div>
            <Button onClick={handleCancel}>Abbrechen</Button>
          </div>
          <div />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpertsDialog;

interface IPropsCourse {
  expert: ExpertList_Expert;
  onClick: (e: ExpertList_Expert) => void;
}

const TagWithTwoText: FC<IPropsCourse> = ({ expert, onClick }) => {
  const clickThis = useCallback(() => {
    onClick(expert);
  }, [onClick, expert]);
  return (
    <div
      onClick={clickThis}
      className="flex flex-col bg-edu-row-color px-2 py-1 cursor-pointer border border-slate-300 hover:border-solid hover:border-indigo-300"
    >
      <p className="pr-2">
        {makeFullName(expert.User.firstName, expert.User.lastName)}
      </p>
      <p className="text-gray-600">{expert.User.email}</p>
    </div>
  );
};
