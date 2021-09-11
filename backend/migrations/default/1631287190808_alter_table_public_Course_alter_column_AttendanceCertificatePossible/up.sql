comment on column "public"."Course"."AttendanceCertificatePossible" is E'Indicates whether participants will get a certificate showing the list of attendances (only issued if the did not miss then maxMissedCourses)';
alter table "public"."Course" rename column "AttendanceCertificatePossible" to "attendanceCertificatePossible";
