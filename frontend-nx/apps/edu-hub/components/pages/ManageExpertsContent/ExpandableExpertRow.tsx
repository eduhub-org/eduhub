import { FC, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '../../common/Button';
import { QuestionConfirmationDialog } from '../../common/dialogs/QuestionConfirmationDialog';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { SET_DO_NOT_CONTACT } from '../../../queries/experts';
import { ExpertsList_User } from '../../../queries/__generated__/ExpertsList';
import {
  ExpertMatch,
  ExpertRole,
  SimilarRole,
  findMatches,
  highlight,
  leadExcerpt,
  searchWords,
} from './expertDirectory';
import { ExpertNotes, NoteOrganization } from './ExpertNotes';

interface ExpandableExpertRowProps {
  expert: ExpertsList_User;
  roles: ExpertRole[];
  /** The search the table shows; its hits are listed first, with readable excerpts. */
  search: string;
  /** Roles the semantic search found close in meaning to the search, best first. */
  similar?: SimilarRole[];
  currentUserId: string | undefined;
  isAdmin: boolean;
  noteOrganizations: NoteOrganization[];
  onChanged: () => void;
  onError: (message: string) => void;
}

// Enough text around a hit to read it as a sentence.
const EXCERPT_CONTEXT = 160;
// Without a search, the newest involvements are shown and the rest stay collapsed.
const SHOWN_WITHOUT_SEARCH = 5;
// Roles similar in meaning, beyond the keyword hits: the closest few explain the result.
const SIMILAR_SHOWN = 3;

const Highlighted: FC<{ text: string; words: string[] }> = ({ text, words }) => (
  <>
    {highlight(text, words).map((segment, index) =>
      // The brand colour is a CSS variable, so Tailwind cannot tint a background with it (bg-brand/20
      // leaves the browser's yellow); an underline in the brand colour marks the hit instead.
      segment.hit ? (
        <mark
          key={index}
          className="bg-transparent font-semibold text-label-primary underline decoration-brand decoration-2 underline-offset-2"
        >
          {segment.text}
        </mark>
      ) : (
        <span key={index}>{segment.text}</span>
      )
    )}
  </>
);

const RoleLine: FC<{ role: ExpertRole }> = ({ role }) => {
  const t = useTranslations('manageExperts');
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="font-medium text-label-primary">{role.title}</span>
      <span className="text-label-secondary">
        {[t(`role_${role.kind}`), role.context, role.date?.getFullYear()].filter(Boolean).join(' · ')}
      </span>
    </div>
  );
};

/** The hits of one role (or of the person's own fields), each with the field it is in. */
const MatchGroup: FC<{ role: ExpertRole | null; matches: ExpertMatch[]; words: string[] }> = ({
  role,
  matches,
  words,
}) => {
  const t = useTranslations('manageExperts');
  return (
    <li className="rounded-lg border border-border-primary p-3">
      {role ? <RoleLine role={role} /> : <div className="text-sm font-medium">{t('match_person')}</div>}
      <dl className="mt-2 flex flex-col gap-1 text-sm">
        {matches.map((match) => (
          <div key={match.field} className="flex flex-col md:flex-row md:gap-2">
            <dt className="shrink-0 text-xs uppercase tracking-wide text-label-secondary md:w-28 md:pt-0.5">
              {t(`match_field.${match.field}`)}
            </dt>
            <dd className="leading-relaxed text-label-primary">
              <Highlighted text={match.snippet} words={words} />
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
};

/** A role close in meaning to the search: how close, and what it is about. */
const SimilarGroup: FC<SimilarRole> = ({ role, similarity }) => {
  const t = useTranslations('manageExperts');
  const about = role.texts.find(({ field, value }) => field !== 'title' && field !== 'course_title' && value)?.value;
  return (
    <li className="rounded-lg border border-border-primary p-3">
      <RoleLine role={role} />
      <div className="mt-1 text-xs uppercase tracking-wide text-label-secondary">
        {t('similar_role', { percent: Math.round(similarity * 100) })}
      </div>
      {about && <p className="mt-1 text-sm leading-relaxed text-label-primary">{leadExcerpt(about)}</p>}
    </li>
  );
};

export const ExpandableExpertRow: FC<ExpandableExpertRowProps> = ({
  expert,
  roles,
  search,
  similar = [],
  currentUserId,
  isAdmin,
  noteOrganizations,
  onChanged,
  onError,
}) => {
  const t = useTranslations('manageExperts');
  const [confirmingMark, setConfirmingMark] = useState(false);
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [setDoNotContact, { loading: savingMark }] = useRoleMutation(SET_DO_NOT_CONTACT);

  const words = useMemo(() => searchWords(search), [search]);
  // Hits grouped by role, in the order findMatches gives (person fields, then newest roles).
  const matchGroups = useMemo(() => {
    const groups = new Map<string, { role: ExpertRole | null; matches: ExpertMatch[] }>();
    findMatches(expert, roles, search, EXCERPT_CONTEXT).forEach((match) => {
      const key = match.role?.key ?? 'person';
      const group = groups.get(key) ?? { role: match.role, matches: [] };
      group.matches.push(match);
      groups.set(key, group);
    });
    return Array.from(groups.values());
  }, [expert, roles, search]);

  const keywordKeys = new Set(matchGroups.flatMap((group) => (group.role ? [group.role.key] : [])));
  const similarGroups = similar.filter(({ role }) => !keywordKeys.has(role.key)).slice(0, SIMILAR_SHOWN);
  const hasHits = matchGroups.length > 0 || similarGroups.length > 0;
  const matchedKeys = new Set([...keywordKeys, ...similarGroups.map(({ role }) => role.key)]);
  const otherRoles = roles.filter((role) => !matchedKeys.has(role.key));
  // With a search the other involvements are context only, so they start collapsed.
  const collapsedByDefault = words.length > 0 ? 0 : SHOWN_WITHOUT_SEARCH;
  const visibleRoles = showAllRoles ? otherRoles : otherRoles.slice(0, collapsedByDefault);
  const hiddenCount = otherRoles.length - visibleRoles.length;

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

      {hasHits && (
        <section>
          <h4 className="font-medium mb-2">{t('matches_headline', { search: search.trim() })}</h4>
          <ul className="flex flex-col gap-2">
            {matchGroups.map((group) => (
              <MatchGroup key={group.role?.key ?? 'person'} role={group.role} matches={group.matches} words={words} />
            ))}
            {similarGroups.map((group) => (
              <SimilarGroup key={group.role.key} {...group} />
            ))}
          </ul>
        </section>
      )}

      <ExpertNotes
        expertId={expert.id}
        notes={expert.ExpertNotes}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        organizations={noteOrganizations}
        onChanged={onChanged}
        onError={onError}
      />

      <section>
        <h4 className="font-medium mb-2">{hasHits ? t('involvements_other') : t('involvements')}</h4>
        {roles.length === 0 && <p className="text-label-secondary text-sm">{t('no_roles')}</p>}
        {visibleRoles.length > 0 && (
          <ul className="flex flex-col divide-y divide-border-primary">
            {visibleRoles.map((role) => (
              <li key={role.key} className="py-1.5">
                <RoleLine role={role} />
              </li>
            ))}
          </ul>
        )}
        {hiddenCount > 0 && (
          <button type="button" className="mt-2 text-sm underline hover:text-brand" onClick={() => setShowAllRoles(true)}>
            {t('involvements_show', { count: hiddenCount })}
          </button>
        )}
        {showAllRoles && otherRoles.length > collapsedByDefault && (
          <button type="button" className="mt-2 text-sm underline hover:text-brand" onClick={() => setShowAllRoles(false)}>
            {t('involvements_hide')}
          </button>
        )}
      </section>

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
