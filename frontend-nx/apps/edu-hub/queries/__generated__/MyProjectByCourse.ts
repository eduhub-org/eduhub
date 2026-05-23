/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum, ProjectAchievementCertificateType_enum, ProjectRating_enum, ProjectParticipationStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: MyProjectByCourse
// ====================================================

export interface MyProjectByCourse_Project_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface MyProjectByCourse_Project_ProjectType {
  __typename: "ProjectType";
  value: string;
  requiresDocumentation: boolean;
  requiresPresentation: boolean;
  requiresExternalUrl: boolean;
  requiresCoverImage: boolean;
}

export interface MyProjectByCourse_Project_ProjectDocumentationInstruction {
  __typename: "ProjectDocumentationInstruction";
  id: number;
  title: string;
  url: string | null;
}

export interface MyProjectByCourse_Project_SubmittedByUser {
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

export interface MyProjectByCourse_Project_ProjectAuthors_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface MyProjectByCourse_Project_ProjectAuthors_User {
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
  Organization: MyProjectByCourse_Project_ProjectAuthors_User_Organization | null;
}

export interface MyProjectByCourse_Project_ProjectAuthors {
  __typename: "ProjectAuthor";
  id: number;
  userId: any;
  participationStatus: ProjectParticipationStatus_enum;
  /**
   * An object relationship
   */
  User: MyProjectByCourse_Project_ProjectAuthors_User;
}

export interface MyProjectByCourse_Project_ProjectMentors_User {
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

export interface MyProjectByCourse_Project_ProjectMentors {
  __typename: "ProjectMentor";
  id: number;
  userId: any;
  /**
   * An object relationship
   */
  User: MyProjectByCourse_Project_ProjectMentors_User;
}

export interface MyProjectByCourse_Project {
  __typename: "Project";
  id: number;
  title: string;
  tagline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  documentationUrl: string | null;
  presentationUrl: string | null;
  externalUrl: string | null;
  documentationInstructionId: number | null;
  status: ProjectStatus_enum;
  type: string | null;
  achievementCertificateType: ProjectAchievementCertificateType_enum | null;
  rating: ProjectRating_enum | null;
  /**
   * Optional instructor comment accompanying the project rating (UNRATED/PASSED/FAILED).
   */
  ratingComment: string | null;
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
  Organization: MyProjectByCourse_Project_Organization | null;
  /**
   * An object relationship
   */
  ProjectType: MyProjectByCourse_Project_ProjectType | null;
  /**
   * An object relationship
   */
  ProjectDocumentationInstruction: MyProjectByCourse_Project_ProjectDocumentationInstruction | null;
  /**
   * An object relationship
   */
  SubmittedByUser: MyProjectByCourse_Project_SubmittedByUser | null;
  /**
   * An array relationship
   */
  ProjectAuthors: MyProjectByCourse_Project_ProjectAuthors[];
  /**
   * An array relationship
   */
  ProjectMentors: MyProjectByCourse_Project_ProjectMentors[];
}

export interface MyProjectByCourse {
  /**
   * fetch data from the table: "Project"
   */
  Project: MyProjectByCourse_Project[];
}

export interface MyProjectByCourseVariables {
  courseId: number;
  userId: any;
}
