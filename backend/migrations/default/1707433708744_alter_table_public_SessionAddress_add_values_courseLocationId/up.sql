-- Step 1: Initially fill the temporary location field
UPDATE "public"."SessionAddress"
SET "location" = CASE
    WHEN "type" = 'URL' THEN 'ONLINE'
    ELSE 'KIEL'
END;

-- Step 2: Update location for sessions of courses with a single CourseLocation
UPDATE "public"."SessionAddress" SA
SET "location" = (
  SELECT CL."locationOption"
  FROM "public"."CourseLocation" CL
  WHERE CL."courseId" IN (
    SELECT S."courseId"
    FROM "public"."Session" S
    WHERE S."id" = SA."sessionId"
  )
  GROUP BY CL."locationOption", CL."courseId"
  HAVING COUNT(CL."locationOption") = 1
)
WHERE "sessionId" IN (
  SELECT S."id"
  FROM "public"."Session" S
  JOIN "public"."CourseLocation" CL ON S."courseId" = CL."courseId"
  GROUP BY S."id", CL."courseId"
  HAVING COUNT(DISTINCT CL."locationOption") = 1
);

-- Step 3: Add the courseLocationId to the SessionAddress table using the updated location field
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
