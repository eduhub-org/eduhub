alter table "public"."SessionAddress" add constraint "SessionAddress_courseLocationId_key" unique ("courseLocationId");
comment on column "public"."SessionAddress"."courseLocationId" is E'Provide the id of the course location the address is referring to If the address is part of a course itThe id of a course.';
