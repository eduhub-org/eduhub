-- Remove payment registration types from CourseRegistrationType enum
DELETE FROM "public"."CourseRegistrationType" 
WHERE "value" IN ('DIRECT_WITH_INPUT_AND_PAYMENT', 'DIRECT_CONFIRMATION_AND_PAYMENT');

