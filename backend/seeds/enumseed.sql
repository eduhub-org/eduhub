-- status field in course table. 
INSERT INTO public."CourseStatus" ("Value", "Comment") VALUES ('ACTIVE', 'course is published');
INSERT INTO public."CourseStatus" ("Value", "Comment") VALUES ('FINISHED', 'course has finished');
INSERT INTO public."CourseStatus" ("Value", "Comment") VALUES ('DRAFT', 'course is not yet published');
-- Online_Hybrid_Offline
INSERT INTO public."OnlineHybridOffline" ("Value", "Comment") VALUES ('ONLINE', '');
INSERT INTO public."OnlineHybridOffline" ("Value", "Comment") VALUES ('HYBRID', '');
INSERT INTO public."OnlineHybridOffline" ("Value", "Comment") VALUES ('OFFLINE', '');
-- status field on enrollment table
INSERT INTO public."EnrollmentStatus" ("Value", "Comment") VALUES ('APPLIED', 'Student sent his enrollment');
INSERT INTO public."EnrollmentStatus" ("Value", "Comment") VALUES ('INVITED', 'Invitation was send to Student');
INSERT INTO public."EnrollmentStatus" ("Value", "Comment") VALUES ('REJECTED', 'Enrollment was refused');
INSERT INTO public."EnrollmentStatus" ("Value", "Comment") VALUES ('CONFIRMED', 'Student has sucessfully enrolled');
INSERT INTO public."EnrollmentStatus" ("Value", "Comment") VALUES ('ABORTED', 'Student has aborted this course');
INSERT INTO public."EnrollmentStatus" ("Value", "Comment") VALUES ('COMPLETED', 'Student has finished this course');
--motivation grade table on enrollment table
INSERT INTO public."MotivationGrade" ("Value", "Comment") VALUES ('UNRATED', '');
INSERT INTO public."MotivationGrade" ("Value", "Comment") VALUES ('BAD', '');
INSERT INTO public."MotivationGrade" ("Value", "Comment") VALUES ('AVERAGE', '');
INSERT INTO public."MotivationGrade" ("Value", "Comment") VALUES ('GOOD', '');
--project_type field on enrollment table
INSERT INTO public."ProjectType" ("Value", "Comment") VALUES ('PROTOTYPE', '');
--university field on participant table
INSERT INTO public."University" ("Value", "Comment") VALUES ('CAUKIEL', '');
INSERT INTO public."University" ("Value", "Comment") VALUES ('FHKIEL', '');
INSERT INTO public."University" ("Value", "Comment") VALUES ('DHSH', '');
INSERT INTO public."University" ("Value", "Comment") VALUES ('MUTHESIUS', '');
INSERT INTO public."University" ("Value", "Comment") VALUES ('UNIFLENSBURG', '');
INSERT INTO public."University" ("Value", "Comment") VALUES ('OTHER', '');
--employment field on person table
INSERT INTO public."Employment" ("Value", "Comment") VALUES ('STUDENT', '');
INSERT INTO public."Employment" ("Value", "Comment") VALUES ('EMPLOYED', '');
INSERT INTO public."Employment" ("Value", "Comment") VALUES ('UNEMPLOYED', '');
INSERT INTO public."Employment" ("Value", "Comment") VALUES ('SELFEMPLOYED', '');
INSERT INTO public."Employment" ("Value", "Comment") VALUES ('OTHER', '');
INSERT INTO public."Employment" ("Value", "Comment") VALUES ('ACADEMIA', '');
INSERT INTO public."Employment" ("Value", "Comment") VALUES ('RETIREE', '');
--survey type on session table
INSERT INTO public."SurveyType" ("Value", "Comment") VALUES ('START', '');
INSERT INTO public."SurveyType" ("Value", "Comment") VALUES ('END', '');
INSERT INTO public."SurveyType" ("Value", "Comment") VALUES ('EXTERNAL', '');

