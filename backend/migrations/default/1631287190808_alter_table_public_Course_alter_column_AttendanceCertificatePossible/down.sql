alter table "public"."Course" rename column "attendanceCertificatePossible" to "AttendanceCertificatePossible";
comment on column "public"."Course"."AttendanceCertificatePossible" is NULL;
