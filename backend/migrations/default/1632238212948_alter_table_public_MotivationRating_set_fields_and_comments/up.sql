UPDATE "public"."MotivationRating" SET comment = E'The motivation letter has not been reviewed yet.' WHERE value = E'UNRATED';
UPDATE "public"."MotivationRating" SET comment = E'The applicant shall be invited.' WHERE value = E'INVITE';
UPDATE "public"."MotivationRating" SET comment = E'The application shall be declined.' WHERE value = E'DECLINE';
UPDATE "public"."MotivationRating" SET comment = E'The motivation letter shall be further reviewed.' WHERE value = E'REVIEW';
