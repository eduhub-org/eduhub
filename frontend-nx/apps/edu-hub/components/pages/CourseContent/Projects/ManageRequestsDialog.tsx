import { FC, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';
import { makeFullName } from '../../../../helpers/util';
import {
  UPDATE_PROJECT_AUTHOR_PARTICIPATION_STATUS,
  DELETE_PROJECT_AUTHOR,
} from '../../../../queries/project';
import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectRow } from './types';

interface ManageRequestsDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRow;
  refetchQueries: string[];
}

const ManageRequestsDialog: FC<ManageRequestsDialogProps> = ({
  open,
  onClose,
  project,
  refetchQueries,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');

  const [updateParticipation, { loading: updating }] = useRoleMutation(
    UPDATE_PROJECT_AUTHOR_PARTICIPATION_STATUS,
    { refetchQueries }
  );
  const [deleteAuthor, { loading: deleting }] = useRoleMutation(DELETE_PROJECT_AUTHOR, {
    refetchQueries,
  });

  const requested = (project.ProjectAuthors ?? []).filter(
    (a) => a.participationStatus === ProjectParticipationStatus_enum.REQUESTED
  );

  const handleAccept = useCallback(
    (id: number) =>
      updateParticipation({
        variables: { id, value: ProjectParticipationStatus_enum.ACCEPTED },
      }),
    [updateParticipation]
  );

  const handleReject = useCallback(
    (id: number) => deleteAuthor({ variables: { id } }),
    [deleteAuthor]
  );

  const busy = updating || deleting;

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t('projects.manage_requests.title')}
      ariaLabelledBy="manage-requests-dialog"
      maxWidth="sm"
      actions={
        <div className="flex justify-end">
          <Button onClick={onClose}>{tCommon('close')}</Button>
        </div>
      }
    >
      {requested.length === 0 ? (
        <p className="text-label-secondary">{t('projects.manage_requests.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {requested.map((request) => {
            const fullName = makeFullName(
              request.User?.firstName ?? '',
              request.User?.lastName ?? ''
            );
            return (
              <li
                key={request.id}
                className="flex items-center justify-between gap-3 border border-border-primary rounded p-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {request.User?.picture ? (
                    <img
                      src={request.User.picture}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                      {(fullName || '?').slice(0, 1)}
                    </div>
                  )}
                  <span className="truncate">{fullName || tCommon('unknown_user')}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button onClick={() => handleReject(request.id)} disabled={busy}>
                    {t('projects.manage_requests.decline')}
                  </Button>
                  <Button filled onClick={() => handleAccept(request.id)} disabled={busy}>
                    {t('projects.manage_requests.accept')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DialogShell>
  );
};

export default ManageRequestsDialog;
