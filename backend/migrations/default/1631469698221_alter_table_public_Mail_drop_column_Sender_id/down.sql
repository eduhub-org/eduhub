comment on column "public"."Mail"."Sender_id" is E'Whenever a new mail is to be sent, a new row with the necessary information to send it is added. After sending it (done by a triggered serverless function) the mailing status is set or changed respectively...';
alter table "public"."Mail"
  add constraint "Mail_Sender_id_fkey"
  foreign key (Sender_id)
  references "public"."User"
  (Id) on update restrict on delete restrict;
alter table "public"."Mail" alter column "Sender_id" drop not null;
alter table "public"."Mail" add column "Sender_id" int4;
