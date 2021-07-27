alter table "public"."Course"
           add constraint "Course_Online_Hybrid_Offline_fkey"
           foreign key ("Online_Hybrid_Offline")
           references "public"."OnlineHybridOffline"
           ("Value") on update restrict on delete restrict;
