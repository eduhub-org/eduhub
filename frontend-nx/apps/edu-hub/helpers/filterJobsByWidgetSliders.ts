import { CourseGroupOptions_CourseGroupOption } from '../queries/__generated__/CourseGroupOptions';
import { JobTileFragment } from '../queries/__generated__/JobTileFragment';

/**
 * Narrow a list of job postings to the job types of the selected JOB sliders —
 * mirrors the project widget's client-side group logic. A selected JOB slider
 * with no job-type selection means "all types", so no type filtering is applied
 * when any selected slider selects zero types.
 */
const filterByJobTypes = (
  jobs: JobTileFragment[],
  selectedOptions: CourseGroupOptions_CourseGroupOption[]
): JobTileFragment[] => {
  if (selectedOptions.some((option) => option.SelectedJobTypes.length === 0)) {
    return jobs;
  }
  const selectedTypes = new Set(selectedOptions.flatMap((option) => option.SelectedJobTypes.map((s) => s.jobType)));
  return jobs.filter((job) => selectedTypes.has(job.type));
};

/**
 * Filter jobs by JOB slider CourseGroupOptions — mirrors the course/project
 * widget's group handling. Sliders are selected by CourseGroupOption id (the
 * `group`/`groups` params); the union of the selected sliders'
 * SelectedJobTypes then narrows the result.
 */
export const filterJobsByWidgetSliders = (
  jobs: JobTileFragment[],
  options: {
    selectedGroupIds: number[];
    groupOptions: CourseGroupOptions_CourseGroupOption[];
    groupOptionsLoading: boolean;
    groupOptionsError: boolean;
  }
): JobTileFragment[] => {
  const { selectedGroupIds, groupOptions, groupOptionsLoading, groupOptionsError } = options;

  // The id namespace is shared with course and project sliders; only
  // JOB rows carry job-type selections, so matching a non-JOB row must yield
  // nothing rather than read as "JOB slider with no selection" (= all jobs).
  const jobSliderOptions = groupOptions.filter((option) => option.contentType === 'JOB');

  if (selectedGroupIds.length === 0) {
    return jobs;
  }

  if (groupOptionsLoading || groupOptionsError) {
    return [];
  }
  const selectedOptions = jobSliderOptions.filter((option) => selectedGroupIds.includes(option.id));
  if (selectedOptions.length === 0) {
    return [];
  }
  return filterByJobTypes(jobs, selectedOptions);
};
