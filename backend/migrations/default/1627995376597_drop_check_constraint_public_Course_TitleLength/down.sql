alter table "public"."Course" add constraint "TitleLength" check (CHECK (char_length('Description'::text) <= 40));
