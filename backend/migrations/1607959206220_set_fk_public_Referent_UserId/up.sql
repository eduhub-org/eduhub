alter table "public"."Referent"
           add constraint "Referent_UserId_fkey"
           foreign key ("UserId")
           references "public"."User"
           ("Id") on update restrict on delete restrict;
