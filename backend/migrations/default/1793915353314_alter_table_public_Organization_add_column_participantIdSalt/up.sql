-- Funder-specific participant ids for the participants API (functions/apiProxy).
--
-- The API identified a participant as sha256(userId), unsalted, so every
-- funder saw the same id for the same person and could link reports across
-- funders. From now on each funder gets its own secret salt, and the id is
-- HMAC-SHA256(salt, userId): stable within one funder, unlinkable across
-- funders, and not recomputable from a user id without the salt.
--
-- NULL keeps the old unsalted id. Funders already using the API keep it, so
-- their stored reports still match: every organization with an API key at
-- this point, plus the Digital Learning Campus by name, in case it reads the
-- API with a JWT instead of a key (the only funder using the API in
-- production when this was written). Every other organization, and every new
-- one through the column default, gets a random salt.
--
-- The salt is a secret: no Hasura role but admin may read it (none is listed
-- in public_Organization.yaml), and the API reads it with the admin secret.
ALTER TABLE "public"."Organization" ADD COLUMN "participantIdSalt" text NULL
  DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

COMMENT ON COLUMN "public"."Organization"."participantIdSalt" IS
  E'Secret salt for the participant ids this funder sees in the participants API. NULL = legacy unsalted id, kept for funders that used the API before salting. Never expose to non-admin roles.';

-- ADD COLUMN with a volatile default already filled every existing row; reset
-- the existing API users to the legacy id.
UPDATE "public"."Organization"
SET "participantIdSalt" = NULL
WHERE "apiKeyHash" IS NOT NULL
   OR upper(btrim("name")) IN ('DIGITAL LEARNING CAMPUS', 'DLC')
   OR EXISTS (
     SELECT 1 FROM jsonb_array_elements_text(
       CASE WHEN jsonb_typeof("aliases") = 'array' THEN "aliases" ELSE '[]'::jsonb END
     ) AS alias
     WHERE upper(btrim(alias)) IN ('DIGITAL LEARNING CAMPUS', 'DLC')
   );
