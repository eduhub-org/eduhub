comment on column "public"."User"."University" is E'The university the user is attending or workin at (only provided if he is a student or working in academia)';
alter table "public"."User" rename column "University" to "university";
