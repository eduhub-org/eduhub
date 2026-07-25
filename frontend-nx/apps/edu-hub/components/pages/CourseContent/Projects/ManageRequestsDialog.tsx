import { FC, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRoleMutation } from '../../../../hooks/authedMutation';
import { DialogShell } from '../../../common/dialogs/DialogShell';
import { Button } from '../../../common/Button';
import UserCard from '../../../common/UserCard';
import {
  UPDATE_PROJECT_AUTHOR_PARTICIPATION_STATUS,
} from '../../../../queries/project';
import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import { ProjectRow } from './types';
import { PARTICIPANT_PROJECT_ROLE_CONTEXT } from './participantProjectRole';

interface ManageRequestsDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectRow;
  refetchQueries: string[];
  onActionError: (message: string) => void;
}

const ManageRequestsDialog: FC<ManageRequestsDialogProps> = ({
  open,
  onClose,
  project,
  refetchQueries,
  onActionError,
}) => {
  const t = useTranslations('course');
  const tCommon = useTranslations('common');

  const [updateParticipation, { loading: updating }] = useRoleMutation(
    UPDATE_PROJECT_AUTHOR_PARTICIPATION_STATUS,
    { refetchQueries, context: PARTICIPANT_PROJECT_ROLE_CONTEXT }
  );

  const requested = (project.ProjectAuthors ?? []).filter(
    (a) => a.participationStatus === ProjectParticipationStatus_enum.REQUESTED
  );

  useEffect(() => {
    if (open && requested.length === 0) {
      onClose();
    }
  }, [open, requested.length, onClose]);

  const handleAccept = useCallback(
    async (id: number) => {
      try {
        const result = await updateParticipation({
          variables: { id, value: ProjectParticipationStatus_enum.ACCEPTED },
        });
        if (!result.data?.update_ProjectAuthor_by_pk) {
          onActionError(t('projects.action_failed'));
        }
      } catch (err) {
        onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
      }
    },
    [onActionError, t, updateParticipation]
  );

  const handleReject = useCallback(
    async (id: number) => {
      try {
        const result = await updateParticipation({
          variables: { id, value: ProjectParticipationStatus_enum.DECLINED },
        });
        if (!result.data?.update_ProjectAuthor_by_pk) {
          onActionError(t('projects.action_failed'));
        }
      } catch (err) {
        onActionError(err instanceof Error ? err.message : t('projects.action_failed'));
      }
    },
    [onActionError, t, updateParticipation]
  );

  const busy = updating;

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
            const user = request.User;
            return (
              <li
                key={request.id}
                className="flex items-center justify-between gap-3 border border-border-primary rounded p-2"
              >
                <div className="min-w-0 flex-1">
                  {user ? (
                    <UserCard
                      className="flex items-start"
                      user={{
                        id: user.id,
                        firstName: user.firstName ?? '',
                        lastName: user.lastName ?? '',
                        picture: user.picture ?? null,
                        externalProfile: user.externalProfile ?? null,
                        organizationName: user.Organization?.name?.trim() || null,
                      }}
                      size="compact"
                    />
                  ) : (
                    <span className="text-sm text-label-secondary">{tCommon('unknown_user')}</span>
                  )}
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
