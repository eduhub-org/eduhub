comment on column "public"."Mail"."Content" is E'The (html) text content of the email';
alter table "public"."Mail" rename column "Content" to "content";
