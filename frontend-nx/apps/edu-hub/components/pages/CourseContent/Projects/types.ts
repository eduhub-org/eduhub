import { ProjectsByCourse_Project } from '../../../../queries/__generated__/ProjectsByCourse';
import { ProjectTypes_ProjectType } from '../../../../queries/__generated__/ProjectTypes';

export type ProjectRow = ProjectsByCourse_Project;
export type ProjectAuthorRow = ProjectRow['ProjectAuthors'][number];
export type ProjectMentorRow = ProjectRow['ProjectMentors'][number];
export type ProjectTypeRow = ProjectTypes_ProjectType;
