CREATE TABLE "public"."User"("Id" serial NOT NULL, "Firstname" text NOT NULL, "Lastname" text NOT NULL, "Email" text NOT NULL, "Password" text NOT NULL, PRIMARY KEY ("Id") , UNIQUE ("Id"));
