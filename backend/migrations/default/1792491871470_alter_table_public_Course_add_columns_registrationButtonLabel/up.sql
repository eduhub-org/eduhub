ALTER TABLE "public"."Course" ADD COLUMN "registrationButtonLabelDe" text NULL;
ALTER TABLE "public"."Course" ADD COLUMN "registrationButtonLabelEn" text NULL;

COMMENT ON COLUMN "public"."Course"."registrationButtonLabelDe" IS
  E'German text replacing the default label of the register/apply button on the course page. Null keeps the label derived from the registration type.';
COMMENT ON COLUMN "public"."Course"."registrationButtonLabelEn" IS
  E'English text replacing the default label of the register/apply button on the course page. Null keeps the label derived from the registration type.';
