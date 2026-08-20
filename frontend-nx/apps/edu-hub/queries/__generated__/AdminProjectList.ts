/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Project_bool_exp, Project_order_by, ProjectStatus_enum, ProjectRating_enum, ProjectParticipationStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AdminProjectList
// ====================================================

export interface AdminProjectList_Project_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface AdminProjectList_Project_ProjectType {
  __typename: "ProjectType";
  value: string;
  /**
   * When true, project.documentationUrl must be present before the project can be submitted.
   */
  requiresDocumentation: boolean;
  /**
   * When true, project.presentationUrl must be present before the project can be submitted.
   */
  requiresPresentation: boolean;
  /**
   * When true, project.externalUrl must be present before the project can be submitted (e.g. repository or live demo).
   */
  requiresExternalUrl: boolean;
  /**
   * When true, project.coverImageUrl must be present before submission and for showcase publication.
   */
  requiresCoverImage: boolean;
}

export interface AdminProjectList_Project_ProjectDocumentationInstruction {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  /**
   * Admin-facing label in instruction dropdowns.
   */
  title: string;
  /**
   * Instruction PDF location: static app path (e.g. /project-documentation-instructions/…) or GCS object path after admin upload. Nullable until a file is attached.
   */
  url: string | null;
}

export interface AdminProjectList_Project_SubmittedByUser {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface AdminProjectList_Project_ProjectAuthors_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface AdminProjectList_Project_ProjectAuthors_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  /**
   * A link to an external profile, for example in LinkedIn or Xing
   */
  externalProfile: string | null;
  /**
   * An object relationship
   */
  Organization: AdminProjectList_Project_ProjectAuthors_User_Organization | null;
}

export interface AdminProjectList_Project_ProjectAuthors {
  __typename: "ProjectAuthor";
  id: number;
  userId: any;
  participationStatus: ProjectParticipationStatus_enum;
  /**
   * An object relationship
   */
  User: AdminProjectList_Project_ProjectAuthors_User;
}

export interface AdminProjectList_Project_ProjectMentors_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface AdminProjectList_Project_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  /**
   * FK to User.id of the mentor.
   */
  userId: any;
  /**
   * An object relationship
   */
  User: AdminProjectList_Project_ProjectMentors_User;
}

export interface AdminProjectList_Project_ProjectConsentEvents_ActorUser {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface AdminProjectList_Project_ProjectConsentEvents {
  __typename: "ProjectConsentEvent";
  id: number;
  eventType: string;
  actorUserId: any;
  created_at: any;
  termsVersion: string;
  /**
   * An object relationship
   */
  ActorUser: AdminProjectList_Project_ProjectConsentEvents_ActorUser;
}

export interface AdminProjectList_Project_ProjectCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
}

export interface AdminProjectList_Project_ProjectCourses_Course_CourseGroups_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
}

export interface AdminProjectList_Project_ProjectCourses_Course_CourseGroups {
  __typename: "CourseGroup";
  id: number;
  /**
   * An object relationship
   */
  CourseGroupOption: AdminProjectList_Project_ProjectCourses_Course_CourseGroups_CourseGroupOption;
}

export interface AdminProjectList_Project_ProjectCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number;
  /**
   * An object relationship
   */
  Program: AdminProjectList_Project_ProjectCourses_Course_Program;
  /**
   * An array relationship
   */
  CourseGroups: AdminProjectList_Project_ProjectCourses_Course_CourseGroups[];
}

export interface AdminProjectList_Project_ProjectCourses {
  __typename: "ProjectCourse";
  courseId: number;
  /**
   * An object relationship
   */
  Course: AdminProjectList_Project_ProjectCourses_Course;
}

export interface AdminProjectList_Project {
  __typename: "Project";
  id: number;
  title: string;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  documentationUrl: string | null;
  presentationUrl: string | null;
  externalUrl: string | null;
  /**
   * FK to ProjectDocumentationInstruction.id. Must match Project.type (trigger Project_instruction_matches_type_trg). Instruction PDF describes deliverable composition; enforced uploads are only those required by the project type.
   */
  documentationInstructionId: number | null;
  status: ProjectStatus_enum;
  /**
   * Showcase visibility flag: true means the project is publicly published (home sliders, public showcase). Orthogonal to lifecycle, which stays in "status".
   */
  published: boolean;
  /**
   * FK to ProjectType.value. Required with documentationInstructionId before leaving PROPOSED (check constraint). Drives mandatory deliverables and workflow (e.g. ONLINE_COURSE template claim may insert ONGOING directly).
   */
  type: string | null;
  rating: ProjectRating_enum | null;
  /**
   * Optional comment from course staff or project mentor accompanying rating (UNRATED/PASSED/FAILED).
   */
  ratingComment: string | null;
  /**
   * Course staff flag: a completed project is suggested for showcase publication. Toggling this does not publish the project (status PUBLISHED is set separately).
   */
  suggestedForPublication: boolean;
  acceptingParticipants: boolean;
  organizationId: number | null;
  proposedByUserId: any;
  parentProjectId: number | null;
  /**
   * Timestamp at which the project most recently transitioned to SUBMITTED. Cleared when a reviewer sends the project back to ONGOING so the student-side "sent back for revisions" banner remains accurate.
   */
  submittedAt: any | null;
  /**
   * User who issued the most recent SUBMITTED transition. Set via a Hasura permission preset (x-hasura-user-id) so the client cannot impersonate another author.
   */
  submittedBy: any | null;
  /**
   * When the project was last sent back for revision (SUBMITTED -> ONGOING). Cleared on resubmission, so a non-null value means the project is currently awaiting a revision. Not backfillable: earlier send-backs left no trace once submittedAt was cleared.
   */
  sentBackAt: any | null;
  /**
   * Timestamp when project authors asked course staff to review the proposed project (still PROPOSED until staff confirm the team).
   */
  projectReviewRequestedAt: any | null;
  /**
   * Optional per-project submission deadline. When null, the effective deadline is taken from the course (projectSubmissionDeadline) or program defaults.
   */
  submissionDeadline: any | null;
  created_at: any;
  updated_at: any;
  /**
   * An object relationship
   */
  Organization: AdminProjectList_Project_Organization | null;
  /**
   * An object relationship
   */
  ProjectType: AdminProjectList_Project_ProjectType | null;
  /**
   * An object relationship
   */
  ProjectDocumentationInstruction: AdminProjectList_Project_ProjectDocumentationInstruction | null;
  /**
   * An object relationship
   */
  SubmittedByUser: AdminProjectList_Project_SubmittedByUser | null;
  /**
   * An array relationship
   */
  ProjectAuthors: AdminProjectList_Project_ProjectAuthors[];
  /**
   * An array relationship
   */
  ProjectMentors: AdminProjectList_Project_ProjectMentors[];
  /**
   * An array relationship
   */
  ProjectConsentEvents: AdminProjectList_Project_ProjectConsentEvents[];
  /**
   * An array relationship
   */
  ProjectCourses: AdminProjectList_Project_ProjectCourses[];
}

export interface AdminProjectList_Project_aggregate_aggregate {
  __typename: "Project_aggregate_fields";
  count: number;
}

export interface AdminProjectList_Project_aggregate {
  __typename: "Project_aggregate";
  aggregate: AdminProjectList_Project_aggregate_aggregate | null;
}

export interface AdminProjectList {
  /**
   * fetch data from the table: "Project"
   */
  Project: AdminProjectList_Project[];
  /**
   * fetch aggregated fields from the table: "Project"
   */
  Project_aggregate: AdminProjectList_Project_aggregate;
}

export interface AdminProjectListVariables {
  where?: Project_bool_exp | null;
  order_by?: Project_order_by[] | null;
  limit?: number | null;
  offset?: number | null;
}
