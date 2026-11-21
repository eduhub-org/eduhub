import { FC, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '../../common/Button';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { SET_DO_NOT_CONTACT } from '../../../queries/experts';
import { ExpertsList_User } from '../../../queries/__generated__/ExpertsList';
import { ExpertRole } from './expertDirectory';
import { ExpertNotes, NoteOrganization } from './ExpertNotes';

interface ExpandableExpertRowProps {
  expert: ExpertsList_User;
  roles: ExpertRole[];
  matchedRoleKeys: Set<string>;
  currentUserId: string | undefined;
  isAdmin: boolean;
  noteOrganizations: NoteOrganization[];
  onChanged: () => void;
  onError: (message: string) => void;
}

export const ExpandableExpertRow: FC<ExpandableExpertRowProps> = ({
  expert,
  roles,
  matchedRoleKeys,
  currentUserId,
  isAdmin,
  noteOrganizations,
  onChanged,
  onError,
}) => {
  const t = useTranslations('manageExperts');
  const [confirmingMark, setConfirmingMark] = useState(false);
  const [setDoNotContact, { loading: savingMark }] = useRoleMutation(SET_DO_NOT_CONTACT);

  const changeMark = async (doNotContact: boolean) => {
    setConfirmingMark(false);
    try {
      await setDoNotContact({ variables: { userId: expert.id, doNotContact } });
      onChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
  };

  const name = [expert.firstName, expert.lastName].filter(Boolean).join(' ');

  return (
    <div className="bg-fill-primary text-label-primary light p-4 flex flex-col gap-6">
      {expert.doNotContact && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-primary p-2 text-sm">
          <span>{t('do_not_contact_hint')}</span>
          {isAdmin && (
            <Button onClick={() => changeMark(false)} disabled={savingMark}>
              {t('unmark_do_not_contact')}
            </Button>
          )}
        </div>
      )}

      <div>
        <h4 className="font-medium mb-2">{t('roles')}</h4>
        {roles.length === 0 ? (
          <p className="text-label-secondary text-sm">{t('no_roles')}</p>
        ) : (
          <div className="text-sm">
            <div className="hidden md:grid md:grid-cols-12 gap-2 py-1 font-medium border-b border-border-primary">
              <div className="col-span-5">{t('title')}</div>
              <div className="col-span-3">{t('context')}</div>
              <div className="col-span-3">{t('role')}</div>
              <div className="col-span-1">{t('year')}</div>
            </div>
            {roles.map((role) => {
              const matched = matchedRoleKeys.has(role.key);
              return (
                <div
                  key={role.key}
                  className={`flex flex-col md:grid md:grid-cols-12 gap-x-2 py-1 border-b border-border-primary last:border-b-0 ${
                    matched ? 'bg-bg-secondary font-medium' : 'text-label-secondary'
                  }`}
                >
                  <div className="md:col-span-5 truncate" title={role.title}>
                    {matched && <span className="mr-1 text-xs uppercase">{t('matched_role')}:</span>}
                    {role.title}
                  </div>
                  <div className="md:col-span-3 truncate" title={role.context}>
                    {role.context || '-'}
                  </div>
                  <div className="md:col-span-3">{t(`role_${role.kind}`)}</div>
                  <div className="md:col-span-1">{role.date ? role.date.getFullYear() : '-'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ExpertNotes
        expertId={expert.id}
        notes={expert.ExpertNotes}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        organizations={noteOrganizations}
        onChanged={onChanged}
        onError={onError}
      />

      {!expert.doNotContact && (
        <div>
          <Button onClick={() => setConfirmingMark(true)} disabled={savingMark}>
            {t('mark_do_not_contact')}
          </Button>
        </div>
      )}

      <QuestionConfirmationDialog
        open={confirmingMark}
        question={t('mark_do_not_contact_question', { name })}
        confirmationText={t('mark_do_not_contact')}
        onClose={() => setConfirmingMark(false)}
        onConfirm={() => changeMark(true)}
      />
    </div>
  );
};
