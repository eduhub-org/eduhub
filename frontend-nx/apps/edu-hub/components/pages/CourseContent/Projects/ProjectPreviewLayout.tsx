import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import UserCard from '../../../common/UserCard';
import { ProjectRow } from './types';

export const PROJECT_COVER_PLACEHOLDER_SRC = '/images/common/mystery.svg';

interface ProjectPreviewLayoutProps {
  project: ProjectRow;
  /** Show documentation / presentation / external links when URLs are set. */
  showResourceLinks: boolean;
  /** Optional row above the main grid (e.g. project title + status chip). */
  titleRow?: ReactNode;
  /** Optional: replace cover preview (e.g. upload field). */
  coverSlot?: ReactNode;
  /** Optional: replace tagline area (e.g. inline InputField). */
  taglineSlot?: ReactNode;
  /** Optional: replace description panel (e.g. inline InputField). */
  descriptionSlot?: ReactNode;
}

const ProjectPreviewLayout: FC<ProjectPreviewLayoutProps> = ({
  project,
  showResourceLinks,
  titleRow,
  coverSlot,
  taglineSlot,
  descriptionSlot,
}) => {
  const t = useTranslations('course');

  const acceptedAuthors = (project.ProjectAuthors ?? []).filter(
    (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
  );
  const coverSrc =
    project.coverImageUrl?.trim() ? project.coverImageUrl.trim() : PROJECT_COVER_PLACEHOLDER_SRC;
  const hasTagline = Boolean(project.tagline?.trim());
  const hasDescription = Boolean(project.description?.trim());

  const hasAnyResourceLink = Boolean(
    project.documentationUrl?.trim() ||
      project.presentationUrl?.trim() ||
      project.externalUrl?.trim()
  );

  return (
    <div className="space-y-4">
      {titleRow ? <div className="min-w-0">{titleRow}</div> : null}

      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
        <div className="shrink-0 w-full lg:w-56">
          {coverSlot ? (
            <div className="w-full">{coverSlot}</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border-primary bg-bg-secondary">
              <img
                src={coverSrc}
                alt=""
                className="w-full aspect-video object-cover max-h-48"
              />
            </div>
          )}
          {taglineSlot ? (
            taglineSlot
          ) : (
            <div className="mt-3 rounded border border-border-primary p-3 min-h-[3.5rem] text-sm bg-bg-secondary/50">
              {hasTagline ? (
                <p className="font-medium text-label-primary whitespace-pre-line">{project.tagline}</p>
              ) : (
                <p className="text-label-secondary italic">
                  {t('projects.table.expandable_tagline_missing')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
          {descriptionSlot ? (
            descriptionSlot
          ) : (
            <div className="rounded border border-border-primary p-3 flex-1 min-h-[10rem] text-sm bg-bg-secondary/50">
              {hasDescription ? (
                <p className="whitespace-pre-line text-label-primary">{project.description}</p>
              ) : (
                <p className="text-label-secondary italic">
                  {t('projects.table.expandable_description_missing')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 w-full lg:w-64 lg:max-w-xs lg:border-l lg:border-border-primary lg:pl-6">
          <h4 className="text-sm font-semibold text-label-primary mb-3">
            {t('projects.table.expandable_authors_heading')}
          </h4>
          {acceptedAuthors.length > 0 ? (
            <ul className="space-y-2 list-none p-0 m-0">
              {acceptedAuthors.map((authorRow) => {
                const user = authorRow.User;
                return (
                  <li key={authorRow.id}>
                    <UserCard
                      className="flex items-start"
                      user={{
                        id: user?.id,
                        firstName: user?.firstName ?? '',
                        lastName: user?.lastName ?? '',
                        picture: user?.picture ?? null,
                        externalProfile: user?.externalProfile ?? null,
                        organizationName: user?.Organization?.name?.trim() || null,
                      }}
                      size="compact"
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-label-secondary italic">
              {t('projects.table.expandable_authors_none')}
            </p>
          )}
        </div>
      </div>

      {showResourceLinks && hasAnyResourceLink ? (
        <div className="space-y-1 text-sm pt-2 border-t border-border-primary">
          {project.documentationUrl ? (
            <a
              href={project.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-status-confirmed underline block"
            >
              {t('projects.table.documentation_link')}
            </a>
          ) : null}
          {project.presentationUrl ? (
            <a
              href={project.presentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-status-confirmed underline block"
            >
              {t('projects.table.presentation_link')}
            </a>
          ) : null}
          {project.externalUrl ? (
            <a
              href={project.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-status-confirmed underline block"
            >
              {t('projects.table.external_link')}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ProjectPreviewLayout;
