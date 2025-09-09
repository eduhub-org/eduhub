// Main GraphQL operations index
// This file provides organized access to all fragments, queries, and mutations
// while maintaining backward compatibility with existing flat imports

// Organized exports (new structure)
export * as Fragments from './fragments';
export * as Queries from './queries';
export * as Mutations from './mutations';

// Backward compatibility exports (maintain existing flat structure)
// These will be deprecated in Phase 3 in favor of organized imports
export * from './userFragment';
export * from './courseFragment';
export * from './courseFragements';
export * from './courseInstructorFragment';
export * from './courseEnrollmentFragment';
export * from './programFragment';
export * from './sessionFragment';
export * from './enrollmentFragment';
export * from './achievementRecordFragment';
export * from './achievementOptionFragment';
export * from './AchievementRecordAuthorFragment';

export * from './user';
export * from './courseList';
export * from './courseWithEnrollment';
export * from './courseInstructorList';
export * from './myCourses';
export * from './courseQueries';
export * from './programList';
export * from './myEnrollmentsForCourse';
export * from './multiProgramEnrollments';
export * from './courseEnrollment';
export * from './expert';
export * from './organization';
export * from './organizationAdmin';
export * from './locationAddress';
export * from './emailTemplates';
export * from './mail';
export * from './faqQueries';
export * from './appSettings';
export * from './actions';
export * from './country';
export * from './courseGroupOptions';
export * from './courseDegree';
export * from './achievementDocumentationTemplate';
export * from './achievementRecord';
export * from './achievementOption';
export * from './AchievementRecordAuthor';
export * from './course';

export * from './insertUser';
export * from './updateUser';
export * from './mutateCourse';
export * from './copyCourse';
export * from './mutateCourseInstructor';
export * from './mutateCourseFundingOrganization';
export * from './updateProgram';
export * from './insertEnrollment';
export * from './mutateAchievement';
export * from './updateOrganization';
export * from './courseGroup';
