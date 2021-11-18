comment on column "public"."User"."UniversityOther" is E'Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)';
alter table "public"."User" rename column "UniversityOther" to "otherUniversity";
