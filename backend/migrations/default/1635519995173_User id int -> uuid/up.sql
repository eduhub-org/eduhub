BEGIN;

ALTER TABLE "User" ALTER COLUMN id drop default;
ALTER TABLE "User" ALTER COLUMN "id" SET DATA TYPE UUID USING gen_random_uuid();
ALTER TABLE "User" ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE "Expert" ALTER COLUMN "userId" SET DATA TYPE UUID USING gen_random_uuid();
ALTER TABLE "Admin" ALTER COLUMN "userId" SET DATA TYPE UUID USING gen_random_uuid();
ALTER TABLE "Attendance" ALTER COLUMN "userId" SET DATA TYPE UUID USING gen_random_uuid();
ALTER TABLE "CourseEnrollment" ALTER COLUMN "userId" SET DATA TYPE UUID USING gen_random_uuid();

COMMIT;
