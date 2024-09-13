














-- Reset sequences
SELECT setval('"User_Id_seq"'::regclass, (SELECT MAX("Id") FROM "User"));
SELECT setval('"Course_Id_seq"'::regclass, (SELECT MAX("Id") FROM "Course"));
SELECT setval('"Program_Id_seq"'::regclass, (SELECT MAX("Id") FROM "Program"));
SELECT setval('"Session_Id_seq"'::regclass, (SELECT MAX("Id") FROM "Session"));
SELECT setval('"CourseEnrollment_Id_seq"'::regclass, (SELECT MAX("Id") FROM "CourseEnrollment"));
SELECT setval('"Expert_Id_seq"'::regclass, (SELECT MAX("Id") FROM "Expert"));
SELECT setval('"Admin_Id_seq"'::regclass, (SELECT MAX("Id") FROM "Admin"));
SELECT setval('"CourseGroup_Id_seq"'::regclass, (SELECT MAX("Id") FROM "CourseGroup"));
SELECT setval('"CourseLocation_Id_seq"'::regclass, (SELECT MAX("Id") FROM "CourseLocation"));
SELECT setval('"CourseInstructor_Id_seq"'::regclass, (SELECT MAX("Id") FROM "CourseInstructor"));
SELECT setval('"SessionAddress_Id_seq"'::regclass, (SELECT MAX("Id") FROM "SessionAddress"));
SELECT setval('"SessionSpeaker_Id_seq"'::regclass, (SELECT MAX("Id") FROM "SessionSpeaker"));
SELECT setval('"AchievementOption_Id_seq"'::regclass, (SELECT MAX("Id") FROM "AchievementOption"));
SELECT setval('"AchievementRecord_Id_seq"'::regclass, (SELECT MAX("Id") FROM "AchievementRecord"));
SELECT setval('"AchievementRecordAuthor_Id_seq"'::regclass, (SELECT MAX("Id") FROM "AchievementRecordAuthor"));
