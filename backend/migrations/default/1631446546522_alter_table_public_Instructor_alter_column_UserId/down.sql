alter table "public"."Instructor" rename column "userId" to "UserId";
comment on column "public"."Instructor"."UserId" is NULL;
