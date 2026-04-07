ALTER TABLE "public"."Program" ADD COLUMN "matrixInstructorRoomId" text NULL;

COMMENT ON COLUMN "public"."Program"."matrixInstructorRoomId" IS 'Matrix room id for the program-wide instructor Element chat (!room:server); invites are sent via admin API.';
