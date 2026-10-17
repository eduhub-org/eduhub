-- Legacy tables whose Hasura metadata files existed but were never included in
-- tables.yaml (so no GraphQL document could use them). Most were already
-- dropped by earlier migrations; their metadata files are removed together
-- with this migration.
--
-- Defensive on purpose: a table is dropped only if it still exists, holds no
-- rows and nothing depends on it. Anything else is kept and reported with a
-- NOTICE, so this migration can never fail at Hasura startup or lose data.
DO $$
DECLARE
  v_name text;
  v_has_rows boolean;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'AttendanceDocument',
    'AttendanceSourceData',
    'CourseAchievementOption',
    'CourseAddresses',
    'CourseAddress',
    'CourseButtons',
    'CourseCourseTag',
    'CourseDefaultAddresses',
    'CourseDefaultValues',
    'CourseInstructors',
    'CourseProjects',
    'CourseProject',
    'CourseType',
    'CoutseTag',
    'Employment',
    'EnrollmentStatus',
    'Enrollment',
    'Event',
    'Institution',
    'Instructor',
    'LocationOptions',
    'Location',
    'Mailing',
    'Mail',
    'OfferCategoryRelation',
    'OnlineHybridOffline',
    'PerformanceRating',
    'ProjectEnrollment',
    'Referent',
    'SchoolClassRequest',
    'SchoolClass',
    'School',
    'ScientistOfferCategory',
    'ScientistOfferRelation',
    'Scientist',
    'SessionAddressType',
    'Speaker',
    'SurveyType',
    'Teacher',
    'TopicTag',
    'University',
    'Weekdays'
  ]
  LOOP
    -- Only ordinary tables; a view or anything else of that name is left alone.
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_name AND c.relkind = 'r'
    ) THEN
      CONTINUE;
    END IF;

    -- Held until the migration commits, so no row can arrive between the check and the drop.
    EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE', v_name);
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I)', v_name) INTO v_has_rows;
    IF v_has_rows THEN
      RAISE NOTICE 'Keeping legacy table % because it still has rows', v_name;
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE format('DROP TABLE public.%I', v_name);
      RAISE NOTICE 'Dropped empty legacy table %', v_name;
    EXCEPTION WHEN dependent_objects_still_exist THEN
      RAISE NOTICE 'Keeping legacy table % because other objects depend on it', v_name;
    END;
  END LOOP;
END
$$;
