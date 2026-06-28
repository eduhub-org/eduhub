import { FC, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useTranslations } from 'next-intl';
import { CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { AuthRoles } from '../../../types/enums';
import { ProjectStatus_enum } from '../../../__generated__/globalTypes';
import { PROJECT_PAGE, SIMILAR_PROJECT_TILES } from '../../../queries/projectPage';
import { ProjectPage, ProjectPageVariables } from '../../../queries/__generated__/ProjectPage';
import {
  SimilarProjectTiles,
  SimilarProjectTilesVariables,
} from '../../../queries/__generated__/SimilarProjectTiles';
import { ProjectPageFragment } from '../../../queries/__generated__/ProjectPageFragment';
import { getPublicImageUrl } from '../../../helpers/filehandling';
import { Button } from '../../common/Button';
import ProjectTileSlider from '../../common/TileSlider/ProjectTileSlider';

export type ProjectPageContext = 'public' | 'withinCourse';

interface ProjectContentProps {
  id: number;
  context: ProjectPageContext;
  courseId?: number;
}

const fullName = (user: { firstName: string; lastName: string }) => `${user.firstName} ${user.lastName}`.trim();

const Avatar: FC<{ picture: string | null; name: string; size?: number }> = ({ picture, name, size = 40 }) => (
  <div
    className="rounded-full bg-gray-500 bg-cover bg-center flex items-center justify-center text-xs text-white shrink-0 overflow-hidden"
    style={{
      width: size,
      height: size,
      backgroundImage: picture ? `url("${picture}")` : undefined,
    }}
    title={name}
  >
    {!picture && name.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2).toUpperCase()}
  </div>
);

const ProjectContent: FC<ProjectContentProps> = ({ id, context, courseId }) => {
  const t = useTranslations('project');
  const anonymous = { role: AuthRoles.anonymous };

  const { data, loading, error } = useQuery<ProjectPage, ProjectPageVariables>(PROJECT_PAGE, {
    variables: { id },
    context: anonymous,
  });

  const project: ProjectPageFragment | undefined = data?.Project?.[0];

  const relevantCourse = useMemo(() => {
    if (!project) return undefined;
    // Within-course route: only the matching course (no fallback to a different one).
    if (courseId != null) return project.ProjectCourses.find((pc) => pc.courseId === courseId);
    return project.ProjectCourses[0];
  }, [project, courseId]);

  const course = relevantCourse?.Course;
  const program = course?.Program;
  const linkedCourseId = courseId ?? course?.id;
  const courseGroupIds = useMemo(
    () => (course?.CourseGroups ?? []).map((cg) => cg.groupOptionId),
    [course]
  );

  const { data: similarData } = useQuery<SimilarProjectTiles, SimilarProjectTilesVariables>(SIMILAR_PROJECT_TILES, {
    variables: { excludeId: id, courseGroupIds },
    context: anonymous,
    skip: !project || courseGroupIds.length === 0,
  });
  const similar = similarData?.Project ?? [];

  if (loading) {
    return (
      <div className="flex justify-center pt-32">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <div className="text-white">{t('load_error')}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex justify-center max-w-screen-xl mx-auto w-full pt-32">
        <div className="text-white">{t('not_found')}</div>
      </div>
    );
  }

  const isPublished = project.status === ProjectStatus_enum.PUBLISHED;
  const mentor = project.ProjectMentors[0]?.User;
  const team = project.ProjectAuthors;
  const courseLine = course
    ? program?.shortTitle
      ? `${course.title} · ${program.shortTitle}`
      : course.title
    : project.Organization?.name ?? '';
  const coverImage = getPublicImageUrl(project.coverImageUrl, 1024);

  // Only allow http(s) links into hrefs to avoid javascript:/data: XSS via stored content.
  const safeUrl = (url: string | null): string | null => (url && /^https?:\/\//i.test(url.trim()) ? url.trim() : null);
  const links = [
    safeUrl(project.documentationUrl) ? { url: safeUrl(project.documentationUrl)!, label: t('sidebar.documentation') } : null,
    safeUrl(project.presentationUrl) ? { url: safeUrl(project.presentationUrl)!, label: t('sidebar.presentation') } : null,
    safeUrl(project.externalUrl) ? { url: safeUrl(project.externalUrl)!, label: t('sidebar.demo') } : null,
  ].filter(Boolean) as { url: string; label: string }[];

  const description = project.description ? (
    <ReactMarkdown className="prose prose-invert max-w-none break-words [&_*]:break-words" remarkPlugins={[remarkGfm]}>
      {project.description}
    </ReactMarkdown>
  ) : null;

  // -------- Published showcase layout (V1) --------
  if (isPublished) {
    return (
      <div className="text-white">
        <div
          className="relative h-[420px] flex items-end bg-cover bg-center"
          style={coverImage ? { backgroundImage: `url("${coverImage}")` } : { backgroundColor: '#222' }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(0deg, rgba(15,15,15,0.95) 0%, rgba(15,15,15,0) 70%)' }}
          />
          <div className="relative max-w-screen-xl mx-auto w-full px-3 md:px-16 pb-10">
            <div className="text-sm text-label-secondary mb-3">
              {t('breadcrumb.projects')}
              {courseLine ? ` / ${courseLine}` : ''}
            </div>
            <h1 className="text-5xl font-semibold">{project.title}</h1>
            {project.tagline && <p className="text-xl text-label-secondary mt-3 max-w-3xl">{project.tagline}</p>}
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto w-full px-3 md:px-16 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 flex flex-col gap-12">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('about.title')}</h2>
              {description}
            </section>
            <section className="flex gap-10">
              <div>
                <div className="text-3xl font-semibold">{team.length}</div>
                <div className="text-label-secondary text-sm">{t('stats.team_members')}</div>
              </div>
            </section>
            {similar.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-2">{t('similar.title')}</h2>
                <ProjectTileSlider projects={similar} context="public" />
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-8">
            {links.length > 0 && (
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border-primary bg-bg-card px-4 py-3 hover:border-brand"
                  >
                    {link.label}
                    <span aria-hidden>↗</span>
                  </a>
                ))}
              </div>
            )}

            {team.length > 0 && (
              <div className="rounded-xl border border-border-primary bg-bg-card p-5">
                <h3 className="font-semibold mb-4">{t('sidebar.team')}</h3>
                <div className="flex flex-col gap-3">
                  {team.map((author) => (
                    <div key={author.id} className="flex items-center gap-3">
                      <Avatar picture={author.User.picture} name={fullName(author.User)} />
                      <span>{fullName(author.User)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mentor && (
              <div className="rounded-xl border border-border-primary bg-bg-card p-5">
                <h3 className="font-semibold mb-4">{t('sidebar.mentor')}</h3>
                <div className="flex items-center gap-3">
                  <Avatar picture={mentor.picture} name={fullName(mentor)} />
                  <span>{fullName(mentor)}</span>
                </div>
              </div>
            )}

            {course && linkedCourseId != null && (
              <div className="rounded-xl border border-border-primary bg-bg-card p-5">
                <div className="text-xs uppercase tracking-widest text-label-secondary mb-1">
                  {t('course_card.eyebrow')}
                </div>
                <div className="text-lg font-semibold">{course.title}</div>
                {program?.shortTitle && <div className="text-label-secondary text-sm">{program.shortTitle}</div>}
                <Link href={`/course/${linkedCourseId}`} className="text-brand text-sm mt-3 inline-block">
                  {t('course_card.go_to_course')} →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // -------- Open template layout (V2 public / within course) --------
  return (
    <div className="text-white max-w-screen-xl mx-auto w-full px-3 md:px-16 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div
          className="rounded-2xl h-[320px] bg-cover bg-center"
          style={coverImage ? { backgroundImage: `url("${coverImage}")` } : { backgroundColor: '#222' }}
        />
        <div className="flex flex-col gap-4">
          {context === 'withinCourse' && courseLine && (
            <div className="text-sm text-label-secondary">{t('viewing_from', { course: courseLine })}</div>
          )}
          <span className="text-xs uppercase tracking-widest text-label-secondary">{t('tile.template_eyebrow')}</span>
          <h1 className="text-4xl font-semibold">{project.title}</h1>
          {project.tagline && <p className="text-lg text-label-secondary">{project.tagline}</p>}
          {mentor && (
            <div className="flex items-center gap-3">
              <Avatar picture={mentor.picture} name={fullName(mentor)} size={36} />
              <span className="text-label-secondary text-sm">{t('tile.mentored_by', { name: fullName(mentor) })}</span>
            </div>
          )}

          <div className="rounded-2xl border border-border-primary bg-bg-card p-5 mt-2">
            <h3 className="font-semibold mb-2">
              {context === 'withinCourse' ? t('join.title') : t('enroll.title')}
            </h3>
            {courseLine && <div className="text-label-secondary text-sm mb-1">{courseLine}</div>}
            {course?.applicationEnd && (
              <div className="text-label-secondary text-sm mb-3">
                {t('enroll.applications_until', {
                  date: new Date(course.applicationEnd).toLocaleDateString(),
                })}
              </div>
            )}
            {context === 'withinCourse' ? (
              linkedCourseId != null && (
                <Button as="link" href={`/course/${linkedCourseId}`} filled inverted className="w-full justify-center">
                  {t('cta.apply_to_join')}
                </Button>
              )
            ) : (
              <>
                <p className="text-label-secondary text-sm mb-3">{t('enroll.hint')}</p>
                {linkedCourseId != null && (
                  <div className="flex gap-3">
                    <Button as="link" href={`/course/${linkedCourseId}`} filled inverted>
                      {t('cta.apply_for_course')}
                    </Button>
                    <Button as="link" href={`/course/${linkedCourseId}`}>
                      {t('cta.view_course')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {description && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">{t('description.title')}</h2>
          {description}
        </section>
      )}
    </div>
  );
};

export default ProjectContent;
