import { FC, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { MdDeleteOutline, MdEdit } from 'react-icons/md';

import { Button } from '../../common/Button';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { DELETE_EXPERT_NOTE, INSERT_EXPERT_NOTE, UPDATE_EXPERT_NOTE } from '../../../queries/experts';
import { ExpertsList_User_ExpertNotes } from '../../../queries/__generated__/ExpertsList';

export interface NoteOrganization {
  id: number;
  name: string;
}

interface ExpertNotesProps {
  expertId: string;
  notes: ExpertsList_User_ExpertNotes[];
  currentUserId: string | undefined;
  isAdmin: boolean;
  /** Organizations an org admin writes notes for; admins write organization-less notes. */
  organizations: NoteOrganization[];
  onChanged: () => void;
  onError: (message: string) => void;
}

// An edit within a minute of writing is not worth an "edited" mark.
const EDITED_THRESHOLD_MS = 60_000;

const NoteText: FC<{ value: string; onChange: (value: string) => void; placeholder?: string }> = ({
  value,
  onChange,
  placeholder,
}) => (
  <textarea
    className="w-full rounded-lg border border-border-primary bg-fill-primary p-2 text-sm text-label-primary"
    rows={3}
    value={value}
    placeholder={placeholder}
    onChange={(event) => onChange(event.target.value)}
  />
);

/** Expert Notes (CONTEXT.md): a dated log; authors edit their own entries, admins delete any. */
export const ExpertNotes: FC<ExpertNotesProps> = ({
  expertId,
  notes,
  currentUserId,
  isAdmin,
  organizations,
  onChanged,
  onError,
}) => {
  const t = useTranslations('manageExperts');
  const format = useFormatter();
  const [draft, setDraft] = useState('');
  const [organizationId, setOrganizationId] = useState<number | null>(organizations[0]?.id ?? null);
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [insertNote, { loading: inserting }] = useRoleMutation(INSERT_EXPERT_NOTE);
  const [updateNote, { loading: updating }] = useRoleMutation(UPDATE_EXPERT_NOTE);
  const [deleteNote] = useRoleMutation(DELETE_EXPERT_NOTE);

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      onChanged();
      return true;
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  const noteOrganizationId = isAdmin ? null : organizationId ?? organizations[0]?.id ?? null;
  const canWrite = isAdmin || noteOrganizationId !== null;

  const addNote = async () => {
    const text = draft.trim();
    if (!text || !canWrite) return;
    const object = isAdmin
      ? { expertId, text, authorId: currentUserId }
      : { expertId, text, organizationId: noteOrganizationId };
    if (await run(() => insertNote({ variables: { object } }))) setDraft('');
  };

  const saveEdit = async () => {
    if (!editing?.text.trim()) return;
    if (await run(() => updateNote({ variables: { id: editing.id, text: editing.text.trim() } }))) setEditing(null);
  };

  const confirmDelete = async () => {
    const id = deletingId;
    setDeletingId(null);
    if (id !== null) await run(() => deleteNote({ variables: { id } }));
  };

  const formatDate = (value: string) => format.dateTime(new Date(value), { dateStyle: 'medium' });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="font-medium">{t('notes')}</h4>
        <p className="text-xs text-label-secondary">{t('notes_hint')}</p>
      </div>

      {notes.length === 0 && <p className="text-sm text-label-secondary">{t('no_notes')}</p>}

      <ul className="flex flex-col gap-2">
        {notes.map((note) => {
          const isOwn = Boolean(currentUserId) && note.authorId === currentUserId;
          const edited =
            new Date(note.updated_at).getTime() - new Date(note.created_at).getTime() > EDITED_THRESHOLD_MS;
          const author = note.Author
            ? [note.Author.firstName, note.Author.lastName].filter(Boolean).join(' ')
            : t('unknown_author');
          return (
            <li key={note.id} className="rounded-lg border border-border-primary p-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-label-secondary">
                  {formatDate(note.created_at)} · {author}
                  {note.Organization ? ` · ${note.Organization.name}` : ` · ${t('note_visibility_admin')}`}
                  {edited && ` · ${t('edited', { date: formatDate(note.updated_at) })}`}
                </div>
                <div className="flex gap-1 shrink-0">
                  {isOwn && editing?.id !== note.id && (
                    <button
                      type="button"
                      aria-label={t('edit')}
                      title={t('edit')}
                      className="p-1 hover:text-brand"
                      onClick={() => setEditing({ id: note.id, text: note.text })}
                    >
                      <MdEdit />
                    </button>
                  )}
                  {(isOwn || isAdmin) && (
                    <button
                      type="button"
                      aria-label={t('delete')}
                      title={t('delete')}
                      className="p-1 hover:text-brand"
                      onClick={() => setDeletingId(note.id)}
                    >
                      <MdDeleteOutline />
                    </button>
                  )}
                </div>
              </div>
              {editing?.id === note.id ? (
                <div className="mt-2 flex flex-col gap-2">
                  <NoteText value={editing.text} onChange={(text) => setEditing({ id: note.id, text })} />
                  <div className="flex gap-2">
                    <Button filled onClick={saveEdit} disabled={updating || !editing.text.trim()}>
                      {t('save')}
                    </Button>
                    <Button onClick={() => setEditing(null)}>{t('cancel')}</Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap">{note.text}</p>
              )}
            </li>
          );
        })}
      </ul>

      {canWrite && (
        <div className="flex flex-col gap-2">
          <NoteText value={draft} onChange={setDraft} placeholder={t('note_placeholder')} />
          <div className="flex flex-wrap items-center gap-2">
            {!isAdmin && organizations.length > 1 && (
              <label className="flex items-center gap-2 text-sm">
                {t('note_for_organization')}
                <select
                  className="rounded border border-border-primary bg-fill-primary p-1 text-label-primary"
                  value={noteOrganizationId ?? ''}
                  onChange={(event) => setOrganizationId(Number(event.target.value))}
                >
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button filled onClick={addNote} disabled={inserting || !draft.trim()}>
              {t('add_note')}
            </Button>
          </div>
        </div>
      )}

      <QuestionConfirmationDialog
        open={deletingId !== null}
        question={t('delete_note_question')}
        confirmationText={t('delete')}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
