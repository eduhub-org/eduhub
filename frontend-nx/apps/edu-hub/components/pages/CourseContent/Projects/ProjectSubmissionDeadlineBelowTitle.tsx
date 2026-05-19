import { FC } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import DatePicker from '../../../inputs/DatePicker';
import { formattedDateWithTime } from '../../../../helpers/util';
import { UPDATE_PROJECT_SUBMISSION_DEADLINE } from '../../../../queries/project';
import { ProjectStatus_enum } from '../../../../__generated__/globalTypes';
import {
  CourseProjectSubmissionDefaultSource,
  getEffectiveProjectSubmissionDeadlineIso,
  submissionDeadlineToIsoString,
} from './projectEffectiveSubmissionDeadline';

type ProjectDeadlinePick = {
  id: number;
  status: ProjectStatus_enum;
  submissionDeadline?: string | Date | null;
};

function deadlineSourceCaption(
  projectHasOwnDeadline: boolean,
  defaultSource: CourseProjectSubmissionDefaultSource,
  t: (key: string) => string
): string | null {
  if (projectHasOwnDeadline) {
    return t('projects.table.submission_deadline_source_project');
  }
  if (defaultSource === 'course') {
    return t('projects.table.submission_deadline_source_course');
  }
  if (defaultSource === 'program_default') {
    return t('projects.table.submission_deadline_source_program');
  }
  if (defaultSource === 'program_legacy') {
    return t('projects.table.submission_deadline_source_program_legacy');
  }
  return null;
}

function instructorDefaultOriginSuffix(
  defaultSource: CourseProjectSubmissionDefaultSource,
  tManage: (key: string) => string
): string {
  switch (defaultSource) {
    case 'course':
      return tManage('projects.expanded.submission_deadline_instructor_origin_course');
    case 'program_default':
      return tManage('projects.expanded.submission_deadline_instructor_origin_program');
    case 'program_legacy':
      return tManage('projects.expanded.submission_deadline_instructor_origin_program_legacy');
    default:
      return '';
  }
}

interface ProjectSubmissionDeadlineBelowTitleProps {
  mode: 'readonly' | 'instructor';
  project: ProjectDeadlinePick;
  courseDefaultSubmissionDeadline: string | Date | null | undefined;
  /** Where the fallback deadline comes from when the project has no override. */
  defaultDeadlineSource: CourseProjectSubmissionDefaultSource;
  refetchQueries?: string[];
}

const ProjectSubmissionDeadlineBelowTitle: FC<ProjectSubmissionDeadlineBelowTitleProps> = ({
  mode,
  project,
  courseDefaultSubmissionDeadline,
  defaultDeadlineSource,
  refetchQueries = [],
}) => {
  const t = useTranslations('course');
  const tManage = useTranslations('manageCourse');
  const locale = useLocale();

  const showRow =
    project.status === ProjectStatus_enum.PROPOSED ||
    project.status === ProjectStatus_enum.ONGOING;
  if (!showRow) {
    return null;
  }

  const projectDeadlineIso = submissionDeadlineToIsoString(project.submissionDeadline);
  const projectHasOwnDeadline = Boolean(projectDeadlineIso);
  const effectiveIso = getEffectiveProjectSubmissionDeadlineIso(
    project.submissionDeadline,
    courseDefaultSubmissionDeadline
  );

  const sourceCaption = deadlineSourceCaption(projectHasOwnDeadline, defaultDeadlineSource, t);

  if (mode === 'readonly') {
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-label-secondary min-w-0">
        <span className="font-medium text-label-primary shrink-0">
          {t('projects.table.submission_deadline_label')}:
        </span>
        {effectiveIso ? (
          <>
            <span className="text-label-primary">
              {formattedDateWithTime(new Date(effectiveIso), locale)}
            </span>
            {sourceCaption ? (
              <span className="text-label-secondary shrink-0">({sourceCaption})</span>
            ) : null}
          </>
        ) : (
          <span className="italic">{t('projects.table.submission_deadline_none')}</span>
        )}
      </div>
    );
  }

  const resolvedDefaultIso = submissionDeadlineToIsoString(courseDefaultSubmissionDeadline);
  const originSuffix = resolvedDefaultIso
    ? instructorDefaultOriginSuffix(defaultDeadlineSource, tManage)
    : '';

  return (
    <div className="space-y-3 w-full min-w-0 text-sm text-label-primary">
      <p className="m-0 leading-relaxed">
        {resolvedDefaultIso ? (
          tManage('projects.expanded.submission_deadline_instructor_intro_default', {
            date: formattedDateWithTime(new Date(resolvedDefaultIso), locale),
            origin: originSuffix,
          })
        ) : (
          tManage('projects.expanded.submission_deadline_instructor_intro_no_default')
        )}
      </p>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <span className="text-sm text-label-primary shrink-0 max-w-prose">
          {tManage('projects.expanded.submission_deadline_instructor_picker_prompt')}
        </span>
        <div className="w-[min(100%,260px)] shrink-0 [&_.col-span-10]:!mt-0">
          <DatePicker
            variant="material"
            helpText={tManage('projects.expanded.submission_deadline_instructor_picker_help')}
            itemId={project.id}
            value={projectDeadlineIso ? new Date(projectDeadlineIso) : null}
            updateValueMutation={UPDATE_PROJECT_SUBMISSION_DEADLINE}
            identifierVariables={{ itemId: project.id }}
            dateFieldName="value"
            refetchQueries={refetchQueries}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectSubmissionDeadlineBelowTitle;
