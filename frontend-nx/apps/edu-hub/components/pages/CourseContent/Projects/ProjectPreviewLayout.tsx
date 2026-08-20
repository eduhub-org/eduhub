import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MdDownload, MdOpenInNew } from 'react-icons/md';
import UserCard from '../../../common/UserCard';
import { Button } from '../../../common/Button';
import { ProjectRow } from './types';
import { getDisplayAuthors, isExcludedAuthor } from './projectAuthors';
import {
  isProjectResourceUrlPresent,
  safeProjectExternalHref,
  safeProjectResourceHref,
} from './projectMandatory';
import { resolveProjectCoverImageSrc } from './projectCoverImage';

export { PROJECT_COVER_PLACEHOLDER_SRC } from './projectCoverImage';

interface ProjectPreviewLayoutProps {
  project: ProjectRow;
  /** When true and a URL is set, show documentation/presentation download and external link rows. */
  showResourceLinks: boolean;
  /** Optional row above the main grid (e.g. project title + status chip). */
  titleRow?: ReactNode;
  /** Optional: replace cover preview (e.g. upload field). */
  coverSlot?: ReactNode;
  /** Optional: replace tagline area (e.g. inline InputField). */
  taglineSlot?: ReactNode;
  /** Optional: replace description panel (e.g. inline InputField). */
  descriptionSlot?: ReactNode;
  /**
   * Also list EXCLUDED authors (marked as excluded). Set for privileged viewers
   * (instructors/admins) and the excluded author's own "My Project" view.
   */
  includeExcludedAuthors?: boolean;
}

const ProjectPreviewLayout: FC<ProjectPreviewLayoutProps> = ({
  project,
  showResourceLinks,
  titleRow,
  coverSlot,
  taglineSlot,
  descriptionSlot,
  includeExcludedAuthors = false,
}) => {
  const t = useTranslations('course');

  const displayAuthors = getDisplayAuthors(project.ProjectAuthors, {
    includeExcluded: includeExcludedAuthors,
  });
  const coverSrc = resolveProjectCoverImageSrc(project.coverImageUrl);
  const hasTagline = Boolean(project.tagline?.trim());
  const hasDescription = Boolean(project.description?.trim());

  const docProvided = isProjectResourceUrlPresent(project.documentationUrl);
  const presProvided = isProjectResourceUrlPresent(project.presentationUrl);
  const extProvided = isProjectResourceUrlPresent(project.externalUrl);

  const safeDocumentationHref = safeProjectResourceHref(project.documentationUrl);
  const safePresentationHref = safeProjectResourceHref(project.presentationUrl);
  const safeExternalHref = safeProjectExternalHref(project.externalUrl);

  const showDocumentationRow = showResourceLinks && docProvided && safeDocumentationHref !== null;
  const showPresentationRow = showResourceLinks && presProvided && safePresentationHref !== null;
  const showExternalRow = showResourceLinks && extProvided && safeExternalHref !== null;

  const showResourceBlock =
    showDocumentationRow || showPresentationRow || showExternalRow;

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

        {displayAuthors.length > 0 ? (
          <div className="shrink-0 w-full lg:w-64 lg:max-w-xs lg:border-l lg:border-border-primary lg:pl-6">
            <h4 className="text-sm font-semibold text-label-primary mb-3">
              {t('projects.table.expandable_authors_heading')}
            </h4>
            <ul className="space-y-2 list-none p-0 m-0">
              {displayAuthors.map((authorRow) => {
                const user = authorRow.User;
                const excluded = isExcludedAuthor(authorRow);
                return (
                  <li key={authorRow.id} className={excluded ? 'opacity-60' : undefined}>
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
                    {excluded ? (
                      <span className="mt-1 inline-block text-xs font-medium text-label-secondary italic">
                        {t('projects.table.author_excluded_marker')}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {showResourceBlock ? (
        <div className="flex flex-col gap-3 text-sm pt-2 border-t border-border-primary">
          {showDocumentationRow ? (
            <Button
              as="a"
              href={safeDocumentationHref ?? ''}
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
          ) : null}
          {showPresentationRow ? (
            <Button
              as="a"
              href={safePresentationHref ?? ''}
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
          ) : null}
          {showExternalRow ? (
            <Button
              as="a"
              href={safeExternalHref ?? ''}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit max-w-full items-center gap-2 no-underline text-sm font-medium"
              aria-label={t('projects.table.external_link')}
            >
              <MdOpenInNew className="text-lg shrink-0" aria-hidden />
              {t('projects.table.external_link')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ProjectPreviewLayout;
