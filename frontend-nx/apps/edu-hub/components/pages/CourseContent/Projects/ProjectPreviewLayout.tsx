import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MdDownload, MdOpenInNew } from 'react-icons/md';
import { ProjectParticipationStatus_enum } from '../../../../__generated__/globalTypes';
import UserCard from '../../../common/UserCard';
import { Button } from '../../../common/Button';
import { ProjectRow } from './types';

export const PROJECT_COVER_PLACEHOLDER_SRC = '/images/common/project-cover-placeholder.svg';

function resourceUrlPresent(url?: string | null): boolean {
  const u = url?.trim();
  return Boolean(u && u !== 'pending_upload');
}

interface ProjectPreviewLayoutProps {
  project: ProjectRow;
  /**
   * When no project type is configured, gates the whole resource block (legacy).
   * When a type is configured, mandatory link rows are shown regardless of this flag;
   * optional rows still appear only when a URL is set.
   */
  showResourceLinks: boolean;
  /** Optional row above the main grid (e.g. project title + status chip). */
  titleRow?: ReactNode;
  /** Optional: replace cover preview (e.g. upload field). */
  coverSlot?: ReactNode;
  /** Optional: replace tagline area (e.g. inline InputField). */
  taglineSlot?: ReactNode;
  /** Optional: replace description panel (e.g. inline InputField). */
  descriptionSlot?: ReactNode;
  /** Rendered directly under `titleRow` (e.g. submission deadline). */
  belowTitleRow?: ReactNode;
}

const ProjectPreviewLayout: FC<ProjectPreviewLayoutProps> = ({
  project,
  showResourceLinks,
  titleRow,
  coverSlot,
  taglineSlot,
  descriptionSlot,
  belowTitleRow,
}) => {
  const t = useTranslations('course');

  const acceptedAuthors = (project.ProjectAuthors ?? []).filter(
    (a) => a.participationStatus === ProjectParticipationStatus_enum.ACCEPTED
  );
  const coverSrc =
    project.coverImageUrl?.trim() ? project.coverImageUrl.trim() : PROJECT_COVER_PLACEHOLDER_SRC;
  const hasTagline = Boolean(project.tagline?.trim());
  const hasDescription = Boolean(project.description?.trim());

  const hasConfiguredType = Boolean(project.ProjectType);
  const pt = project.ProjectType;

  const docProvided = resourceUrlPresent(project.documentationUrl);
  const presProvided = resourceUrlPresent(project.presentationUrl);
  const extProvided = resourceUrlPresent(project.externalUrl);

  const hasAnyResourceLink = docProvided || presProvided || extProvided;

  const showDocumentationRow = hasConfiguredType
    ? Boolean(pt?.requiresDocumentation || docProvided)
    : showResourceLinks && hasAnyResourceLink && docProvided;

  const showPresentationRow = hasConfiguredType
    ? Boolean(pt?.requiresPresentation || presProvided)
    : showResourceLinks && hasAnyResourceLink && presProvided;

  const showExternalRow = hasConfiguredType
    ? Boolean(pt?.requiresExternalUrl || extProvided)
    : showResourceLinks && hasAnyResourceLink && extProvided;

  const showResourceBlock =
    showDocumentationRow || showPresentationRow || showExternalRow;

  return (
    <div className="space-y-4">
      {titleRow ? <div className="min-w-0">{titleRow}</div> : null}
      {belowTitleRow ? <div className="min-w-0">{belowTitleRow}</div> : null}

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

      {showResourceBlock ? (
        <div className="flex flex-col gap-3 text-sm pt-2 border-t border-border-primary">
          {showDocumentationRow ? (
            docProvided ? (
              <Button
                as="a"
                href={project.documentationUrl?.trim() ?? ''}
                target="_blank"
                rel="noopener noreferrer"
                download
                filled
                className="inline-flex w-fit max-w-full items-center gap-2 no-underline text-sm font-medium"
                aria-label={t('projects.table.documentation_download')}
              >
                <MdDownload className="text-xl shrink-0" aria-hidden />
                {t('projects.table.documentation_download')}
              </Button>
            ) : (
              <p className="text-label-secondary italic m-0">
                {t('projects.table.resource_pending_documentation')}
              </p>
            )
          ) : null}
          {showPresentationRow ? (
            presProvided ? (
              <Button
                as="a"
                href={project.presentationUrl?.trim() ?? ''}
                target="_blank"
                rel="noopener noreferrer"
                download
                filled
                className="inline-flex w-fit max-w-full items-center gap-2 no-underline text-sm font-medium"
                aria-label={t('projects.table.presentation_download')}
              >
                <MdDownload className="text-xl shrink-0" aria-hidden />
                {t('projects.table.presentation_download')}
              </Button>
            ) : (
              <p className="text-label-secondary italic m-0">
                {t('projects.table.resource_pending_presentation')}
              </p>
            )
          ) : null}
          {showExternalRow ? (
            extProvided ? (
              <Button
                as="a"
                href={project.externalUrl?.trim() ?? ''}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit max-w-full items-center gap-2 no-underline text-sm font-medium"
                aria-label={t('projects.table.external_link')}
              >
                <MdOpenInNew className="text-lg shrink-0" aria-hidden />
                {t('projects.table.external_link')}
              </Button>
            ) : (
              <p className="text-label-secondary italic m-0">
                {t('projects.table.resource_pending_external')}
              </p>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ProjectPreviewLayout;
