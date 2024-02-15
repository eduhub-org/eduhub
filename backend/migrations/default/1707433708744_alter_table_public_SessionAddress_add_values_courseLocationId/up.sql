
-- Fill the temporary location field
UPDATE "public"."SessionAddress"
SET "location" = CASE
    WHEN "type" = 'URL' THEN 'ONLINE'
    ELSE 'KIEL'
END;

-- Add the courseLocationId to the SessionAddress table using the location field
UPDATE "public"."SessionAddress" SA
SET "courseLocationId" = (
  SELECT CL."id"
  FROM "public"."CourseLocation" CL
  INNER JOIN "public"."Session" S ON CL."courseId" = S."courseId"
  WHERE CL."locationOption" = SA."location"
    AND S."id" = SA."sessionId"
)
WHERE EXISTS (
  SELECT 1
  FROM "public"."CourseLocation" CL
  INNER JOIN "public"."Session" S ON CL."courseId" = S."courseId"
  WHERE CL."locationOption" = SA."location"
    AND S."id" = SA."sessionId"
);
