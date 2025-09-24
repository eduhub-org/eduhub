CREATE TABLE "public"."LocationAddress" (
    "id" serial NOT NULL,
    "locationOptionId" text NOT NULL,
    "shortLabel" text NOT NULL,
    "address" text NOT NULL,
    "description" text,
    "aliases" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("locationOptionId") REFERENCES "public"."LocationOption"("value") ON UPDATE restrict ON DELETE restrict,
    -- Optional unique constraint to reduce accidental duplicates
    UNIQUE ("locationOptionId", "shortLabel")
);

COMMENT ON TABLE "public"."LocationAddress" IS E'Represents location addresses that belong to a specific LocationOption. Each address has a short label for display and a full address for details. Supports aliases for flexible search and filtering.';

COMMENT ON COLUMN "public"."LocationAddress"."locationOptionId" IS E'Foreign key to LocationOption. Each address must belong to exactly one location option.';
COMMENT ON COLUMN "public"."LocationAddress"."shortLabel" IS E'Concise label shown in lists and typeahead (e.g., "Room 2.12", "Main Building").';
COMMENT ON COLUMN "public"."LocationAddress"."address" IS E'Full human-readable address (street, building, room number, etc.).';
COMMENT ON COLUMN "public"."LocationAddress"."description" IS E'Optional notes or additional information about the location.';
COMMENT ON COLUMN "public"."LocationAddress"."aliases" IS E'JSON array of alias strings used for autocomplete filtering and search.';


