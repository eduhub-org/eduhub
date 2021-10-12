comment on column "public"."Course"."LinkChat" is E'The link to the chat of the course (e.g. a mattermost channel)';
alter table "public"."Course" rename column "LinkChat" to "chatLink";
