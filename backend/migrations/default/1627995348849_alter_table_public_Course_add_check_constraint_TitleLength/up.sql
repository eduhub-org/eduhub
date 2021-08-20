alter table "public"."Course" add constraint "TitleLength" check (char_length('Description') <= 40);
