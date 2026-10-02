-- The organization a guest typed when re-registering with an address that
-- already has a GUEST row. Held here until the link is confirmed, like
-- newsletterOptIn, so nobody can change another person's organization just by
-- knowing their address.
alter table "public"."GuestRegistrationToken" add column "organizationName" text null;
