ALTER TABLE "public"."User" ADD COLUMN "matrixUserHandle" text;
COMMENT ON COLUMN "public"."User"."matrixUserHandle" IS 'Immutable Matrix user handle, set once from Keycloak. Format: firstname.lastname.uuid6';
