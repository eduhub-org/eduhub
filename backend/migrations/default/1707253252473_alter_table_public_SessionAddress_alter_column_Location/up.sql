comment on column "public"."SessionAddress"."Location" is E'Indicates to which of the existing location options this address is corresponding.';
alter table "public"."SessionAddress" rename column "Location" to "location";
