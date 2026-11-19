import { FC, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import UserAvatar from '../../common/UserAvatar';
import { useManageQuery } from '../../../hooks/authedQuery';
import { SEMANTIC_EXPERT_SEARCH, SIMILAR_EXPERTS } from '../../../queries/experts';
import { SemanticExpertSearch } from '../../../queries/__generated__/SemanticExpertSearch';
import { SimilarExperts as SimilarExpertsData } from '../../../queries/__generated__/SimilarExperts';
import { ExpertsList_User } from '../../../queries/__generated__/ExpertsList';
import { closestRole, expertRoles, matchesAllWords, organizationOf, sourcesCondition } from './expertDirectory';
import { ExpertContactActions } from './ExpertContactActions';

const MIN_SEARCH_LENGTH = 3;
const SHOWN = 20;

interface SimilarExpertsProps {
  /** The search as applied to the table (debounced), so both lists answer the same search. */
  search: string;
  isAdmin: boolean;
  scope: Record<string, unknown>;
}

/**
 * Experts whose courses, sessions or projects are close in meaning to the search but did not match
 * its words (ADR 0004): listed below the keyword results, each with the role it is similar to.
 */
export const SimilarExperts: FC<SimilarExpertsProps> = ({ search, isAdmin, scope }) => {
  const t = useTranslations('manageExperts');
  const query = search.trim();
  const tooShort = query.length < MIN_SEARCH_LENGTH;

  const {
    data: searchData,
    loading: searching,
    error: searchError,
  } = useManageQuery<SemanticExpertSearch>(SEMANTIC_EXPERT_SEARCH, {
    variables: { query },
    skip: tooShort,
  });
  const result = searchData?.semanticExpertSearch;
  const matches = useMemo(() => (tooShort ? [] : result?.matches ?? []), [tooShort, result]);

  const { data, loading, error: peopleError } = useManageQuery<SimilarExpertsData>(SIMILAR_EXPERTS, {
    variables: { sources: sourcesCondition(matches), scope, isAdmin },
    skip: matches.length === 0,
  });

  const ranked = useMemo(
    () =>
      ((data?.User ?? []) as ExpertsList_User[])
        .flatMap((expert) => {
          const roles = expertRoles(expert);
          // People the keyword search already lists stay up there.
          if (matchesAllWords(expert, roles, query)) return [];
          const closest = closestRole(roles, matches);
          return closest ? [{ expert, ...closest }] : [];
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, SHOWN),
    [data, matches, query]
  );

  // A failed request (Apollo error) or a failed search (success: false) is not an empty result.
  const unavailable = Boolean(searchError || peopleError || result?.success === false);

  if (tooShort || result?.enabled === false) return null;

  return (
    <section className="mt-8">
      <h3 className="text-lg font-medium">{t('similar_headline')}</h3>
      <p className="text-sm text-label-secondary mb-3">{t('similar_hint')}</p>
      {(searching || loading) && <p className="text-sm text-label-secondary">{t('similar_loading')}</p>}
      {!searching && !loading && unavailable && (
        <p className="text-sm text-label-secondary">{t('similar_unavailable')}</p>
      )}
      {!searching && !loading && !unavailable && ranked.length === 0 && (
        <p className="text-sm text-label-secondary">{t('similar_none')}</p>
      )}
      <ul className="flex flex-col gap-2">
        {ranked.map(({ expert, role, similarity }) => (
          <li
            key={expert.id}
            className={`flex items-center gap-3 rounded-xl bg-fill-primary text-label-primary light p-3 ${
              expert.doNotContact ? 'opacity-60' : ''
            }`}
          >
            <UserAvatar
              picture={expert.picture ?? null}
              imageResolution={64}
              imageSize={32}
              alt=""
              ariaHidden
              className="rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {[expert.firstName, expert.lastName].filter(Boolean).join(' ')}
                {organizationOf(expert) && (
                  <span className="ml-2 text-sm font-normal text-label-secondary">{organizationOf(expert)}</span>
                )}
                {expert.doNotContact && (
                  <span className="ml-2 text-xs text-label-secondary">{t('do_not_contact')}</span>
                )}
              </div>
              <div className="text-xs text-label-secondary truncate" title={role.title}>
                {t('similar_to', {
                  role: t(`role_${role.kind}`),
                  title: role.title,
                  year: role.date ? ` (${role.date.getFullYear()})` : '',
                  percent: Math.round(similarity * 100),
                })}
              </div>
            </div>
            <ExpertContactActions expert={expert} />
          </li>
        ))}
      </ul>
    </section>
  );
};
