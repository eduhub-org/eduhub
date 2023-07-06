--
-- PostgreSQL database dump
--

-- Dumped from database version 12.13 (Debian 12.13-1.pgdg110+1)
-- Dumped by pg_dump version 12.13 (Debian 12.13-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: hdb_catalog; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA hdb_catalog;


--
-- Name: rentAScientist; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "rentAScientist";


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: gen_hasura_uuid(); Type: FUNCTION; Schema: hdb_catalog; Owner: -
--

CREATE FUNCTION hdb_catalog.gen_hasura_uuid() RETURNS uuid
    LANGUAGE sql
    AS $$select gen_random_uuid()$$;


--
-- Name: insert_event_log(text, text, text, text, json); Type: FUNCTION; Schema: hdb_catalog; Owner: -
--

CREATE FUNCTION hdb_catalog.insert_event_log(schema_name text, table_name text, trigger_name text, op text, row_data json) RETURNS text
    LANGUAGE plpgsql
    AS $$
  DECLARE
    id text;
    payload json;
    session_variables json;
    server_version_num int;
    trace_context json;
  BEGIN
    id := gen_random_uuid();
    server_version_num := current_setting('server_version_num');
    IF server_version_num >= 90600 THEN
      session_variables := current_setting('hasura.user', 't');
      trace_context := current_setting('hasura.tracecontext', 't');
    ELSE
      BEGIN
        session_variables := current_setting('hasura.user');
      EXCEPTION WHEN OTHERS THEN
                  session_variables := NULL;
      END;
      BEGIN
        trace_context := current_setting('hasura.tracecontext');
      EXCEPTION WHEN OTHERS THEN
        trace_context := NULL;
      END;
    END IF;
    payload := json_build_object(
      'op', op,
      'data', row_data,
      'session_variables', session_variables,
      'trace_context', trace_context
    );
    INSERT INTO hdb_catalog.event_log
                (id, schema_name, table_name, trigger_name, payload)
    VALUES
    (id, schema_name, table_name, trigger_name, payload);
    RETURN id;
  END;
$$;


--
-- Name: notify_hasura_add_keycloak_admin_role_INSERT(); Type: FUNCTION; Schema: hdb_catalog; Owner: -
--

CREATE FUNCTION hdb_catalog."notify_hasura_add_keycloak_admin_role_INSERT"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  DECLARE
    _old record;
    _new record;
    _data json;
  BEGIN
    IF TG_OP = 'UPDATE' THEN
      _old := row((SELECT  "e"  FROM  (SELECT  OLD."updated_at" , OLD."id" , OLD."created_at" , OLD."userId"        ) AS "e"      ) );
      _new := row((SELECT  "e"  FROM  (SELECT  NEW."updated_at" , NEW."id" , NEW."created_at" , NEW."userId"        ) AS "e"      ) );
    ELSE
    /* initialize _old and _new with dummy values for INSERT and UPDATE events*/
      _old := row((select 1));
      _new := row((select 1));
    END IF;
    _data := json_build_object(
      'old', NULL,
      'new', row_to_json((SELECT  "e"  FROM  (SELECT  NEW."updated_at" , NEW."id" , NEW."created_at" , NEW."userId"        ) AS "e"      ) )
    );
    BEGIN
    /* NOTE: formerly we used TG_TABLE_NAME in place of tableName here. However in the case of
    partitioned tables this will give the name of the partitioned table and since we use the table name to
    get the event trigger configuration from the schema, this fails because the event trigger is only created
    on the original table.  */
      IF (TG_OP <> 'UPDATE') OR (_old <> _new) THEN
        PERFORM hdb_catalog.insert_event_log(CAST('public' AS text), CAST('Admin' AS text), CAST('add_keycloak_admin_role' AS text), TG_OP, _data);
      END IF;
      EXCEPTION WHEN undefined_function THEN
        IF (TG_OP <> 'UPDATE') OR (_old *<> _new) THEN
          PERFORM hdb_catalog.insert_event_log(CAST('public' AS text), CAST('Admin' AS text), CAST('add_keycloak_admin_role' AS text), TG_OP, _data);
        END IF;
    END;

    RETURN NULL;
  END;
$$;


--
-- Name: notify_hasura_add_keycloak_instructor_role_INSERT(); Type: FUNCTION; Schema: hdb_catalog; Owner: -
--

CREATE FUNCTION hdb_catalog."notify_hasura_add_keycloak_instructor_role_INSERT"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  DECLARE
    _old record;
    _new record;
    _data json;
  BEGIN
    IF TG_OP = 'UPDATE' THEN
      _old := row((SELECT  "e"  FROM  (SELECT  OLD."updated_at" , OLD."description" , OLD."id" , OLD."created_at" , OLD."userId"        ) AS "e"      ) );
      _new := row((SELECT  "e"  FROM  (SELECT  NEW."updated_at" , NEW."description" , NEW."id" , NEW."created_at" , NEW."userId"        ) AS "e"      ) );
    ELSE
    /* initialize _old and _new with dummy values for INSERT and UPDATE events*/
      _old := row((select 1));
      _new := row((select 1));
    END IF;
    _data := json_build_object(
      'old', NULL,
      'new', row_to_json((SELECT  "e"  FROM  (SELECT  NEW."updated_at" , NEW."description" , NEW."id" , NEW."created_at" , NEW."userId"        ) AS "e"      ) )
    );
    BEGIN
    /* NOTE: formerly we used TG_TABLE_NAME in place of tableName here. However in the case of
    partitioned tables this will give the name of the partitioned table and since we use the table name to
    get the event trigger configuration from the schema, this fails because the event trigger is only created
    on the original table.  */
      IF (TG_OP <> 'UPDATE') OR (_old <> _new) THEN
        PERFORM hdb_catalog.insert_event_log(CAST('public' AS text), CAST('Expert' AS text), CAST('add_keycloak_instructor_role' AS text), TG_OP, _data);
      END IF;
      EXCEPTION WHEN undefined_function THEN
        IF (TG_OP <> 'UPDATE') OR (_old *<> _new) THEN
          PERFORM hdb_catalog.insert_event_log(CAST('public' AS text), CAST('Expert' AS text), CAST('add_keycloak_instructor_role' AS text), TG_OP, _data);
        END IF;
    END;

    RETURN NULL;
  END;
$$;


--
-- Name: notify_hasura_send_mail_INSERT(); Type: FUNCTION; Schema: hdb_catalog; Owner: -
--

CREATE FUNCTION hdb_catalog."notify_hasura_send_mail_INSERT"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  DECLARE
    _old record;
    _new record;
    _data json;
  BEGIN
    IF TG_OP = 'UPDATE' THEN
      _old := row((SELECT  "e"  FROM  (SELECT  OLD."cc" , OLD."from" , OLD."updated_at" , OLD."bcc" , OLD."to" , OLD."status" , OLD."templateId" , OLD."id" , OLD."created_at" , OLD."content" , OLD."subject"        ) AS "e"      ) );
      _new := row((SELECT  "e"  FROM  (SELECT  NEW."cc" , NEW."from" , NEW."updated_at" , NEW."bcc" , NEW."to" , NEW."status" , NEW."templateId" , NEW."id" , NEW."created_at" , NEW."content" , NEW."subject"        ) AS "e"      ) );
    ELSE
    /* initialize _old and _new with dummy values for INSERT and UPDATE events*/
      _old := row((select 1));
      _new := row((select 1));
    END IF;
    _data := json_build_object(
      'old', NULL,
      'new', row_to_json((SELECT  "e"  FROM  (SELECT  NEW."cc" , NEW."from" , NEW."updated_at" , NEW."bcc" , NEW."to" , NEW."status" , NEW."templateId" , NEW."id" , NEW."created_at" , NEW."content" , NEW."subject"        ) AS "e"      ) )
    );
    BEGIN
    /* NOTE: formerly we used TG_TABLE_NAME in place of tableName here. However in the case of
    partitioned tables this will give the name of the partitioned table and since we use the table name to
    get the event trigger configuration from the schema, this fails because the event trigger is only created
    on the original table.  */
      IF (TG_OP <> 'UPDATE') OR (_old <> _new) THEN
        PERFORM hdb_catalog.insert_event_log(CAST('public' AS text), CAST('MailLog' AS text), CAST('send_mail' AS text), TG_OP, _data);
      END IF;
      EXCEPTION WHEN undefined_function THEN
        IF (TG_OP <> 'UPDATE') OR (_old *<> _new) THEN
          PERFORM hdb_catalog.insert_event_log(CAST('public' AS text), CAST('MailLog' AS text), CAST('send_mail' AS text), TG_OP, _data);
        END IF;
    END;

    RETURN NULL;
  END;
$$;


--
-- Name: set_current_timestamp_updatedAt(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public."set_current_timestamp_updatedAt"() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updatedAt" = NOW();
  RETURN _new;
END;
$$;


--
-- Name: set_current_timestamp_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: event_invocation_logs; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.event_invocation_logs (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    trigger_name text,
    event_id text,
    status integer,
    request json,
    response json,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: event_log; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.event_log (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    trigger_name text NOT NULL,
    payload jsonb NOT NULL,
    delivered boolean DEFAULT false NOT NULL,
    error boolean DEFAULT false NOT NULL,
    tries integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    locked timestamp with time zone,
    next_retry_at timestamp without time zone,
    archived boolean DEFAULT false NOT NULL
);


--
-- Name: hdb_action_log; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_action_log (
    id uuid DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    action_name text,
    input_payload jsonb NOT NULL,
    request_headers jsonb NOT NULL,
    session_variables jsonb NOT NULL,
    response_payload jsonb,
    errors jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    response_received_at timestamp with time zone,
    status text NOT NULL,
    CONSTRAINT hdb_action_log_status_check CHECK ((status = ANY (ARRAY['created'::text, 'processing'::text, 'completed'::text, 'error'::text])))
);


--
-- Name: hdb_cron_event_invocation_logs; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_cron_event_invocation_logs (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    event_id text,
    status integer,
    request json,
    response json,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hdb_cron_events; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_cron_events (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    trigger_name text NOT NULL,
    scheduled_time timestamp with time zone NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    tries integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    next_retry_at timestamp with time zone,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['scheduled'::text, 'locked'::text, 'delivered'::text, 'error'::text, 'dead'::text])))
);


--
-- Name: hdb_event_log_cleanups; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_event_log_cleanups (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    trigger_name text NOT NULL,
    scheduled_at timestamp without time zone NOT NULL,
    deleted_event_logs integer,
    deleted_event_invocation_logs integer,
    status text NOT NULL,
    CONSTRAINT hdb_event_log_cleanups_status_check CHECK ((status = ANY (ARRAY['scheduled'::text, 'paused'::text, 'completed'::text, 'dead'::text])))
);


--
-- Name: hdb_metadata; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_metadata (
    id integer NOT NULL,
    metadata json NOT NULL,
    resource_version integer DEFAULT 1 NOT NULL
);


--
-- Name: hdb_scheduled_event_invocation_logs; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_scheduled_event_invocation_logs (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    event_id text,
    status integer,
    request json,
    response json,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hdb_scheduled_events; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_scheduled_events (
    id text DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    webhook_conf json NOT NULL,
    scheduled_time timestamp with time zone NOT NULL,
    retry_conf json,
    payload json,
    header_conf json,
    status text DEFAULT 'scheduled'::text NOT NULL,
    tries integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    next_retry_at timestamp with time zone,
    comment text,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['scheduled'::text, 'locked'::text, 'delivered'::text, 'error'::text, 'dead'::text])))
);


--
-- Name: hdb_schema_notifications; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_schema_notifications (
    id integer NOT NULL,
    notification json NOT NULL,
    resource_version integer DEFAULT 1 NOT NULL,
    instance_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT hdb_schema_notifications_id_check CHECK ((id = 1))
);


--
-- Name: hdb_source_catalog_version; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_source_catalog_version (
    version text NOT NULL,
    upgraded_on timestamp with time zone NOT NULL
);


--
-- Name: hdb_version; Type: TABLE; Schema: hdb_catalog; Owner: -
--

CREATE TABLE hdb_catalog.hdb_version (
    hasura_uuid uuid DEFAULT hdb_catalog.gen_hasura_uuid() NOT NULL,
    version text NOT NULL,
    upgraded_on timestamp with time zone NOT NULL,
    cli_state jsonb DEFAULT '{}'::jsonb NOT NULL,
    console_state jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: AchievementOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AchievementOption" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "recordType" text NOT NULL,
    "documentationTemplateUrl" text NOT NULL,
    "evaluationScriptUrl" text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "csvTemplateUrl" text,
    "showScoreAuthors" boolean
);


--
-- Name: TABLE "AchievementOption"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AchievementOption" IS 'A new row can be added by an admin or instructor to then make these achievement options available in specific courses.';


--
-- Name: COLUMN "AchievementOption".title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOption".title IS 'Title of an offered achievement option';


--
-- Name: COLUMN "AchievementOption".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOption".description IS 'Description of an offered achievement option';


--
-- Name: COLUMN "AchievementOption"."recordType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOption"."recordType" IS 'Type of the achivement record that must be uploaded for this option';


--
-- Name: COLUMN "AchievementOption"."documentationTemplateUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOption"."documentationTemplateUrl" IS 'An instructor or project mentor can provide a template for the record that must be uploaded to complete this achievement';


--
-- Name: COLUMN "AchievementOption"."evaluationScriptUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOption"."evaluationScriptUrl" IS 'If the record tye is "DOCUMENTATION_AND_CSV" an URL to a python script can be provided that returns a score for uploaded csv data.';


--
-- Name: COLUMN "AchievementOption"."csvTemplateUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOption"."csvTemplateUrl" IS 'URL to the template that shall be used for uploading csv data for a new achievement record';


--
-- Name: COLUMN "AchievementOption"."showScoreAuthors"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOption"."showScoreAuthors" IS 'For TRUE the score table will include a column showing the authors; for FALSE the scores will be anonymous.';


--
-- Name: AchievementOptionCourse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AchievementOptionCourse" (
    id integer NOT NULL,
    "achievementOptionId" integer NOT NULL,
    "courseId" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE "AchievementOptionCourse"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AchievementOptionCourse" IS 'A new row is added when an achievement option is added to a course by the respective course instructor or an admin.';


--
-- Name: COLUMN "AchievementOptionCourse"."achievementOptionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOptionCourse"."achievementOptionId" IS 'ID of an achievement option that can be selected for a given course';


--
-- Name: COLUMN "AchievementOptionCourse"."courseId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOptionCourse"."courseId" IS 'ID of a course for which this achievement optoin can be selected to provided an achievement record.';


--
-- Name: AchievementOptionCourse_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AchievementOptionCourse_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AchievementOptionCourse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AchievementOptionCourse_id_seq" OWNED BY public."AchievementOptionCourse".id;


--
-- Name: AchievementOptionMentor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AchievementOptionMentor" (
    id integer NOT NULL,
    "achievementOptionId" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: TABLE "AchievementOptionMentor"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AchievementOptionMentor" IS 'A new row is added for each expert added as mentor to an achievement option.';


--
-- Name: COLUMN "AchievementOptionMentor"."achievementOptionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOptionMentor"."achievementOptionId" IS 'ID of an achievement option mentored by a specific expert';


--
-- Name: COLUMN "AchievementOptionMentor"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementOptionMentor"."userId" IS 'ID of an expert that is mentor for an achievement option';


--
-- Name: AchievementOptionMentor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AchievementOptionMentor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AchievementOptionMentor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AchievementOptionMentor_id_seq" OWNED BY public."AchievementOptionMentor".id;


--
-- Name: AchievementOption_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AchievementOption_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AchievementOption_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AchievementOption_id_seq" OWNED BY public."AchievementOption".id;


--
-- Name: AchievementRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AchievementRecord" (
    id integer NOT NULL,
    "coverImageUrl" text NOT NULL,
    description text NOT NULL,
    rating text NOT NULL,
    score numeric NOT NULL,
    "achievementOptionId" integer,
    "documentationUrl" text,
    "csvResults" text,
    "evaluationScriptUrl" text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "uploadUserId" uuid NOT NULL
);


--
-- Name: TABLE "AchievementRecord"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AchievementRecord" IS 'A new row is created whenever a user uploads a new record for an achievement option.';


--
-- Name: COLUMN "AchievementRecord"."coverImageUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord"."coverImageUrl" IS 'Image that will be used for the project gallery';


--
-- Name: COLUMN "AchievementRecord".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord".description IS 'Description that will be used in the project gallery';


--
-- Name: COLUMN "AchievementRecord".rating; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord".rating IS 'The course instructor''s or mentor''s rating for the achievement record';


--
-- Name: COLUMN "AchievementRecord".score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord".score IS 'Score calculated for possibly uploaded csv data.';


--
-- Name: COLUMN "AchievementRecord"."achievementOptionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord"."achievementOptionId" IS 'ID of hte achievement option the record is uploaded for.';


--
-- Name: COLUMN "AchievementRecord"."documentationUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord"."documentationUrl" IS 'URL to the uploaded file with the documentation of the record.';


--
-- Name: COLUMN "AchievementRecord"."csvResults"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord"."csvResults" IS 'Base64 encoded string of the uploaded csv data';


--
-- Name: COLUMN "AchievementRecord"."evaluationScriptUrl"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord"."evaluationScriptUrl" IS 'URL for the evaluation function that will be triggered when a new record with csv data is inserted';


--
-- Name: COLUMN "AchievementRecord"."uploadUserId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecord"."uploadUserId" IS 'ID of the user who uploaded the record';


--
-- Name: AchievementRecordAuthor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AchievementRecordAuthor" (
    id integer NOT NULL,
    "achievementRecordId" integer NOT NULL,
    "userId" uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE "AchievementRecordAuthor"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AchievementRecordAuthor" IS 'A new row is added for each user selected as author in the modal to upload an achievement record.';


--
-- Name: COLUMN "AchievementRecordAuthor"."achievementRecordId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecordAuthor"."achievementRecordId" IS 'ID of an uploaded achievement record';


--
-- Name: COLUMN "AchievementRecordAuthor"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."AchievementRecordAuthor"."userId" IS 'ID of a user that is author of an uploaded achievement record';


--
-- Name: AchievementRecordAuthor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AchievementRecordAuthor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AchievementRecordAuthor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AchievementRecordAuthor_id_seq" OWNED BY public."AchievementRecordAuthor".id;


--
-- Name: AchievementRecordRating; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AchievementRecordRating" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "AchievementRecordRating"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AchievementRecordRating" IS 'The possible ratings an instructor or admin can give an uploaded achievement record';


--
-- Name: AchievementRecordType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AchievementRecordType" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "AchievementRecordType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AchievementRecordType" IS 'Possible types for the records of achievement options.';


--
-- Name: AchievementRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AchievementRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AchievementRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AchievementRecord_id_seq" OWNED BY public."AchievementRecord".id;


--
-- Name: Admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Admin" (
    id integer NOT NULL,
    "userId" uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE "Admin"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Admin" IS 'Rows for new admin users are added or removed by other admin users.';


--
-- Name: COLUMN "Admin"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Admin"."userId" IS 'The admin''s user ID';


--
-- Name: Admin_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Admin_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Admin_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Admin_Id_seq" OWNED BY public."Admin".id;


--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attendance" (
    id integer NOT NULL,
    "sessionId" integer NOT NULL,
    "userId" uuid,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "recordedName" text,
    source text NOT NULL,
    "startDateTime" timestamp with time zone,
    "endDateTime" timestamp with time zone,
    "totalAttendanceTime" integer,
    "interruptionCount" integer
);


--
-- Name: TABLE "Attendance"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Attendance" IS 'Rows with new attendances are added by a serverless function, which ckecks on a regular bases if sessions are over and then adds the new attendances to this table.';


--
-- Name: COLUMN "Attendance"."sessionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance"."sessionId" IS 'The ID of the session for which the attendance was recorded';


--
-- Name: COLUMN "Attendance"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance"."userId" IS 'The ID of the user for which the attendance was recorded (only provided if the recorded name was in accordance with the name of a user registered for the session)';


--
-- Name: COLUMN "Attendance".status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance".status IS 'The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED';


--
-- Name: COLUMN "Attendance"."recordedName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance"."recordedName" IS 'The recorded name is the one used for the comparison with names of registered attendees.';


--
-- Name: COLUMN "Attendance".source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance".source IS 'The source that provided the recorded names of the attendees.';


--
-- Name: COLUMN "Attendance"."startDateTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance"."startDateTime" IS 'The day and time the user started to attend the session';


--
-- Name: COLUMN "Attendance"."endDateTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance"."endDateTime" IS 'The day and time the user left the session. It is not necessarily existing (usually only in only attendance).';


--
-- Name: COLUMN "Attendance"."totalAttendanceTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance"."totalAttendanceTime" IS 'If there were interruptions, it is less then the difference of endDateTime and startDateTime.';


--
-- Name: COLUMN "Attendance"."interruptionCount"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Attendance"."interruptionCount" IS 'The count of the number of interruptions a user had while attending (for online attendance only)';


--
-- Name: AttendanceSource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceSource" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "AttendanceSource"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AttendanceSource" IS 'Sources providing the names and times of recorded attendances';


--
-- Name: AttendanceStatus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceStatus" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "AttendanceStatus"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."AttendanceStatus" IS 'Possible status of an attendance';


--
-- Name: Attendence_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Attendence_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Attendence_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Attendence_Id_seq" OWNED BY public."Attendance".id;


--
-- Name: Course; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Course" (
    id integer NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    ects text NOT NULL,
    tagline text NOT NULL,
    language text,
    "applicationEnd" date NOT NULL,
    cost text DEFAULT 'NO_COST'::text NOT NULL,
    "achievementCertificatePossible" boolean NOT NULL,
    "attendanceCertificatePossible" boolean NOT NULL,
    "maxMissedSessions" integer NOT NULL,
    "weekDay" text,
    "coverImage" text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "programId" integer,
    "headingDescriptionField1" text NOT NULL,
    "headingDescriptionField2" text,
    "contentDescriptionField1" text,
    "contentDescriptionField2" text,
    "learningGoals" text,
    "chatLink" text,
    visibility boolean DEFAULT false,
    "maxParticipants" integer,
    "endTime" timestamp with time zone,
    "startTime" timestamp with time zone
);


--
-- Name: TABLE "Course"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Course" IS 'New courses are added by admins only and belong to exactly one program. Most of the columns can be set by the instructor and the admin.';


--
-- Name: COLUMN "Course".title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course".title IS 'The title of the course (only editable by an admin user)';


--
-- Name: COLUMN "Course".status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course".status IS 'Shows whether the current status is DRAFT, READY_FOR_PUBLICATION, READY_FOR_APPLICATION, APPLICANTS_INVITED, or PARTICIPANTS_RATED, which is set in correspondance to the tabs completed on the course administration page';


--
-- Name: COLUMN "Course".ects; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course".ects IS 'The number of ECTS of the course (only editable by an admin user))';


--
-- Name: COLUMN "Course".tagline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course".tagline IS 'Shown below the title on the course page';


--
-- Name: COLUMN "Course".language; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course".language IS 'The language the course is given in.';


--
-- Name: COLUMN "Course"."applicationEnd"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."applicationEnd" IS 'Last day before applications are closed. (Set to the program''s default value when the course is created.)';


--
-- Name: COLUMN "Course".cost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course".cost IS 'A text providing info about the costs of a participation.';


--
-- Name: COLUMN "Course"."achievementCertificatePossible"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."achievementCertificatePossible" IS 'Indicates whether participants can get an achievement certificate. If the course is offering ECTS, it must be possible to obtain this certificate for the course';


--
-- Name: COLUMN "Course"."attendanceCertificatePossible"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."attendanceCertificatePossible" IS 'Indicates whether participants will get a certificate showing the list of attendances (only issued if the did not miss then maxMissedCourses)';


--
-- Name: COLUMN "Course"."maxMissedSessions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."maxMissedSessions" IS 'The maximum number of sessions a participant can miss while still receiving a certificate';


--
-- Name: COLUMN "Course"."weekDay"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."weekDay" IS 'The day of the week the course takes place.';


--
-- Name: COLUMN "Course"."coverImage"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."coverImage" IS 'The cover image for the course';


--
-- Name: COLUMN "Course"."programId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."programId" IS 'Id of the program to which the course belongs.';


--
-- Name: COLUMN "Course"."headingDescriptionField1"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."headingDescriptionField1" IS 'Heading of the the first course description field';


--
-- Name: COLUMN "Course"."headingDescriptionField2"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."headingDescriptionField2" IS 'Heading of the the second course description field';


--
-- Name: COLUMN "Course"."contentDescriptionField1"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."contentDescriptionField1" IS 'Content of the first course description field';


--
-- Name: COLUMN "Course"."contentDescriptionField2"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."contentDescriptionField2" IS 'Content of the second course description field';


--
-- Name: COLUMN "Course"."learningGoals"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."learningGoals" IS 'An array of texts including the learning goals for the course';


--
-- Name: COLUMN "Course"."chatLink"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."chatLink" IS 'The link to the chat of the course (e.g. a mattermost channel)';


--
-- Name: COLUMN "Course".visibility; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course".visibility IS 'The value decides whether the course is visible for users or anoymous persons.';


--
-- Name: COLUMN "Course"."maxParticipants"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."maxParticipants" IS 'The number of maximum participants in the course.';


--
-- Name: COLUMN "Course"."endTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."endTime" IS 'The time the course ends each week.';


--
-- Name: COLUMN "Course"."startTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Course"."startTime" IS 'The time the course starts each week.';


--
-- Name: CourseLocation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CourseLocation" (
    id integer NOT NULL,
    "courseId" integer NOT NULL,
    latitude text,
    longitude text,
    link text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "locationOption" text
);


--
-- Name: TABLE "CourseLocation"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."CourseLocation" IS 'The course instructor can add one or several of the possible general locations for the administration of a course. Further, either a link to a video conference or GPS coordinates of an actual location can be provided. The latter will be used as defaul values for the location addresses provided in each session.';


--
-- Name: COLUMN "CourseLocation"."courseId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseLocation"."courseId" IS 'The ID of the course for which the location is provided for';


--
-- Name: COLUMN "CourseLocation".latitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseLocation".latitude IS 'The latitude of the address (only provided if it is an offline address)';


--
-- Name: COLUMN "CourseLocation".longitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseLocation".longitude IS 'The longitude of the address (only provided if it is an offline address)';


--
-- Name: COLUMN "CourseLocation".link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseLocation".link IS 'HTTP address of the video conference for online participation (only provided if it is an online address)';


--
-- Name: COLUMN "CourseLocation"."locationOption"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseLocation"."locationOption" IS 'Either ''ONLINE'' or one of the possible given offline locations';


--
-- Name: CourseAddress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CourseAddress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CourseAddress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CourseAddress_id_seq" OWNED BY public."CourseLocation".id;


--
-- Name: CourseEnrollment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CourseEnrollment" (
    id integer NOT NULL,
    "courseId" integer NOT NULL,
    "userId" uuid NOT NULL,
    status text DEFAULT 'APPLIED'::text NOT NULL,
    "motivationLetter" text NOT NULL,
    "motivationRating" text DEFAULT 'UNRATED'::text NOT NULL,
    "achievementCertificateURL" text,
    "attendanceCertificateURL" text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "invitationExpirationDate" date
);


--
-- Name: TABLE "CourseEnrollment"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."CourseEnrollment" IS 'A new enrollment is added as soon as a user applies for a course. It includes all information about a (potential) particiaption in a course.';


--
-- Name: COLUMN "CourseEnrollment"."courseId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment"."courseId" IS 'The ID of the course of this enrollment from the given user';


--
-- Name: COLUMN "CourseEnrollment"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment"."userId" IS 'The ID of the user that enrolled for the given course';


--
-- Name: COLUMN "CourseEnrollment".status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment".status IS 'The users current enrollment status to this course';


--
-- Name: COLUMN "CourseEnrollment"."motivationLetter"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment"."motivationLetter" IS 'The text of the user''s motivation letter';


--
-- Name: COLUMN "CourseEnrollment"."motivationRating"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment"."motivationRating" IS 'Rating that the user''s motivation letter received from the course instructor';


--
-- Name: COLUMN "CourseEnrollment"."achievementCertificateURL"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment"."achievementCertificateURL" IS 'URL to the file containing the user''s achievement certificate (if he obtained one)';


--
-- Name: COLUMN "CourseEnrollment"."attendanceCertificateURL"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment"."attendanceCertificateURL" IS 'URL to the file containing the user''s attendance certificate (if he obtained one)';


--
-- Name: COLUMN "CourseEnrollment"."invitationExpirationDate"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseEnrollment"."invitationExpirationDate" IS 'The last day a user can confirm his/her invitation to the given course';


--
-- Name: CourseEnrollmentStatus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CourseEnrollmentStatus" (
    value text NOT NULL,
    comment text NOT NULL
);


--
-- Name: TABLE "CourseEnrollmentStatus"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."CourseEnrollmentStatus" IS 'A user''s enrollment status for a given course. It is changed according to his acceptance to the course and depending on his participation success.';


--
-- Name: CourseInstructor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CourseInstructor" (
    id integer NOT NULL,
    "courseId" integer NOT NULL,
    "expertId" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE "CourseInstructor"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."CourseInstructor" IS 'A new course instructor is added as soon as an admin selects an expert (or a user - which is then added to the expert table) as an instructor for a course.';


--
-- Name: COLUMN "CourseInstructor"."courseId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseInstructor"."courseId" IS 'ID of the course which has the given expert as an instructor';


--
-- Name: COLUMN "CourseInstructor"."expertId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."CourseInstructor"."expertId" IS 'ID of the expert, who is instructor for the given course';


--
-- Name: CourseInstructor_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CourseInstructor_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CourseInstructor_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CourseInstructor_Id_seq" OWNED BY public."CourseInstructor".id;


--
-- Name: CourseStatus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CourseStatus" (
    value text NOT NULL,
    comment text NOT NULL
);


--
-- Name: TABLE "CourseStatus"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."CourseStatus" IS 'The different status a course gets according to instructor''s completion of the tabs in the course admin page.';


--
-- Name: Course_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Course_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Course_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Course_Id_seq" OWNED BY public."Course".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "startDateTime" timestamp with time zone NOT NULL,
    "endDateTime" timestamp with time zone NOT NULL,
    "courseId" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "attendanceData" text
);


--
-- Name: TABLE "Session"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Session" IS 'Includes all information about the individual sessions in a course.';


--
-- Name: COLUMN "Session".title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Session".title IS 'The title of the session';


--
-- Name: COLUMN "Session".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Session".description IS 'A description of the session';


--
-- Name: COLUMN "Session"."startDateTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Session"."startDateTime" IS 'The day and time of the start of the session';


--
-- Name: COLUMN "Session"."endDateTime"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Session"."endDateTime" IS 'The day and time of the end of the session';


--
-- Name: COLUMN "Session"."courseId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Session"."courseId" IS 'The ID of the course the session belongs to';


--
-- Name: COLUMN "Session"."attendanceData"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Session"."attendanceData" IS 'JSON string including all recorded participations for the session (also those that were not matched to registered participants)';


--
-- Name: Date_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Date_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Date_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Date_Id_seq" OWNED BY public."Session".id;


--
-- Name: Employment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Employment" (
    value text NOT NULL,
    comment text NOT NULL
);


--
-- Name: TABLE "Employment"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Employment" IS 'The different status of employment that a user can provide';


--
-- Name: Enrollment_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Enrollment_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Enrollment_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Enrollment_Id_seq" OWNED BY public."CourseEnrollment".id;


--
-- Name: Expert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Expert" (
    id integer NOT NULL,
    "userId" uuid NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE "Expert"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Expert" IS 'Whenever a user is chosen to be an instructor or speaker and he has not been so before, a new entry is added.';


--
-- Name: COLUMN "Expert"."userId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Expert"."userId" IS 'The ID of the user that is instructor';


--
-- Name: COLUMN "Expert".description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Expert".description IS 'A short description on the expert''s background';


--
-- Name: Instructor_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Instructor_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Instructor_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Instructor_Id_seq" OWNED BY public."Expert".id;


--
-- Name: Language; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Language" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "Language"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Language" IS 'Available languages to select from, e.g., to set the primary instruction language of a course.';


--
-- Name: LocationOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LocationOption" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "LocationOption"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."LocationOption" IS 'Possible general location options where a course can be administered.';


--
-- Name: MailLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MailLog" (
    id integer NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    "to" text NOT NULL,
    "from" text NOT NULL,
    cc text,
    bcc text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "templateId" integer,
    status text
);


--
-- Name: TABLE "MailLog"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."MailLog" IS 'Whenever a new mail is to be sent, a new row with the necessary information to send it is added. After sending it (done by a triggered serverless function) the mailing status is set or changed respectively...';


--
-- Name: COLUMN "MailLog".subject; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog".subject IS 'The subject of the email';


--
-- Name: COLUMN "MailLog".content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog".content IS 'The (html) text content of the email';


--
-- Name: COLUMN "MailLog"."to"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog"."to" IS 'The email address(es) of the recipient(s)';


--
-- Name: COLUMN "MailLog"."from"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog"."from" IS 'The sender address of the email';


--
-- Name: COLUMN "MailLog".cc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog".cc IS 'Mail adresses that are receiving a carbon copy';


--
-- Name: COLUMN "MailLog".bcc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog".bcc IS 'Mail adresses that are receiving a blind carbon copy';


--
-- Name: COLUMN "MailLog"."templateId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog"."templateId" IS 'The ID of the template that was used to generate the mail.';


--
-- Name: COLUMN "MailLog".status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailLog".status IS 'Mailing status of the given mail';


--
-- Name: MailStatus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MailStatus" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "MailStatus"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."MailStatus" IS 'The different status a mail in the MailLog can have.';


--
-- Name: MailTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MailTemplate" (
    id integer NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "from" text,
    cc text,
    bcc text,
    title text
);


--
-- Name: TABLE "MailTemplate"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."MailTemplate" IS 'Mail templates to send users relevant information when certain conditions are met. The conditions are checked by a serverless function or are directly initiated by events in the frontend, which then also sends the mails.';


--
-- Name: COLUMN "MailTemplate".subject; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailTemplate".subject IS 'The subject of the email';


--
-- Name: COLUMN "MailTemplate".content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailTemplate".content IS 'The (html) text content of the email';


--
-- Name: COLUMN "MailTemplate"."from"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailTemplate"."from" IS 'Mail adress provided as sender address';


--
-- Name: COLUMN "MailTemplate".cc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailTemplate".cc IS 'Mail adresses that are receiving a carbon copy';


--
-- Name: COLUMN "MailTemplate".bcc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailTemplate".bcc IS 'Mail adresses that are receiving a blind carbon copy';


--
-- Name: COLUMN "MailTemplate".title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."MailTemplate".title IS 'Title of the mail template (to provide basic info on what it''s used for)';


--
-- Name: MailTemplate_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MailTemplate_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MailTemplate_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MailTemplate_Id_seq" OWNED BY public."MailTemplate".id;


--
-- Name: Mail_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Mail_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Mail_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Mail_Id_seq" OWNED BY public."MailLog".id;


--
-- Name: MotivationRating; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MotivationRating" (
    value text NOT NULL,
    comment text NOT NULL
);


--
-- Name: TABLE "MotivationRating"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."MotivationRating" IS 'The rating for a motivation letter to apply for a course. It stores the info on whether an applicant gets an invitation or not.';


--
-- Name: Program; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Program" (
    id integer NOT NULL,
    title text NOT NULL,
    "lectureStart" date,
    "lectureEnd" date,
    "applicationStart" date,
    "defaultApplicationEnd" date,
    "achievementRecordUploadDeadline" date,
    visibility boolean DEFAULT false NOT NULL,
    "startQuestionnaire" text,
    "speakerQuestionnaire" text,
    "closingQuestionnaire" text,
    "visibilityParticipationCertificate" boolean DEFAULT false,
    "visibilityAchievementCertificate" boolean DEFAULT false,
    "attendanceCertificateTemplateURL" text,
    "participationCertificateTemplateURL" text,
    "shortTitle" text,
    "defaultMaxMissedSessions" integer DEFAULT 2
);


--
-- Name: TABLE "Program"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."Program" IS 'Admins can add new program, which are basically a set of courses with similar characteristics and a similar time frame. The table also includes default values for the courses, which might be adapted on the course level though.';


--
-- Name: COLUMN "Program".title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program".title IS 'The title of the program';


--
-- Name: COLUMN "Program"."lectureStart"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."lectureStart" IS 'The first day a course lecture can possibly be in this program.';


--
-- Name: COLUMN "Program"."lectureEnd"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."lectureEnd" IS 'The last day a course lecture can possibly be in this program.';


--
-- Name: COLUMN "Program"."applicationStart"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."applicationStart" IS 'The day the application for all courses of the program start.';


--
-- Name: COLUMN "Program"."defaultApplicationEnd"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."defaultApplicationEnd" IS 'The default application deadline for a course. It can be changed on the course level.';


--
-- Name: COLUMN "Program"."achievementRecordUploadDeadline"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."achievementRecordUploadDeadline" IS 'The deadline for the achievement record uploads.';


--
-- Name: COLUMN "Program".visibility; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program".visibility IS 'Defines whether the tab for this course program is shown or not.';


--
-- Name: COLUMN "Program"."startQuestionnaire"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."startQuestionnaire" IS 'The questionnaire that the participants of all courses get sent after the first session of their course.';


--
-- Name: COLUMN "Program"."speakerQuestionnaire"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."speakerQuestionnaire" IS 'The questionnaire that is sent after all course sessions including a speaker.';


--
-- Name: COLUMN "Program"."closingQuestionnaire"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."closingQuestionnaire" IS 'The questionnaire that the participants of all courses get sent after the last session of their course.';


--
-- Name: COLUMN "Program"."visibilityParticipationCertificate"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."visibilityParticipationCertificate" IS 'Sets the participation certificates for all courses of htis program to be visible for the recipients.';


--
-- Name: COLUMN "Program"."visibilityAchievementCertificate"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."visibilityAchievementCertificate" IS 'Sets the achievement certificates for all courses of htis program to be visible for the recipients.';


--
-- Name: COLUMN "Program"."attendanceCertificateTemplateURL"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."attendanceCertificateTemplateURL" IS 'The URL to the pdf template for the attendance certificate';


--
-- Name: COLUMN "Program"."participationCertificateTemplateURL"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."participationCertificateTemplateURL" IS 'The URL to the pdf template for the attendance certificate';


--
-- Name: COLUMN "Program"."shortTitle"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."shortTitle" IS 'The 6 letter short title for the program.';


--
-- Name: COLUMN "Program"."defaultMaxMissedSessions"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."Program"."defaultMaxMissedSessions" IS 'The default maximum number of sessions a participant can miss in a course while still receiving a certificate. It can be changed on the course level.';


--
-- Name: Semester_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Semester_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Semester_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Semester_Id_seq" OWNED BY public."Program".id;


--
-- Name: SessionAddress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SessionAddress" (
    id integer NOT NULL,
    latitude text,
    longitude text,
    link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "sessionId" integer NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    type text DEFAULT 'FREETEXT_ADDRESS'::text NOT NULL
);


--
-- Name: TABLE "SessionAddress"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."SessionAddress" IS 'One or several addresses for a session. When a new course is added all sessions will initially get the default address(es) provided in the course table.';


--
-- Name: COLUMN "SessionAddress".latitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."SessionAddress".latitude IS 'The latitude of the address (if it is an offline location)';


--
-- Name: COLUMN "SessionAddress".longitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."SessionAddress".longitude IS 'The longitude of the address (if it is an offline location)';


--
-- Name: COLUMN "SessionAddress".link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."SessionAddress".link IS 'The link to a video conference call (if it is an online location)';


--
-- Name: COLUMN "SessionAddress"."sessionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."SessionAddress"."sessionId" IS 'The ID of the session for which the address is provided.';


--
-- Name: COLUMN "SessionAddress".address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."SessionAddress".address IS 'Where the session will take place; might be an offline or online location which is provided according to the provided type';


--
-- Name: SessionAddressType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SessionAddressType" (
    value text NOT NULL,
    comment text
);


--
-- Name: TABLE "SessionAddressType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."SessionAddressType" IS 'Types defining the format of the address that is provided for a session';


--
-- Name: SessionAddress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."SessionAddress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SessionAddress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."SessionAddress_id_seq" OWNED BY public."SessionAddress".id;


--
-- Name: SessionSpeaker; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SessionSpeaker" (
    id integer NOT NULL,
    "sessionId" integer NOT NULL,
    "expertId" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE "SessionSpeaker"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."SessionSpeaker" IS 'A new session speaker is added as soon as an instructor selects an expert (or a user - which is then added to the expert table) as a speaker for a session.';


--
-- Name: COLUMN "SessionSpeaker"."sessionId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."SessionSpeaker"."sessionId" IS 'ID of the session which has the given expert as a speaker';


--
-- Name: COLUMN "SessionSpeaker"."expertId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."SessionSpeaker"."expertId" IS 'ID of the expert, who is speaker for the given session';


--
-- Name: SessionSpeaker_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."SessionSpeaker_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SessionSpeaker_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."SessionSpeaker_id_seq" OWNED BY public."SessionSpeaker".id;


--
-- Name: University; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."University" (
    value text NOT NULL,
    comment text NOT NULL
);


--
-- Name: TABLE "University"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public."University" IS 'Universities that are available in the dropdown list for the profile information';


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    picture text,
    employment text,
    "externalProfile" text,
    "newsletterRegistration" boolean,
    "anonymousId" text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    university text,
    "matriculationNumber" text,
    "otherUniversity" text
);


--
-- Name: COLUMN "User"."firstName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User"."firstName" IS 'The user''s first name';


--
-- Name: COLUMN "User"."lastName"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User"."lastName" IS 'The user''s last name';


--
-- Name: COLUMN "User".email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User".email IS 'The user''s email address';


--
-- Name: COLUMN "User".picture; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User".picture IS 'The user''s profile picture';


--
-- Name: COLUMN "User".employment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User".employment IS 'The user''s current employment status';


--
-- Name: COLUMN "User"."externalProfile"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User"."externalProfile" IS 'A link to an external profile, for example in LinkedIn or Xing';


--
-- Name: COLUMN "User"."newsletterRegistration"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User"."newsletterRegistration" IS 'Inormation whether the user is registered for the newsletter or not.';


--
-- Name: COLUMN "User"."anonymousId"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User"."anonymousId" IS 'A random anonymous ID for the user, which can be used for external communication';


--
-- Name: COLUMN "User".university; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User".university IS 'The university the user is attending or workin at (only provided if he is a student or working in academia)';


--
-- Name: COLUMN "User"."matriculationNumber"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User"."matriculationNumber" IS 'The user''s matriculation number at her/his university';


--
-- Name: COLUMN "User"."otherUniversity"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public."User"."otherUniversity" IS 'Name of the university the student is attending or working at (only provided if his/her university is not part of the provided list)';


--
-- Name: User_Id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_Id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_Id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_Id_seq" OWNED BY public."User".id;


--
-- Name: RentAScientistConfig; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."RentAScientistConfig" (
    id integer NOT NULL,
    program_id integer NOT NULL,
    test_operation boolean DEFAULT true NOT NULL,
    "mailFrom" text
);


--
-- Name: TABLE "RentAScientistConfig"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."RentAScientistConfig" IS 'table configures rent-a-scientist: Which program to use? Needs to be switched once a year...';


--
-- Name: RentAScientistConfig_id_seq; Type: SEQUENCE; Schema: rentAScientist; Owner: -
--

CREATE SEQUENCE "rentAScientist"."RentAScientistConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RentAScientistConfig_id_seq; Type: SEQUENCE OWNED BY; Schema: rentAScientist; Owner: -
--

ALTER SEQUENCE "rentAScientist"."RentAScientistConfig_id_seq" OWNED BY "rentAScientist"."RentAScientistConfig".id;


--
-- Name: School; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."School" (
    dstnr text NOT NULL,
    name text NOT NULL,
    "schoolType" text NOT NULL,
    district text NOT NULL,
    street text NOT NULL,
    "postalCode" text NOT NULL,
    city text NOT NULL
);


--
-- Name: TABLE "School"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."School" IS 'all the schools that exist in Schleswig Holstein. dstnr is the primary key: "Dienstnummer"';


--
-- Name: SchoolClass; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."SchoolClass" (
    name text NOT NULL,
    id integer NOT NULL,
    "schoolId" text NOT NULL,
    "teacherId" integer NOT NULL,
    grade integer NOT NULL,
    "studensCount" integer DEFAULT 0 NOT NULL,
    contact text
);


--
-- Name: TABLE "SchoolClass"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."SchoolClass" IS 'A class of a school enrolled into rent-a-scientist by a teacher';


--
-- Name: SchoolClassRequest; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."SchoolClassRequest" (
    id integer NOT NULL,
    "classId" integer NOT NULL,
    "offerId" integer NOT NULL,
    "possibleDays" integer[] NOT NULL,
    assigned_day integer,
    "commentTime" text,
    "commentGeneral" text
);


--
-- Name: TABLE "SchoolClassRequest"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."SchoolClassRequest" IS 'A request from a school class for a specific offer from a scientist. It can be fulfilled by given an assignment.';


--
-- Name: COLUMN "SchoolClassRequest".assigned_day; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON COLUMN "rentAScientist"."SchoolClassRequest".assigned_day IS 'Needs to be one of the possibleDays values to be valid. -1 is used as value to indicate rejection.';


--
-- Name: SchoolClassRequest_id_seq; Type: SEQUENCE; Schema: rentAScientist; Owner: -
--

CREATE SEQUENCE "rentAScientist"."SchoolClassRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SchoolClassRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: rentAScientist; Owner: -
--

ALTER SEQUENCE "rentAScientist"."SchoolClassRequest_id_seq" OWNED BY "rentAScientist"."SchoolClassRequest".id;


--
-- Name: SchoolClass_id_seq; Type: SEQUENCE; Schema: rentAScientist; Owner: -
--

CREATE SEQUENCE "rentAScientist"."SchoolClass_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SchoolClass_id_seq; Type: SEQUENCE OWNED BY; Schema: rentAScientist; Owner: -
--

ALTER SEQUENCE "rentAScientist"."SchoolClass_id_seq" OWNED BY "rentAScientist"."SchoolClass".id;


--
-- Name: Scientist; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."Scientist" (
    forename text NOT NULL,
    surname text NOT NULL,
    title text NOT NULL,
    id integer NOT NULL,
    image text
);


--
-- Name: TABLE "Scientist"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."Scientist" IS 'Rent-A-Scientist scientist offers courses';


--
-- Name: ScientistOffer; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."ScientistOffer" (
    id integer NOT NULL,
    format text NOT NULL,
    "minimumGrade" integer NOT NULL,
    "maximumGrade" integer NOT NULL,
    "possibleDays" integer[] NOT NULL,
    "timeWindow" text[] NOT NULL,
    "maxDeployments" integer NOT NULL,
    "possibleLocations" text[] NOT NULL,
    "equipmentRequired" text NOT NULL,
    "roomRequirements" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    duration text NOT NULL,
    "extraComment" text NOT NULL,
    "subjectComment" text NOT NULL,
    "programId" integer NOT NULL,
    "classPreparation" text NOT NULL,
    "institutionName" text NOT NULL,
    "institutionLogo" text NOT NULL,
    categories text[] NOT NULL,
    "contactEmail" text,
    "contactPhone" text,
    "contactName" text,
    "researchSubject" text
);


--
-- Name: TABLE "ScientistOffer"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."ScientistOffer" IS 'An offer from a scientist for Rent-A-Scientist';


--
-- Name: ScientistOfferRelation; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."ScientistOfferRelation" (
    "offerId" integer NOT NULL,
    "scientistId" integer NOT NULL
);


--
-- Name: TABLE "ScientistOfferRelation"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."ScientistOfferRelation" IS 'relation between scientists and their offer';


--
-- Name: ScientistOffer_id_seq; Type: SEQUENCE; Schema: rentAScientist; Owner: -
--

CREATE SEQUENCE "rentAScientist"."ScientistOffer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ScientistOffer_id_seq; Type: SEQUENCE OWNED BY; Schema: rentAScientist; Owner: -
--

ALTER SEQUENCE "rentAScientist"."ScientistOffer_id_seq" OWNED BY "rentAScientist"."ScientistOffer".id;


--
-- Name: Scientist_id_seq; Type: SEQUENCE; Schema: rentAScientist; Owner: -
--

CREATE SEQUENCE "rentAScientist"."Scientist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Scientist_id_seq; Type: SEQUENCE OWNED BY; Schema: rentAScientist; Owner: -
--

ALTER SEQUENCE "rentAScientist"."Scientist_id_seq" OWNED BY "rentAScientist"."Scientist".id;


--
-- Name: Teacher; Type: TABLE; Schema: rentAScientist; Owner: -
--

CREATE TABLE "rentAScientist"."Teacher" (
    id integer NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: TABLE "Teacher"; Type: COMMENT; Schema: rentAScientist; Owner: -
--

COMMENT ON TABLE "rentAScientist"."Teacher" IS 'a teacher that has enrolled into rent-a-scientist';


--
-- Name: Teacher_id_seq; Type: SEQUENCE; Schema: rentAScientist; Owner: -
--

CREATE SEQUENCE "rentAScientist"."Teacher_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: rentAScientist; Owner: -
--

ALTER SEQUENCE "rentAScientist"."Teacher_id_seq" OWNED BY "rentAScientist"."Teacher".id;


--
-- Name: AchievementOption id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOption" ALTER COLUMN id SET DEFAULT nextval('public."AchievementOption_id_seq"'::regclass);


--
-- Name: AchievementOptionCourse id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionCourse" ALTER COLUMN id SET DEFAULT nextval('public."AchievementOptionCourse_id_seq"'::regclass);


--
-- Name: AchievementOptionMentor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionMentor" ALTER COLUMN id SET DEFAULT nextval('public."AchievementOptionMentor_id_seq"'::regclass);


--
-- Name: AchievementRecord id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecord" ALTER COLUMN id SET DEFAULT nextval('public."AchievementRecord_id_seq"'::regclass);


--
-- Name: AchievementRecordAuthor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecordAuthor" ALTER COLUMN id SET DEFAULT nextval('public."AchievementRecordAuthor_id_seq"'::regclass);


--
-- Name: Admin id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin" ALTER COLUMN id SET DEFAULT nextval('public."Admin_Id_seq"'::regclass);


--
-- Name: Attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance" ALTER COLUMN id SET DEFAULT nextval('public."Attendence_Id_seq"'::regclass);


--
-- Name: Course id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Course" ALTER COLUMN id SET DEFAULT nextval('public."Course_Id_seq"'::regclass);


--
-- Name: CourseEnrollment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment" ALTER COLUMN id SET DEFAULT nextval('public."Enrollment_Id_seq"'::regclass);


--
-- Name: CourseInstructor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseInstructor" ALTER COLUMN id SET DEFAULT nextval('public."CourseInstructor_Id_seq"'::regclass);


--
-- Name: CourseLocation id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseLocation" ALTER COLUMN id SET DEFAULT nextval('public."CourseAddress_id_seq"'::regclass);


--
-- Name: Expert id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expert" ALTER COLUMN id SET DEFAULT nextval('public."Instructor_Id_seq"'::regclass);


--
-- Name: MailLog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MailLog" ALTER COLUMN id SET DEFAULT nextval('public."Mail_Id_seq"'::regclass);


--
-- Name: MailTemplate id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MailTemplate" ALTER COLUMN id SET DEFAULT nextval('public."MailTemplate_Id_seq"'::regclass);


--
-- Name: Program id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Program" ALTER COLUMN id SET DEFAULT nextval('public."Semester_Id_seq"'::regclass);


--
-- Name: Session id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session" ALTER COLUMN id SET DEFAULT nextval('public."Date_Id_seq"'::regclass);


--
-- Name: SessionAddress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionAddress" ALTER COLUMN id SET DEFAULT nextval('public."SessionAddress_id_seq"'::regclass);


--
-- Name: SessionSpeaker id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionSpeaker" ALTER COLUMN id SET DEFAULT nextval('public."SessionSpeaker_id_seq"'::regclass);


--
-- Name: RentAScientistConfig id; Type: DEFAULT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."RentAScientistConfig" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."RentAScientistConfig_id_seq"'::regclass);


--
-- Name: SchoolClass id; Type: DEFAULT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClass" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."SchoolClass_id_seq"'::regclass);


--
-- Name: SchoolClassRequest id; Type: DEFAULT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."SchoolClassRequest_id_seq"'::regclass);


--
-- Name: Scientist id; Type: DEFAULT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."Scientist" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."Scientist_id_seq"'::regclass);


--
-- Name: Teacher id; Type: DEFAULT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."Teacher" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."Teacher_id_seq"'::regclass);


--
-- Data for Name: event_invocation_logs; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.event_invocation_logs VALUES ('c39c9f71-112e-4626-8c71-cb68fa9504f4', 'add_keycloak_instructor_role', '90c1bc94-7be4-4731-b6a9-ba1eadf28dc5', 500, '{"headers":[{"name":"Content-Type","value":"application/json"},{"name":"User-Agent","value":"hasura-graphql-engine/v2.13.2"},{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"role","value":"instructor"}],"payload":{"created_at":"2022-12-17T22:05:57.650776Z","delivery_info":{"current_retry":0,"max_retries":0},"event":{"data":{"new":{"created_at":"2022-12-17T22:05:57.650776+00:00","description":null,"id":1,"updated_at":"2022-12-17T22:05:57.650776+00:00","userId":"43bc2dc5-7171-422d-a99f-914650f41cb5"},"old":null},"op":"INSERT","session_variables":{"x-hasura-role":"admin"},"trace_context":{"span_id":"1680a7c7ede5f24d","trace_id":"3ff57a05fb420a9666280537397928eb"}},"id":"90c1bc94-7be4-4731-b6a9-ba1eadf28dc5","table":{"name":"Expert","schema":"public"},"trigger":{"name":"add_keycloak_instructor_role"}},"version":"2"}', '{"data":{"message":"Cannot read properties of undefined (reading ''id'')"},"type":"client_error","version":"2"}', '2022-12-17 22:05:59.238038');
INSERT INTO hdb_catalog.event_invocation_logs VALUES ('22d8fe93-27fe-45ae-93cc-54637a4ace23', 'send_mail', 'd3f0c60c-5b4f-410f-ac43-de00b5977528', 500, '{"headers":[{"name":"Content-Type","value":"application/json"},{"name":"User-Agent","value":"hasura-graphql-engine/v2.13.2"},{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"}],"payload":{"created_at":"2022-12-19T13:50:11.140409Z","delivery_info":{"current_retry":0,"max_retries":0},"event":{"data":{"new":{"bcc":null,"cc":null,"content":"Hallo Colin Clausen, du bist eingeladen, bitte melde dich zurück bis zum 26.12.2022","created_at":"2022-12-19T13:50:11.140409+00:00","from":"steffen@opencampus.sh","id":1,"status":"READY_TO_SEND","subject":"Kurseinladung Course 1 für Colin","templateId":null,"to":"c.clausen@pct-digital.de","updated_at":"2022-12-19T13:50:11.140409+00:00"},"old":null},"op":"INSERT","session_variables":{"x-hasura-role":"admin","x-hasura-user-id":"43bc2dc5-7171-422d-a99f-914650f41cb5"},"trace_context":{"span_id":"6f1b15bfcc7e0298","trace_id":"da92acc476061f87887aeedc183bd6ae"}},"id":"d3f0c60c-5b4f-410f-ac43-de00b5977528","table":{"name":"MailLog","schema":"public"},"trigger":{"name":"send_mail"}},"version":"2"}', '{"data":{"message":"html is not defined"},"type":"client_error","version":"2"}', '2022-12-19 13:50:11.637733');


--
-- Data for Name: event_log; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.event_log VALUES ('90c1bc94-7be4-4731-b6a9-ba1eadf28dc5', 'public', 'Expert', 'add_keycloak_instructor_role', '{"op": "INSERT", "data": {"new": {"id": 1, "userId": "43bc2dc5-7171-422d-a99f-914650f41cb5", "created_at": "2022-12-17T22:05:57.650776+00:00", "updated_at": "2022-12-17T22:05:57.650776+00:00", "description": null}, "old": null}, "trace_context": {"span_id": "1680a7c7ede5f24d", "trace_id": "3ff57a05fb420a9666280537397928eb"}, "session_variables": {"x-hasura-role": "admin"}}', false, true, 1, '2022-12-17 22:05:57.650776', NULL, NULL, false);
INSERT INTO hdb_catalog.event_log VALUES ('d3f0c60c-5b4f-410f-ac43-de00b5977528', 'public', 'MailLog', 'send_mail', '{"op": "INSERT", "data": {"new": {"cc": null, "id": 1, "to": "c.clausen@pct-digital.de", "bcc": null, "from": "steffen@opencampus.sh", "status": "READY_TO_SEND", "content": "Hallo Colin Clausen, du bist eingeladen, bitte melde dich zurück bis zum 26.12.2022", "subject": "Kurseinladung Course 1 für Colin", "created_at": "2022-12-19T13:50:11.140409+00:00", "templateId": null, "updated_at": "2022-12-19T13:50:11.140409+00:00"}, "old": null}, "trace_context": {"span_id": "6f1b15bfcc7e0298", "trace_id": "da92acc476061f87887aeedc183bd6ae"}, "session_variables": {"x-hasura-role": "admin", "x-hasura-user-id": "43bc2dc5-7171-422d-a99f-914650f41cb5"}}', false, true, 1, '2022-12-19 13:50:11.140409', NULL, NULL, false);


--
-- Data for Name: hdb_action_log; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_cron_event_invocation_logs; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_cron_events; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_event_log_cleanups; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_metadata; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.hdb_metadata VALUES (1, '{"actions":[{"definition":{"arguments":[{"name":"path","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_CERTIFICATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"output_type":"loadFileOutput","type":"query"},"name":"loadAchievementCertificate","permissions":[{"role":"user_access"}]},{"definition":{"arguments":[{"name":"path","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_CERTIFICATE_TEMPLATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"output_type":"loadFileOutput","type":"query"},"name":"loadAchievementCertificateTemplate"},{"definition":{"arguments":[{"name":"path","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"output_type":"loadFileOutput","type":"query"},"name":"loadAchievementOptionDocumentationTemplate"},{"definition":{"arguments":[{"name":"path","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":" HASURA_BUCKET"}],"output_type":"loadFileOutput","type":"query"},"name":"loadAchievementOptionEvaluationScript"},{"definition":{"arguments":[{"name":"path","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_RECORD_DOCUMENTATION}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"output_type":"loadFileOutput","type":"query"},"name":"loadAchievementRecordDocumentation"},{"definition":{"arguments":[{"name":"path","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_LOAD_PARTICIPATION_CERTIFICATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"output_type":"loadFileOutput","type":"query"},"name":"loadParticipationCertificate","permissions":[{"role":"user_access"}]},{"definition":{"arguments":[{"name":"path","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_LOAD_PARTICIPATION_CERTIFICATE_TEMPLATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"output_type":"loadFileOutput","type":"query"},"name":"loadparticipationCertificateTemplate"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"courseid","type":"Int!"},{"name":"userid","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_CERTIFICATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveAchievementCertificate"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"filename","type":"String!"},{"name":"programid","type":"Int!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveAchievementCertificateTemplate"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"courseid","type":"Int!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE}}","headers":[{"name":"secert","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveAchievementOptionDocumentationTemplate"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"courseid","type":"Int!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"hasura","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveAchievementOptionEvaluationScript"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"filename","type":"String!"},{"name":"achievementRecordId","type":"Int!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveAchievementRecordCoverImage","permissions":[{"role":"user_access"}]},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"filename","type":"String!"},{"name":"achievementRecordId","type":"Int!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveAchievementRecordDocumentation"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"filename","type":"String!"},{"name":"courseid","type":"Int!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_COURSE_IMAGE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveCourseImage","permissions":[{"role":"instructor_access"}]},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"courseid","type":"Int!"},{"name":"userid","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_PARTICIPATION_CERTIFICATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveParticipationCertificate"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"filename","type":"String!"},{"name":"programid","type":"Int!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_PARTICIPATION_CERTIFICATE_TEMPLATE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveParticipationCertificateTemplate"},{"definition":{"arguments":[{"name":"base64file","type":"String!"},{"name":"filename","type":"String!"},{"name":"userid","type":"String!"}],"handler":"{{CLOUD_FUNCTION_LINK_SAVE_USER_PROFILE_IMAGE}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"bucket","value_from_env":"HASURA_BUCKET"}],"kind":"synchronous","output_type":"loadFileOutput","type":"mutation"},"name":"saveUserProfileImage","permissions":[{"role":"instructor_access"},{"role":"user_access"}]},{"definition":{"arguments":[{"name":"userid","type":"ID!"}],"forward_client_headers":true,"handler":"{{CLOUD_FUNCTION_LINK_UPDATE_FROM_KEYCLOAK}}","headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"}],"kind":"synchronous","output_type":"result","type":"mutation"},"name":"updateFromKeycloak","permissions":[{"role":"instructor_access"},{"role":"user_access"},{"role":"anonymous"}]}],"custom_types":{"objects":[{"fields":[{"name":"link","type":"String!"}],"name":"loadFileOutput"},{"fields":[{"name":"result","type":"String!"}],"name":"result"}]},"inherited_roles":[{"role_name":"instructor","role_set":["user_access","instructor_access","anonymous"]},{"role_name":"user","role_set":["user_access","anonymous"]}],"sources":[{"configuration":{"connection_info":{"database_url":{"from_env":"HASURA_GRAPHQL_DATABASE_URL"},"isolation_level":"read-committed","pool_settings":{"connection_lifetime":600,"idle_timeout":180,"max_connections":50,"retries":1},"use_prepared_statements":true}},"kind":"postgres","name":"default","tables":[{"array_relationships":[{"name":"AchievementOptionCourses","using":{"foreign_key_constraint_on":{"column":"achievementOptionId","table":{"name":"AchievementOptionCourse","schema":"public"}}}},{"name":"AchievementOptionMentors","using":{"foreign_key_constraint_on":{"column":"achievementOptionId","table":{"name":"AchievementOptionMentor","schema":"public"}}}},{"name":"AchievementRecords","using":{"foreign_key_constraint_on":{"column":"achievementOptionId","table":{"name":"AchievementRecord","schema":"public"}}}}],"delete_permissions":[{"permission":{"backend_only":false,"filter":{"_or":[{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},{"AchievementOptionMentors":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}]}},"role":"instructor_access"}],"insert_permissions":[{"permission":{"check":{"_or":[{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},{"AchievementOptionMentors":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}]},"columns":["id","description","documentationTemplateUrl","evaluationScriptUrl","title","recordType","created_at","updated_at"]},"role":"instructor_access"}],"object_relationships":[{"name":"AchievementRecordType","using":{"foreign_key_constraint_on":"recordType"}}],"select_permissions":[{"permission":{"columns":["id","description","documentationTemplateUrl","evaluationScriptUrl","title","recordType","created_at","updated_at"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["id","title","description","recordType","documentationTemplateUrl","evaluationScriptUrl","created_at","updated_at"],"filter":{}},"role":"user_access"}],"table":{"name":"AchievementOption","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["id","description","documentationTemplateUrl","evaluationScriptUrl","title","recordType","created_at","updated_at"],"filter":{"_or":[{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},{"AchievementOptionMentors":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}]}},"role":"instructor_access"}]},{"delete_permissions":[{"permission":{"backend_only":false,"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"}],"insert_permissions":[{"permission":{"check":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"columns":["achievementOptionId","courseId","created_at","id","updated_at"]},"role":"instructor_access"}],"object_relationships":[{"name":"AchievementOption","using":{"foreign_key_constraint_on":"achievementOptionId"}},{"name":"Course","using":{"foreign_key_constraint_on":"courseId"}}],"select_permissions":[{"permission":{"columns":["achievementOptionId","courseId","id","created_at","updated_at"],"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"},{"permission":{"columns":["achievementOptionId","courseId","created_at","id","updated_at"],"filter":{"Course":{"CourseEnrollments":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"role":"user_access"}],"table":{"name":"AchievementOptionCourse","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["achievementOptionId","courseId","created_at","id","updated_at"],"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"}]},{"delete_permissions":[{"permission":{"backend_only":false,"filter":{"AchievementOption":{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}}},"role":"instructor_access"}],"insert_permissions":[{"permission":{"check":{"AchievementOption":{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},"columns":["achievementOptionId","id","created_at","updated_at"]},"role":"instructor_access"}],"object_relationships":[{"name":"AchievementOption","using":{"foreign_key_constraint_on":"achievementOptionId"}},{"name":"User","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"permission":{"columns":["achievementOptionId","userId","id","created_at","updated_at"],"filter":{}},"role":"anonymous"}],"table":{"name":"AchievementOptionMentor","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":[],"filter":{"AchievementOption":{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}}},"role":"instructor_access"}]},{"array_relationships":[{"name":"AchievementRecordAuthors","using":{"foreign_key_constraint_on":{"column":"achievementRecordId","table":{"name":"AchievementRecordAuthor","schema":"public"}}}}],"insert_permissions":[{"permission":{"check":{},"columns":["coverImageUrl","csvResults","description","documentationUrl","id","uploadUserId"]},"role":"user_access"}],"object_relationships":[{"name":"AchievementOption","using":{"foreign_key_constraint_on":"achievementOptionId"}},{"name":"AchievementRecordRating","using":{"foreign_key_constraint_on":"rating"}}],"select_permissions":[{"permission":{"columns":["achievementOptionId","coverImageUrl","description","documentationUrl","id","score"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["achievementOptionId","coverImageUrl","csvResults","description","documentationUrl","id","rating","score","uploadUserId"],"filter":{"_or":[{"AchievementOption":{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},{"AchievementOption":{"AchievementOptionMentors":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}]}},"role":"instructor_access"},{"permission":{"columns":["achievementOptionId","coverImageUrl","csvResults","description","documentationUrl","id","rating","score","uploadUserId"],"filter":{"AchievementRecordAuthors":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}},"role":"user_access"}],"table":{"name":"AchievementRecord","schema":"public"},"update_permissions":[{"permission":{"check":{},"columns":["rating"],"filter":{"_or":[{"AchievementOption":{"AchievementOptionCourses":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},{"AchievementOption":{"AchievementOptionMentors":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}]}},"role":"instructor_access"}]},{"insert_permissions":[{"permission":{"check":{},"columns":["achievementRecordId","created_at","id","updated_at","userId"]},"role":"user_access"}],"object_relationships":[{"name":"AchievementRecord","using":{"foreign_key_constraint_on":"achievementRecordId"}},{"name":"User","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"permission":{"columns":["achievementRecordId","id","created_at","updated_at","userId"],"filter":{}},"role":"anonymous"}],"table":{"name":"AchievementRecordAuthor","schema":"public"}},{"array_relationships":[{"name":"AchievementRecords","using":{"foreign_key_constraint_on":{"column":"rating","table":{"name":"AchievementRecord","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["value","comment"],"filter":{}},"role":"anonymous"}],"table":{"name":"AchievementRecordRating","schema":"public"}},{"array_relationships":[{"name":"AchievementOptions","using":{"foreign_key_constraint_on":{"column":"recordType","table":{"name":"AchievementOption","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["comment","value"],"filter":{}},"role":"anonymous"}],"table":{"name":"AchievementRecordType","schema":"public"}},{"event_triggers":[{"cleanup_config":{"batch_size":10000,"clean_invocation_logs":false,"clear_older_than":168,"paused":true,"schedule":"0 0 * * *","timeout":60},"definition":{"enable_manual":false,"insert":{"columns":"*"}},"headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"role","value":"admin"}],"name":"add_keycloak_admin_role","retry_conf":{"interval_sec":10,"num_retries":0,"timeout_sec":60},"webhook_from_env":"CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE"}],"object_relationships":[{"name":"User","using":{"foreign_key_constraint_on":"userId"}}],"table":{"name":"Admin","schema":"public"}},{"object_relationships":[{"name":"AttendanceSource","using":{"manual_configuration":{"column_mapping":{"source":"value"},"insertion_order":null,"remote_table":{"name":"AttendanceSource","schema":"public"}}}},{"name":"AttendanceStatus","using":{"foreign_key_constraint_on":"status"}},{"name":"Session","using":{"foreign_key_constraint_on":"sessionId"}},{"name":"User","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"permission":{"columns":["id","created_at","updated_at","totalAttendanceTime","status","interruptionCount","endDateTime","startDateTime","sessionId","userId","recordedName","source"],"filter":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},"role":"instructor_access"},{"permission":{"columns":["id","created_at","updated_at","totalAttendanceTime","status","interruptionCount","endDateTime","startDateTime","sessionId","userId","recordedName","source"],"filter":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}},"role":"user_access"}],"table":{"name":"Attendance","schema":"public"},"update_permissions":[{"permission":{"check":{},"columns":["endDateTime","interruptionCount","recordedName","source","startDateTime","status","totalAttendanceTime"],"filter":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},"role":"instructor_access"}]},{"array_relationships":[{"name":"Attendances","using":{"manual_configuration":{"column_mapping":{"value":"source"},"insertion_order":null,"remote_table":{"name":"Attendance","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["comment","value"],"filter":{}},"role":"anonymous"}],"table":{"name":"AttendanceSource","schema":"public"}},{"array_relationships":[{"name":"Attendances","using":{"foreign_key_constraint_on":{"column":"status","table":{"name":"Attendance","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["comment","value"],"filter":{}},"role":"anonymous"}],"table":{"name":"AttendanceStatus","schema":"public"}},{"array_relationships":[{"name":"AchievementOptionCourses","using":{"foreign_key_constraint_on":{"column":"courseId","table":{"name":"AchievementOptionCourse","schema":"public"}}}},{"name":"CourseEnrollments","using":{"foreign_key_constraint_on":{"column":"courseId","table":{"name":"CourseEnrollment","schema":"public"}}}},{"name":"CourseInstructors","using":{"foreign_key_constraint_on":{"column":"courseId","table":{"name":"CourseInstructor","schema":"public"}}}},{"name":"CourseLocations","using":{"foreign_key_constraint_on":{"column":"courseId","table":{"name":"CourseLocation","schema":"public"}}}},{"name":"Sessions","using":{"foreign_key_constraint_on":{"column":"courseId","table":{"name":"Session","schema":"public"}}}}],"object_relationships":[{"name":"CourseStatus","using":{"foreign_key_constraint_on":"status"}},{"name":"Program","using":{"foreign_key_constraint_on":"programId"}}],"select_permissions":[{"permission":{"columns":["achievementCertificatePossible","applicationEnd","attendanceCertificatePossible","contentDescriptionField1","contentDescriptionField2","cost","coverImage","ects","endTime","headingDescriptionField1","headingDescriptionField2","id","language","learningGoals","maxMissedSessions","maxParticipants","programId","startTime","tagline","title","weekDay"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["achievementCertificatePossible","applicationEnd","attendanceCertificatePossible","chatLink","contentDescriptionField1","contentDescriptionField2","cost","coverImage","ects","endTime","headingDescriptionField1","headingDescriptionField2","id","language","learningGoals","maxMissedSessions","maxParticipants","programId","startTime","status","tagline","title","visibility","weekDay"],"filter":{"CourseEnrollments":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}},"role":"user_access"}],"table":{"name":"Course","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["chatLink","contentDescriptionField1","contentDescriptionField2","coverImage","ects","endTime","headingDescriptionField1","headingDescriptionField2","language","learningGoals","maxMissedSessions","maxParticipants","startTime","status","tagline","title","weekDay"],"filter":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"role":"instructor_access"}]},{"insert_permissions":[{"permission":{"check":{},"columns":["courseId","motivationLetter","status","userId"]},"role":"user_access"}],"object_relationships":[{"name":"Course","using":{"foreign_key_constraint_on":"courseId"}},{"name":"CourseEnrollmentStatus","using":{"foreign_key_constraint_on":"status"}},{"name":"MotivationRating","using":{"foreign_key_constraint_on":"motivationRating"}},{"name":"User","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"permission":{"columns":["id","courseId","userId","status","motivationLetter","motivationRating","achievementCertificateURL","attendanceCertificateURL","created_at","updated_at","invitationExpirationDate"],"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"},{"permission":{"columns":["achievementCertificateURL","attendanceCertificateURL","courseId","id","invitationExpirationDate","motivationLetter","status","userId"],"filter":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}},"role":"user_access"}],"table":{"name":"CourseEnrollment","schema":"public"},"update_permissions":[{"permission":{"check":{},"columns":["invitationExpirationDate","motivationRating","status"],"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"}]},{"array_relationships":[{"name":"CourseEnrollments","using":{"foreign_key_constraint_on":{"column":"status","table":{"name":"CourseEnrollment","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["value","comment"],"filter":{}},"role":"anonymous"}],"table":{"name":"CourseEnrollmentStatus","schema":"public"}},{"object_relationships":[{"name":"Course","using":{"foreign_key_constraint_on":"courseId"}},{"name":"Expert","using":{"foreign_key_constraint_on":"expertId"}}],"select_permissions":[{"permission":{"columns":["id","courseId","expertId","created_at","updated_at"],"filter":{},"limit":10},"role":"anonymous"}],"table":{"name":"CourseInstructor","schema":"public"}},{"insert_permissions":[{"permission":{"check":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"columns":["courseId","id","latitude","link","locationOption","longitude"]},"role":"instructor_access"}],"object_relationships":[{"name":"Course","using":{"foreign_key_constraint_on":"courseId"}},{"name":"LocationOption","using":{"manual_configuration":{"column_mapping":{"locationOption":"value"},"insertion_order":null,"remote_table":{"name":"LocationOption","schema":"public"}}}}],"select_permissions":[{"permission":{"columns":["courseId","id","latitude","locationOption","longitude"],"filter":{},"limit":10},"role":"anonymous"},{"permission":{"columns":["courseId","created_at","id","latitude","link","locationOption","longitude","updated_at"],"filter":{},"limit":10},"role":"user_access"}],"table":{"name":"CourseLocation","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["courseId","latitude","link","locationOption","longitude"],"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"}]},{"array_relationships":[{"name":"Courses","using":{"foreign_key_constraint_on":{"column":"status","table":{"name":"Course","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["value","comment"],"filter":{}},"role":"anonymous"}],"table":{"name":"CourseStatus","schema":"public"}},{"array_relationships":[{"name":"Users","using":{"foreign_key_constraint_on":{"column":"employment","table":{"name":"User","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["value","comment"],"filter":{}},"role":"anonymous"}],"table":{"name":"Employment","schema":"public"}},{"array_relationships":[{"name":"CourseInstructors","using":{"foreign_key_constraint_on":{"column":"expertId","table":{"name":"CourseInstructor","schema":"public"}}}},{"name":"SessionSpeakers","using":{"foreign_key_constraint_on":{"column":"expertId","table":{"name":"SessionSpeaker","schema":"public"}}}}],"event_triggers":[{"cleanup_config":{"batch_size":10000,"clean_invocation_logs":false,"clear_older_than":168,"paused":true,"schedule":"0 0 * * *","timeout":60},"definition":{"enable_manual":false,"insert":{"columns":"*"}},"headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"},{"name":"role","value":"instructor"}],"name":"add_keycloak_instructor_role","retry_conf":{"interval_sec":10,"num_retries":0,"timeout_sec":60},"webhook_from_env":"CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE"}],"object_relationships":[{"name":"User","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"permission":{"columns":["id","userId","description","created_at","updated_at"],"filter":{},"limit":10},"role":"anonymous"}],"table":{"name":"Expert","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["description"],"filter":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}},"role":"user_access"}]},{"table":{"name":"Language","schema":"public"}},{"array_relationships":[{"name":"Locations","using":{"manual_configuration":{"column_mapping":{"value":"locationOption"},"insertion_order":null,"remote_table":{"name":"CourseLocation","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["value","comment"],"filter":{}},"role":"anonymous"}],"table":{"name":"LocationOption","schema":"public"}},{"event_triggers":[{"definition":{"enable_manual":true,"insert":{"columns":"*"}},"headers":[{"name":"secret","value_from_env":"HASURA_CLOUD_FUNCTION_SECRET"}],"name":"send_mail","retry_conf":{"interval_sec":10,"num_retries":0,"timeout_sec":60},"webhook_from_env":"CLOUD_FUNCTION_LINK_SEND_MAIL"}],"object_relationships":[{"name":"MailStatus","using":{"manual_configuration":{"column_mapping":{"status":"value"},"insertion_order":null,"remote_table":{"name":"MailStatus","schema":"public"}}}}],"table":{"name":"MailLog","schema":"public"}},{"array_relationships":[{"name":"MailLogs","using":{"manual_configuration":{"column_mapping":{"value":"id"},"insertion_order":null,"remote_table":{"name":"MailLog","schema":"public"}}}}],"is_enum":true,"table":{"name":"MailStatus","schema":"public"}},{"table":{"name":"MailTemplate","schema":"public"}},{"array_relationships":[{"name":"Enrollments","using":{"foreign_key_constraint_on":{"column":"motivationRating","table":{"name":"CourseEnrollment","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["value","comment"],"filter":{}},"role":"anonymous"}],"table":{"name":"MotivationRating","schema":"public"}},{"array_relationships":[{"name":"Courses","using":{"foreign_key_constraint_on":{"column":"programId","table":{"name":"Course","schema":"public"}}}},{"name":"RentAScientistConfigs","using":{"foreign_key_constraint_on":{"column":"program_id","table":{"name":"RentAScientistConfig","schema":"rentAScientist"}}}},{"name":"ScientistOffers","using":{"foreign_key_constraint_on":{"column":"programId","table":{"name":"ScientistOffer","schema":"rentAScientist"}}}}],"select_permissions":[{"permission":{"columns":["achievementRecordUploadDeadline","applicationStart","defaultApplicationEnd","id","lectureEnd","lectureStart","shortTitle","title","visibility"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["id","title","lectureStart","lectureEnd","applicationStart","defaultApplicationEnd","achievementRecordUploadDeadline","visibility","startQuestionnaire","speakerQuestionnaire","closingQuestionnaire","visibilityParticipationCertificate","visibilityAchievementCertificate","attendanceCertificateTemplateURL","participationCertificateTemplateURL","shortTitle","defaultMaxMissedSessions"],"filter":{}},"role":"instructor_access"}],"table":{"name":"Program","schema":"public"}},{"array_relationships":[{"name":"Attendances","using":{"foreign_key_constraint_on":{"column":"sessionId","table":{"name":"Attendance","schema":"public"}}}},{"name":"SessionAddresses","using":{"foreign_key_constraint_on":{"column":"sessionId","table":{"name":"SessionAddress","schema":"public"}}}},{"name":"SessionSpeakers","using":{"foreign_key_constraint_on":{"column":"sessionId","table":{"name":"SessionSpeaker","schema":"public"}}}}],"delete_permissions":[{"permission":{"backend_only":false,"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"}],"insert_permissions":[{"permission":{"check":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"columns":["courseId","description","endDateTime","id","startDateTime","title"]},"role":"instructor_access"}],"object_relationships":[{"name":"Course","using":{"foreign_key_constraint_on":"courseId"}}],"select_permissions":[{"permission":{"columns":["courseId","created_at","description","endDateTime","id","startDateTime","title","updated_at"],"filter":{}},"role":"anonymous"}],"table":{"name":"Session","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["description","endDateTime","startDateTime","title"],"filter":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"role":"instructor_access"}]},{"delete_permissions":[{"permission":{"backend_only":false,"filter":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},"role":"instructor_access"}],"insert_permissions":[{"permission":{"check":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"columns":["id","latitude","link","longitude","sessionId"]},"role":"instructor_access"}],"object_relationships":[{"name":"Session","using":{"foreign_key_constraint_on":"sessionId"}},{"name":"SessionAddressType","using":{"foreign_key_constraint_on":"type"}}],"select_permissions":[{"permission":{"columns":["id","created_at","updated_at","sessionId","latitude","link","longitude"],"filter":{}},"role":"anonymous"}],"table":{"name":"SessionAddress","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["latitude","link","longitude"],"filter":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},"role":"instructor_access"}]},{"array_relationships":[{"name":"SessionAddresses","using":{"foreign_key_constraint_on":{"column":"type","table":{"name":"SessionAddress","schema":"public"}}}}],"is_enum":true,"table":{"name":"SessionAddressType","schema":"public"}},{"delete_permissions":[{"permission":{"backend_only":false,"filter":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},"role":"instructor_access"}],"insert_permissions":[{"permission":{"check":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}},"columns":["expertId","sessionId"]},"role":"instructor_access"}],"object_relationships":[{"name":"Expert","using":{"foreign_key_constraint_on":"expertId"}},{"name":"Session","using":{"foreign_key_constraint_on":"sessionId"}}],"select_permissions":[{"permission":{"columns":["id","created_at","updated_at","expertId","sessionId"],"filter":{}},"role":"anonymous"}],"table":{"name":"SessionSpeaker","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["expertId","sessionId"],"filter":{"Session":{"Course":{"CourseInstructors":{"Expert":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}}}},"role":"instructor_access"}]},{"array_relationships":[{"name":"Users","using":{"foreign_key_constraint_on":{"column":"university","table":{"name":"User","schema":"public"}}}}],"is_enum":true,"select_permissions":[{"permission":{"columns":["value","comment"],"filter":{}},"role":"anonymous"}],"table":{"name":"University","schema":"public"}},{"array_relationships":[{"name":"AchievementOptionMentors","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"AchievementOptionMentor","schema":"public"}}}},{"name":"AchievementRecordAuthors","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"AchievementRecordAuthor","schema":"public"}}}},{"name":"Admins","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"Admin","schema":"public"}}}},{"name":"Attendances","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"Attendance","schema":"public"}}}},{"name":"CourseEnrollments","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"CourseEnrollment","schema":"public"}}}},{"name":"Experts","using":{"foreign_key_constraint_on":{"column":"userId","table":{"name":"Expert","schema":"public"}}}}],"object_relationships":[{"name":"employmentByEmployment","using":{"foreign_key_constraint_on":"employment"}},{"name":"universityByUniversity","using":{"foreign_key_constraint_on":"university"}}],"select_permissions":[{"permission":{"columns":["firstName","id","picture","lastName"],"filter":{},"limit":10},"role":"anonymous"},{"permission":{"columns":["created_at","email","employment","externalProfile","firstName","id","lastName","matriculationNumber","newsletterRegistration","otherUniversity","picture","university","updated_at"],"filter":{},"limit":100},"role":"instructor_access"},{"permission":{"columns":["email","employment","externalProfile","firstName","id","lastName","matriculationNumber","newsletterRegistration","otherUniversity","picture","university"],"filter":{"id":{"_eq":"X-Hasura-User-Id"}},"limit":10},"role":"user_access"}],"table":{"name":"User","schema":"public"},"update_permissions":[{"permission":{"check":null,"columns":["email","employment","externalProfile","firstName","lastName","matriculationNumber","newsletterRegistration","otherUniversity","picture","university"],"filter":{"id":{"_eq":"X-Hasura-User-Id"}}},"role":"user_access"}]},{"object_relationships":[{"name":"Program","using":{"foreign_key_constraint_on":"program_id"}}],"select_permissions":[{"permission":{"columns":["id","mailFrom","program_id","test_operation"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["id","mailFrom","program_id","test_operation"],"filter":{}},"role":"instructor_access"},{"permission":{"columns":["id","mailFrom","program_id","test_operation"],"filter":{}},"role":"user_access"}],"table":{"name":"RentAScientistConfig","schema":"rentAScientist"}},{"array_relationships":[{"name":"SchoolClasses","using":{"foreign_key_constraint_on":{"column":"schoolId","table":{"name":"SchoolClass","schema":"rentAScientist"}}}}],"select_permissions":[{"permission":{"columns":["city","district","dstnr","name","postalCode","schoolType","street"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["city","district","dstnr","name","postalCode","schoolType","street"],"filter":{}},"role":"instructor_access"},{"permission":{"columns":["city","district","dstnr","name","postalCode","schoolType","street"],"filter":{}},"role":"user_access"}],"table":{"name":"School","schema":"rentAScientist"}},{"array_relationships":[{"name":"SchoolClassRequests","using":{"foreign_key_constraint_on":{"column":"classId","table":{"name":"SchoolClassRequest","schema":"rentAScientist"}}}}],"delete_permissions":[{"permission":{"backend_only":false,"filter":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}},"role":"user_access"}],"insert_permissions":[{"permission":{"check":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}},"columns":["contact","grade","id","name","schoolId","studensCount","teacherId"]},"role":"user_access"}],"object_relationships":[{"name":"School","using":{"foreign_key_constraint_on":"schoolId"}},{"name":"Teacher","using":{"foreign_key_constraint_on":"teacherId"}}],"select_permissions":[{"permission":{"columns":["contact","grade","id","name","schoolId","studensCount","teacherId"],"filter":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}},"role":"user_access"}],"table":{"name":"SchoolClass","schema":"rentAScientist"},"update_permissions":[{"permission":{"check":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}},"columns":["contact","grade","name","studensCount"],"filter":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}},"role":"user_access"}]},{"delete_permissions":[{"permission":{"backend_only":false,"filter":{"SchoolClass":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"role":"user_access"}],"insert_permissions":[{"permission":{"check":{"_and":[{"SchoolClass":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}},{"ScientistOffer":{"Program":{"visibility":{"_eq":true}}}}]},"columns":["possibleDays","assigned_day","classId","id","offerId","commentGeneral","commentTime"]},"role":"user_access"}],"object_relationships":[{"name":"SchoolClass","using":{"foreign_key_constraint_on":"classId"}},{"name":"ScientistOffer","using":{"foreign_key_constraint_on":"offerId"}}],"select_permissions":[{"permission":{"allow_aggregations":true,"columns":["id","offerId"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["possibleDays","assigned_day","classId","id","offerId","commentGeneral","commentTime"],"filter":{"SchoolClass":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"role":"user_access"}],"table":{"name":"SchoolClassRequest","schema":"rentAScientist"},"update_permissions":[{"permission":{"check":{"SchoolClass":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}},"columns":["assigned_day","commentGeneral","commentTime","possibleDays"],"filter":{"SchoolClass":{"Teacher":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}}}},"role":"user_access"}]},{"array_relationships":[{"name":"ScientistOfferRelations","using":{"foreign_key_constraint_on":{"column":"scientistId","table":{"name":"ScientistOfferRelation","schema":"rentAScientist"}}}}],"select_permissions":[{"permission":{"columns":["id","forename","image","surname","title"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["id","forename","image","surname","title"],"filter":{}},"role":"instructor_access"},{"permission":{"columns":["id","forename","image","surname","title"],"filter":{}},"role":"user_access"}],"table":{"name":"Scientist","schema":"rentAScientist"}},{"array_relationships":[{"name":"SchoolClassRequests","using":{"foreign_key_constraint_on":{"column":"offerId","table":{"name":"SchoolClassRequest","schema":"rentAScientist"}}}},{"name":"ScientistOfferRelations","using":{"foreign_key_constraint_on":{"column":"offerId","table":{"name":"ScientistOfferRelation","schema":"rentAScientist"}}}}],"object_relationships":[{"name":"Program","using":{"foreign_key_constraint_on":"programId"}}],"select_permissions":[{"permission":{"allow_aggregations":true,"columns":["categories","possibleDays","possibleLocations","timeWindow","id","maxDeployments","maximumGrade","minimumGrade","programId","classPreparation","contactEmail","contactName","contactPhone","description","duration","equipmentRequired","extraComment","format","institutionLogo","institutionName","researchSubject","roomRequirements","subjectComment","title"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["id","format","minimumGrade","maximumGrade","possibleDays","timeWindow","maxDeployments","possibleLocations","equipmentRequired","roomRequirements","title","description","duration","extraComment","subjectComment","programId","classPreparation","institutionName","institutionLogo","categories","contactEmail","contactPhone","contactName","researchSubject"],"filter":{}},"role":"instructor_access"},{"permission":{"columns":["categories","possibleDays","possibleLocations","timeWindow","id","maxDeployments","maximumGrade","minimumGrade","programId","classPreparation","contactEmail","contactName","contactPhone","description","duration","equipmentRequired","extraComment","format","institutionLogo","institutionName","researchSubject","roomRequirements","subjectComment","title"],"filter":{}},"role":"user_access"}],"table":{"name":"ScientistOffer","schema":"rentAScientist"}},{"object_relationships":[{"name":"Scientist","using":{"foreign_key_constraint_on":"scientistId"}},{"name":"ScientistOffer","using":{"foreign_key_constraint_on":"offerId"}}],"select_permissions":[{"permission":{"columns":["offerId","scientistId"],"filter":{}},"role":"anonymous"},{"permission":{"columns":["offerId","scientistId"],"filter":{}},"role":"instructor_access"},{"permission":{"columns":["offerId","scientistId"],"filter":{}},"role":"user_access"}],"table":{"name":"ScientistOfferRelation","schema":"rentAScientist"}},{"array_relationships":[{"name":"SchoolClasses","using":{"foreign_key_constraint_on":{"column":"teacherId","table":{"name":"SchoolClass","schema":"rentAScientist"}}}}],"insert_permissions":[{"permission":{"check":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}},"columns":["id","userId"]},"role":"user_access"}],"object_relationships":[{"name":"User","using":{"foreign_key_constraint_on":"userId"}}],"select_permissions":[{"permission":{"columns":["id","userId"],"filter":{"User":{"id":{"_eq":"X-Hasura-User-Id"}}}},"role":"user_access"}],"table":{"name":"Teacher","schema":"rentAScientist"}}]}],"version":3}', 12);


--
-- Data for Name: hdb_scheduled_event_invocation_logs; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_scheduled_events; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--



--
-- Data for Name: hdb_schema_notifications; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.hdb_schema_notifications VALUES (1, '{"metadata":true,"remote_schemas":[],"sources":["default"],"data_connectors":[]}', 12, '0d8b16cd-2326-4c1b-a379-cc07f95526be', '2022-12-17 17:51:43.715064+00');


--
-- Data for Name: hdb_source_catalog_version; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.hdb_source_catalog_version VALUES ('3', '2022-12-17 17:51:43.59662+00');


--
-- Data for Name: hdb_version; Type: TABLE DATA; Schema: hdb_catalog; Owner: -
--

INSERT INTO hdb_catalog.hdb_version VALUES ('d9b9b557-d7df-4c25-9a8f-e106ef1c4294', '47', '2022-12-17 17:51:42.199837+00', '{"settings": {"migration_mode": "true"}, "migrations": {"default": {"1606308410426": false, "1607956138657": false, "1607958285531": false, "1607958754013": false, "1607958826649": false, "1607958926515": false, "1607959131131": false, "1607959184833": false, "1607959206220": false, "1607959319436": false, "1607959462397": false, "1607959791080": false, "1607959902209": false, "1607960397749": false, "1612867920028": false, "1612867948151": false, "1612867997711": false, "1612868015565": false, "1612868090288": false, "1612868127972": false, "1612868203671": false, "1612868247898": false, "1612868264527": false, "1612868293811": false, "1612868313745": false, "1612868605372": false, "1612868672107": false, "1612868700119": false, "1612868717112": false, "1612868737940": false, "1612868829030": false, "1612868867762": false, "1612868886118": false, "1612868938161": false, "1612868951464": false, "1612869075601": false, "1612869106946": false, "1612869132896": false, "1612869197579": false, "1612869220936": false, "1612869273737": false, "1612869286338": false, "1612869304621": false, "1612869356640": false, "1612869376311": false, "1612869391308": false, "1612869481479": false, "1612869504817": false, "1612869542488": false, "1612869573109": false, "1612869599666": false, "1612869628745": false, "1612869672764": false, "1612869690301": false, "1612869706459": false, "1612869733089": false, "1612869750641": false, "1612869819547": false, "1612869992762": false, "1618225727314": false, "1618480157450": false, "1619091533167": false, "1619597986908": false, "1619598196341": false, "1619598468004": false, "1619598527027": false, "1619598949929": false, "1621430350175": false, "1621430385118": false, "1622451821608": false, "1622451840885": false, "1623849711483": false, "1623850269104": false, "1623850352448": false, "1623850927704": false, "1623850935429": false, "1623862986591": false, "1623863486012": false, "1623863886315": false, "1623863910674": false, "1623863993223": false, "1623864021402": false, "1623864267480": false, "1623864745279": false, "1623864773752": false, "1623865932996": false, "1623912261863": false, "1623914123278": false, "1623914243271": false, "1623914276796": false, "1623914442298": false, "1623914737922": false, "1623914760684": false, "1623915146462": false, "1623915325211": false, "1623916733069": false, "1623916767311": false, "1624269307851": false, "1624269327553": false, "1624269338825": false, "1624269356438": false, "1624269411938": false, "1624269468337": false, "1624269476845": false, "1624269490725": false, "1624269497067": false, "1624269508629": false, "1624269514783": false, "1624269531331": false, "1624269536608": false, "1624269550991": false, "1624269557000": false, "1624269567164": false, "1624269571907": false, "1624269583093": false, "1624269588368": false, "1624269599856": false, "1624269604502": false, "1624269615030": false, "1624269620102": false, "1624269631258": false, "1624269638213": false, "1624269648758": false, "1624269653776": false, "1624269663235": false, "1624269668416": false, "1624269678165": false, "1624269683110": false, "1624269700520": false, "1624269705594": false, "1624269718158": false, "1624269723137": false, "1624269732833": false, "1624269737307": false, "1624269746978": false, "1624269751421": false, "1624269761161": false, "1624269766354": false, "1624283422959": false, "1624283445969": false, "1624283469212": false, "1624283480881": false, "1624283515989": false, "1624283525786": false, "1624283547691": false, "1624283562286": false, "1624283580085": false, "1624283591030": false, "1624283630022": false, "1624283635108": false, "1624283647781": false, "1624283652586": false, "1624283663102": false, "1624283667964": false, "1624283682439": false, "1624283687243": false, "1624283700476": false, "1624283706478": false, "1624283717472": false, "1624283722797": false, "1624353536016": false, "1624353657328": false, "1624353678580": false, "1624353716055": false, "1624353716056": false, "1627543288911": false, "1627543423989": false, "1627543477094": false, "1627543700200": false, "1627543925795": false, "1627543989761": false, "1627543999176": false, "1627544049215": false, "1627544110705": false, "1627544125679": false, "1627544144756": false, "1627544165905": false, "1627545605565": false, "1627545902193": false, "1627546968828": false, "1627547087406": false, "1627547113553": false, "1627551759172": false, "1627552842244": false, "1627552859029": false, "1627552990456": false, "1627553011951": false, "1627553046317": false, "1627553731167": false, "1627557101719": false, "1627557313017": false, "1627557325596": false, "1627557451297": false, "1627557465892": false, "1627557492189": false, "1627557512930": false, "1627557542779": false, "1627557826586": false, "1627557910128": false, "1627557930895": false, "1627557999436": false, "1627995348849": false, "1627995376597": false, "1629357603456": false, "1629357674198": false, "1629357707897": false, "1629358623576": false, "1629358671414": false, "1629358685514": false, "1629358768576": false, "1629358795608": false, "1629358815833": false, "1629358834115": false, "1629358852406": false, "1629358866195": false, "1629359111180": false, "1629359140191": false, "1629359383864": false, "1629359514772": false, "1629359568986": false, "1629359591506": false, "1629359611338": false, "1629359927499": false, "1629359960309": false, "1629360178802": false, "1629360324925": false, "1629360356793": false, "1629360688182": false, "1629360749374": false, "1629360916058": false, "1629361060723": false, "1629361096010": false, "1629361139934": false, "1629361199195": false, "1629361934826": false, "1629361996166": false, "1629362095462": false, "1629362271453": false, "1629362305664": false, "1629362318466": false, "1629362362030": false, "1629362413032": false, "1629362438258": false, "1629362452405": false, "1629362464383": false, "1629362533046": false, "1629362554480": false, "1629362643633": false, "1629362658981": false, "1629362723452": false, "1629362899477": false, "1629362967516": false, "1629362976319": false, "1629363056530": false, "1629363097279": false, "1629363110702": false, "1629363122360": false, "1629363193488": false, "1629363221481": false, "1629363247409": false, "1629363286398": false, "1629363296163": false, "1629793481435": false, "1629793549018": false, "1629793560163": false, "1629793570694": false, "1629793582333": false, "1629794135831": false, "1629794801643": false, "1629794811964": false, "1629794823460": false, "1629813458810": false, "1629813617767": false, "1629813763027": false, "1629813789681": false, "1629813805496": false, "1629813813876": false, "1629815207508": false, "1629815216545": false, "1629815251792": false, "1629815278515": false, "1629815421748": false, "1629815440863": false, "1629969499316": false, "1629969525716": false, "1629970027361": false, "1629971969935": false, "1629972023594": false, "1629984504808": false, "1630912533175": false, "1630912771769": false, "1630912806512": false, "1630912882175": false, "1630912962183": false, "1630913013082": false, "1630913105047": false, "1630913200513": false, "1630913228931": false, "1630913291365": false, "1630913298709": false, "1630913309187": false, "1630913314715": false, "1630913553497": false, "1630913637370": false, "1630913658492": false, "1630913806228": false, "1630913813463": false, "1630913913955": false, "1630914001354": false, "1630914063033": false, "1630914382244": false, "1630914472459": false, "1630914484776": false, "1630914492648": false, "1630914525529": false, "1630914580130": false, "1630914662471": false, "1630914703871": false, "1630914765464": false, "1630914834393": false, "1630914868507": false, "1630915181201": false, "1630915274874": false, "1630916753064": false, "1630916779744": false, "1630916834280": false, "1630917122556": false, "1630917185384": false, "1630917993231": false, "1630918045428": false, "1630918129090": false, "1630918254524": false, "1630918319744": false, "1630918340253": false, "1630918363684": false, "1630918375118": false, "1630920465066": false, "1630920482880": false, "1630920641034": false, "1630920809225": false, "1631281405537": false, "1631281452594": false, "1631281480789": false, "1631281505913": false, "1631281519189": false, "1631281559838": false, "1631281638508": false, "1631281720716": false, "1631281941869": false, "1631282131870": false, "1631282208890": false, "1631282720896": false, "1631282740216": false, "1631283417471": false, "1631283426702": false, "1631283463676": false, "1631283478193": false, "1631283489190": false, "1631283508054": false, "1631283545056": false, "1631283575931": false, "1631283846816": false, "1631284084822": false, "1631284103418": false, "1631284214239": false, "1631284227308": false, "1631284301733": false, "1631284309276": false, "1631284325816": false, "1631284333815": false, "1631284349129": false, "1631284462140": false, "1631284743987": false, "1631284795641": false, "1631284976749": false, "1631285375572": false, "1631285453168": false, "1631285599419": false, "1631285997326": false, "1631286045795": false, "1631286222131": false, "1631286298610": false, "1631286450116": false, "1631286595269": false, "1631286794682": false, "1631286833746": false, "1631286848626": false, "1631286951369": false, "1631286984301": false, "1631287061811": false, "1631287190808": false, "1631287235785": false, "1631353801513": false, "1631353942900": false, "1631353991990": false, "1631355510168": false, "1631355618013": false, "1631356163318": false, "1631356206482": false, "1631356265443": false, "1631356381448": false, "1631356728084": false, "1631356814720": false, "1631356906535": false, "1631356946825": false, "1631357823753": false, "1631357893524": false, "1631358619476": false, "1631358704064": false, "1631358806392": false, "1631358934009": false, "1631359012290": false, "1631359028158": false, "1631359039265": false, "1631359053467": false, "1631381147075": false, "1631381357118": false, "1631381414224": false, "1631381426638": false, "1631382518844": false, "1631382561071": false, "1631382631030": false, "1631382693422": false, "1631382839299": false, "1631383694171": false, "1631383836259": false, "1631384159834": false, "1631384206534": false, "1631384359147": false, "1631384372815": false, "1631384438471": false, "1631384784288": false, "1631384889826": false, "1631385147251": false, "1631385298905": false, "1631385370466": false, "1631385430891": false, "1631385481752": false, "1631385557983": false, "1631385620944": false, "1631385634517": false, "1631385641770": false, "1631385698625": false, "1631385762444": false, "1631386000764": false, "1631386019845": false, "1631386252841": false, "1631386342384": false, "1631389611347": false, "1631390450084": false, "1631390637931": false, "1631391638451": false, "1631392617271": false, "1631392650802": false, "1631392689760": false, "1631392699973": false, "1631392758879": false, "1631393426852": false, "1631393539305": false, "1631393754664": false, "1631393805956": false, "1631393916620": false, "1631394007191": false, "1631428104513": false, "1631428245575": false, "1631428347196": false, "1631428446747": false, "1631428573442": false, "1631428707733": false, "1631428740107": false, "1631428751821": false, "1631428759122": false, "1631428998606": false, "1631429044128": false, "1631429094325": false, "1631429309689": false, "1631429356597": false, "1631429396149": false, "1631429490328": false, "1631429551988": false, "1631429648145": false, "1631430361447": false, "1631430717364": false, "1631431002302": false, "1631431534534": false, "1631431680322": false, "1631431749848": false, "1631431794258": false, "1631431836418": false, "1631431844121": false, "1631431948401": false, "1631432090901": false, "1631432142583": false, "1631432188063": false, "1631432412791": false, "1631432442744": false, "1631432464029": false, "1631432497670": false, "1631432542835": false, "1631444013484": false, "1631444102226": false, "1631444152173": false, "1631444211023": false, "1631444236709": false, "1631444250131": false, "1631444375604": false, "1631445045519": false, "1631445103381": false, "1631445159357": false, "1631445627456": false, "1631445673995": false, "1631445688805": false, "1631445698173": false, "1631445914463": false, "1631445927816": false, "1631445980600": false, "1631446241030": false, "1631446422797": false, "1631446464571": false, "1631446546522": false, "1631446623304": false, "1631446636406": false, "1631446644189": false, "1631446819940": false, "1631446890306": false, "1631447206539": false, "1631447320907": false, "1631447372442": false, "1631447380060": false, "1631447402713": false, "1631447435583": false, "1631448016238": false, "1631448105230": false, "1631448144572": false, "1631448161276": false, "1631448169472": false, "1631448183439": false, "1631448252249": false, "1631448305901": false, "1631448412675": false, "1631448486130": false, "1631449173289": false, "1631468586392": false, "1631468662872": false, "1631468730035": false, "1631468739968": false, "1631468838690": false, "1631468861430": false, "1631468906818": false, "1631468944617": false, "1631468954533": false, "1631468995749": false, "1631469042054": false, "1631469053002": false, "1631469115413": false, "1631469131391": false, "1631469158489": false, "1631469171039": false, "1631469177282": false, "1631469190642": false, "1631469306004": false, "1631469324770": false, "1631469698221": false, "1631469784320": false, "1631518943335": false, "1631519145884": false, "1631519193574": false, "1631519436075": false, "1631519631998": false, "1631519671368": false, "1631519687130": false, "1631519701833": false, "1631519752710": false, "1631522255490": false, "1631522764554": false, "1631522825788": false, "1631523550808": false, "1631523657032": false, "1631523786480": false, "1631523786481": false, "1631524407621": false, "1631524443567": false, "1631524451472": false, "1631524505071": false, "1631524595419": false, "1631524637941": false, "1631524644925": false, "1631524693319": false, "1631524701921": false, "1631524723103": false, "1631524733503": false, "1631524806689": false, "1631524813097": false, "1631524827704": false, "1631524834865": false, "1631558478798": false, "1631558596907": false, "1631558891359": false, "1631558899627": false, "1631559088378": false, "1631559364057": false, "1631559485370": false, "1631559589219": false, "1631559797275": false, "1631559865981": false, "1631559948943": false, "1631560023018": false, "1631560339860": false, "1631560424777": false, "1631560446271": false, "1631560630721": false, "1631560763418": false, "1631560916139": false, "1631560952494": false, "1631561147886": false, "1631561211574": false, "1631561227297": false, "1631561301916": false, "1631561320561": false, "1631561354994": false, "1631561476905": false, "1631561532274": false, "1631561668071": false, "1631561682916": false, "1631561733191": false, "1631561780040": false, "1631561786906": false, "1631561793970": false, "1631561841740": false, "1631561944767": false, "1631562059734": false, "1631562077967": false, "1631562088785": false, "1631563449727": false, "1631563529024": false, "1631563621546": false, "1631563631913": false, "1631563728999": false, "1631563896291": false, "1631563903192": false, "1631564000811": false, "1631564333977": false, "1631564933282": false, "1631565012377": false, "1631565116241": false, "1631565307962": false, "1631565485938": false, "1631565536717": false, "1631565667254": false, "1631565849608": false, "1631566346410": false, "1631566451034": false, "1631566513922": false, "1631567480696": false, "1631567546500": false, "1631567632383": false, "1631567786865": false, "1631567840347": false, "1631567900418": false, "1631567918913": false, "1631567959379": false, "1631568283263": false, "1631568406154": false, "1631568568405": false, "1631568645794": false, "1631568717582": false, "1631569026032": false, "1631569175667": false, "1631569231175": false, "1631569261150": false, "1631569290926": false, "1631569343588": false, "1631569685790": false, "1631569703355": false, "1631569746046": false, "1631569772652": false, "1631569821518": false, "1631569893121": false, "1631569908845": false, "1631569962990": false, "1631570087664": false, "1631570185169": false, "1631570192802": false, "1631570233616": false, "1631570240674": false, "1631570614477": false, "1631570728850": false, "1631570762986": false, "1631570770548": false, "1631571000100": false, "1631571014819": false, "1631571038753": false, "1631571147843": false, "1631571200669": false, "1631571207899": false, "1631571225529": false, "1631571242904": false, "1631571270193": false, "1631571312721": false, "1631571394888": false, "1631601708902": false, "1631601876054": false, "1631601911612": false, "1631601925239": false, "1631601937032": false, "1631601957582": false, "1631601963650": false, "1631602041915": false, "1631602124362": false, "1631602176459": false, "1631602910764": false, "1631603011056": false, "1631603067999": false, "1631603074956": false, "1631603110019": false, "1631603226811": false, "1631603282049": false, "1631603285904": false, "1631603369836": false, "1631603448983": false, "1631603526425": false, "1631603629991": false, "1631603748008": false, "1631603825288": false, "1631603832074": false, "1631603945091": false, "1631604006526": false, "1631604092824": false, "1631604253553": false, "1631604291939": false, "1631604304241": false, "1631604452269": false, "1631604512734": false, "1631604559957": false, "1631604574874": false, "1631604687698": false, "1631604732513": false, "1631604805641": false, "1631627218371": false, "1631627256830": false, "1631629523329": false, "1631707478086": false, "1631707710191": false, "1631707768023": false, "1631707778597": false, "1632141011243": false, "1632141065317": false, "1632141135101": false, "1632141192918": false, "1632141294154": false, "1632141341252": false, "1632227695327": false, "1632227753681": false, "1632229725933": false, "1632229725934": false, "1632229725935": false, "1632229725936": false, "1632238212945": false, "1632238212946": false, "1632238212947": false, "1632238212948": false, "1634637888177": false, "1634637894056": false, "1635519008987": false, "1635519111126": false, "1635519913683": false, "1635519973072": false, "1635519995173": false, "1635527114114": false, "1635527179843": false, "1635527338456": false, "1635527377554": false, "1635527398540": false, "1635954428434": false, "1635955310300": false, "1635955397010": false, "1635955546954": false, "1635955583422": false, "1635955655110": false, "1636016636310": false, "1636621124738": false, "1649235015783": false, "1649235033755": false, "1649235164259": false, "1649235200867": false, "1649235209601": false, "1649235225203": false, "1649235242873": false, "1649235249710": false, "1649235370228": false, "1649235380828": false, "1649235421696": false, "1649235431405": false, "1649235463589": false, "1649235475806": false, "1649235503842": false, "1649235509945": false, "1649235523999": false, "1649235530039": false, "1649235541747": false, "1649235548329": false, "1649235557746": false, "1649235566699": false, "1649235591925": false, "1649235598944": false, "1649235607935": false, "1649235617588": false, "1649235646961": false, "1649235654245": false, "1649235671255": false, "1649235679629": false, "1649235709907": false, "1649235716421": false, "1649235728009": false, "1649235735258": false, "1649235746353": false, "1649235752869": false, "1649235763728": false, "1649235770085": false, "1649235779729": false, "1649235791405": false, "1651131494544": false, "1651131580043": false, "1651131589797": false, "1651131604330": false, "1651131628174": false, "1651131636112": false, "1651131675501": false, "1651131694130": false, "1651131705657": false, "1651131720123": false, "1651131738346": false, "1651131818336": false, "1651131825825": false, "1651132346837": false, "1651132362539": false, "1651132369440": false, "1651132374973": false, "1651132388957": false, "1651132404001": false, "1651132412774": false, "1651132431875": false, "1651132443058": false, "1651132449589": false, "1651132453639": false, "1651132461340": false, "1658156678114": false, "1658156946620": false, "1658157017466": false, "1658157191716": false, "1658157386655": false, "1658157555223": false, "1658165193427": false, "1658166425098": false, "1658166646684": false, "1658167330112": false, "1658175769428": false, "1658224240563": false, "1658225330664": false, "1658226012408": false, "1658226026901": false, "1658237078630": false, "1658237150949": false, "1658237163177": false, "1658237237452": false, "1658237494184": false, "1658238249883": false, "1658238259635": false, "1658238269691": false, "1658238279517": false, "1658238342530": false, "1658238355799": false, "1658238364104": false, "1658238376588": false, "1658239687619": false, "1658241153022": false, "1658418715208": false, "1658418723545": false, "1659021310407": false, "1659021413271": false, "1659021431375": false, "1659021451938": false, "1659021520992": false, "1659021543476": false, "1659021662463": false, "1659025409953": false, "1659033512142": false, "1659033594083": false, "1659033609211": false, "1659172704508": false, "1659198420763": false, "1659203528967": false, "1660298308255": false, "1664030666394": false, "1664031534446": false, "1664031595049": false, "1664126800968": false, "1664126849129": false, "1664126873751": false, "1664127091932": false, "1664127141925": false, "1664127400682": false, "1664127447813": false, "1664131057782": false, "1664131274076": false, "1664131635838": false, "1664133096037": false, "1664133166067": false, "1664133166068": false, "1664256510223": false, "1664256633995": false, "1664257299167": false, "1664257386317": false, "1664257489908": false, "1664257531028": false, "1664257612404": false, "1664257663570": false, "1664257731563": false, "1664257770733": false, "1664257882165": false, "1664257900410": false, "1664258034682": false, "1664258069468": false, "1664258085387": false, "1664258105138": false, "1664258477607": false, "1664258527564": false, "1664258547837": false, "1664258604408": false, "1664258624074": false, "1664258715880": false, "1664258814308": false, "1664258836581": false, "1664258889848": false, "1664258947029": false, "1664258993612": false, "1664259041701": false, "1664259078094": false, "1664259109514": false, "1664465701279": false, "1664465745185": false, "1664465983437": false, "1664466035578": false, "1664466050900": false, "1664466082209": false, "1664536405152": false, "1664536685628": false, "1664536705678": false, "1664536815143": false, "1664536867051": false, "1664542078884": false, "1664542146332": false, "1664542180518": false, "1664542193192": false, "1665565850570": false, "1665565868098": false, "1667394496473": false, "1667395085907": false, "1667395394088": false, "1667395436381": false, "1667395995791": false, "1667396496017": false, "1667396883682": false, "1667396928112": false, "1667396958856": false, "1667397227088": false, "1667397408620": false, "1667397423465": false, "1667397473962": false, "1667398349051": false, "1667398983457": false, "1667399005638": false, "1667399065047": false, "1668076404588": false, "1668077858964": false, "1668077886270": false, "1668077914489": false, "1668077938550": false, "1668078044826": false, "1668078063383": false, "1668078077798": false, "1669051332463": false, "1669051637647": false, "1669051759054": false, "1669291332967": false, "1669291570901": false, "1669291614465": false, "1669291904128": false, "1669292328152": false, "1669292395727": false, "1669292395728": false}}, "isStateCopyCompleted": true}', '{"console_notifications": {"admin": {"date": null, "read": [], "showBadge": true}}, "telemetryNotificationShown": true}');


--
-- Data for Name: AchievementOption; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AchievementOptionCourse; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AchievementOptionMentor; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AchievementRecord; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AchievementRecordAuthor; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: AchievementRecordRating; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."AchievementRecordRating" VALUES ('UNRATED', 'The project record has not been reviewed yet.');
INSERT INTO public."AchievementRecordRating" VALUES ('PASSED', 'The project record is considered as sufficient to pass.');
INSERT INTO public."AchievementRecordRating" VALUES ('FAILED', 'The project record is not considered as sufficient to pass.');


--
-- Data for Name: AchievementRecordType; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."AchievementRecordType" VALUES ('DOCUMENTATION', 'A single documentation file is uploaded for the achievement record');
INSERT INTO public."AchievementRecordType" VALUES ('DOCUMENTATION_AND_CSV', 'A documentation file and a csv data file is uploaded for the achievement record');


--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: AttendanceSource; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."AttendanceSource" VALUES ('ZOOM', NULL);
INSERT INTO public."AttendanceSource" VALUES ('INSTRUCTOR', NULL);


--
-- Data for Name: AttendanceStatus; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."AttendanceStatus" VALUES ('NO_INFO', NULL);
INSERT INTO public."AttendanceStatus" VALUES ('ATTENDED', NULL);
INSERT INTO public."AttendanceStatus" VALUES ('MISSED', NULL);


--
-- Data for Name: Course; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: CourseEnrollment; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: CourseEnrollmentStatus; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CourseEnrollmentStatus" VALUES ('APPLIED', 'The course application was received.');
INSERT INTO public."CourseEnrollmentStatus" VALUES ('REJECTED', 'The application was rejected.');
INSERT INTO public."CourseEnrollmentStatus" VALUES ('INVITED', 'Invitation was sent to Student.');
INSERT INTO public."CourseEnrollmentStatus" VALUES ('CONFIRMED', 'The course invitation was confirmed by the student.');
INSERT INTO public."CourseEnrollmentStatus" VALUES ('ABORTED', 'The course was not successfully completed.');
INSERT INTO public."CourseEnrollmentStatus" VALUES ('COMPLETED', 'The course was successfully completed by receiving at least one certificate.');


--
-- Data for Name: CourseInstructor; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: CourseLocation; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: CourseStatus; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CourseStatus" VALUES ('DRAFT', '');
INSERT INTO public."CourseStatus" VALUES ('READY_FOR_PUBLICATION', '');
INSERT INTO public."CourseStatus" VALUES ('READY_FOR_APPLICATION', '');
INSERT INTO public."CourseStatus" VALUES ('APPLICANTS_INVITED', '');
INSERT INTO public."CourseStatus" VALUES ('PARTICIPANTS_RATED', '');


--
-- Data for Name: Employment; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Employment" VALUES ('STUDENT', '');
INSERT INTO public."Employment" VALUES ('EMPLOYED', '');
INSERT INTO public."Employment" VALUES ('UNEMPLOYED', '');
INSERT INTO public."Employment" VALUES ('SELFEMPLOYED', '');
INSERT INTO public."Employment" VALUES ('OTHER', '');
INSERT INTO public."Employment" VALUES ('ACADEMIA', '');
INSERT INTO public."Employment" VALUES ('RETIREE', '');


--
-- Data for Name: Expert; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: Language; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Language" VALUES ('de', 'German');
INSERT INTO public."Language" VALUES ('en', 'English');


--
-- Data for Name: LocationOption; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."LocationOption" VALUES ('ONLINE', NULL);
INSERT INTO public."LocationOption" VALUES ('KIEL', NULL);


--
-- Data for Name: MailLog; Type: TABLE DATA; Schema: public; Owner: -
--

--
-- Data for Name: MailStatus; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."MailStatus" VALUES ('SENDING_ERROR', 'It was tried to send the mail but an error occured');
INSERT INTO public."MailStatus" VALUES ('UNSENT', 'The mail is waiting to be sent');
INSERT INTO public."MailStatus" VALUES ('SENT', 'The mail was successfully sent');


--
-- Data for Name: MailTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."MailTemplate" VALUES (1, 'Kurseinladung [Enrollment:CourseId--Course:Name] für [User:Firstname]', 'Hallo [User:Firstname] [User:LastName], du bist eingeladen, bitte melde dich zurück bis zum [Enrollment:ExpirationDate]', '2022-12-19 13:48:39.364227+00', '2022-12-19 13:49:58.269909+00', NULL, NULL, NULL, 'INVITE');


--
-- Data for Name: MotivationRating; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."MotivationRating" VALUES ('UNRATED', 'The motivation letter has not been reviewed yet.');
INSERT INTO public."MotivationRating" VALUES ('INVITE', 'The applicant shall be invited.');
INSERT INTO public."MotivationRating" VALUES ('DECLINE', 'The application shall be declined.');
INSERT INTO public."MotivationRating" VALUES ('REVIEW', 'The motivation letter shall be further reviewed.');


--
-- Data for Name: Program; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--


--
-- Data for Name: SessionAddress; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: SessionAddressType; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."SessionAddressType" VALUES ('URL', 'For online participation');
INSERT INTO public."SessionAddressType" VALUES ('FREETEXT_ADDRESS', 'Address description for an offline participation');

--
-- Data for Name: SessionSpeaker; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: University; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."University" VALUES ('CAU_KIEL', 'Christian-Albrechts-Universität zu Kiel');
INSERT INTO public."University" VALUES ('FH_KIEL', 'Fachhochschule Kiel');
INSERT INTO public."University" VALUES ('UNI_FLENSBURG', 'Europa-Universität Flensburg');
INSERT INTO public."University" VALUES ('DHSH', 'Duale Hochschule Schleswig-Holstein');
INSERT INTO public."University" VALUES ('MUTHESIUS', 'Muthesius Kunsthochschule, Kiel');
INSERT INTO public."University" VALUES ('OTHER', 'A university not listed here');
INSERT INTO public."University" VALUES ('UNI_LUEBECK', 'Universität zu Lübeck');
INSERT INTO public."University" VALUES ('TH_LUEBECK', 'Technische Hochschule Lübeck');
INSERT INTO public."University" VALUES ('FH_FLENSBURG', 'Hochschule Flensburg');
INSERT INTO public."University" VALUES ('FH_WESTKUESTE', 'Fachhochschule Westküste');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

--
-- Data for Name: RentAScientistConfig; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Data for Name: School; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Data for Name: SchoolClass; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Data for Name: SchoolClassRequest; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Data for Name: Scientist; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Data for Name: ScientistOffer; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Data for Name: ScientistOfferRelation; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: rentAScientist; Owner: -
--



--
-- Name: AchievementOptionCourse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."AchievementOptionCourse_id_seq"', 1, false);


--
-- Name: AchievementOptionMentor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."AchievementOptionMentor_id_seq"', 1, false);


--
-- Name: AchievementOption_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."AchievementOption_id_seq"', 1, false);


--
-- Name: AchievementRecordAuthor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."AchievementRecordAuthor_id_seq"', 1, false);


--
-- Name: AchievementRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."AchievementRecord_id_seq"', 1, false);


--
-- Name: Admin_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Admin_Id_seq"', 1, false);


--
-- Name: Attendence_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Attendence_Id_seq"', 3, true);


--
-- Name: CourseAddress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CourseAddress_id_seq"', 1, true);


--
-- Name: CourseInstructor_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CourseInstructor_Id_seq"', 1, true);


--
-- Name: Course_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Course_Id_seq"', 1, true);


--
-- Name: Date_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Date_Id_seq"', 3, true);


--
-- Name: Enrollment_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Enrollment_Id_seq"', 1, true);


--
-- Name: Instructor_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Instructor_Id_seq"', 1, true);


--
-- Name: MailTemplate_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MailTemplate_Id_seq"', 1, true);


--
-- Name: Mail_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Mail_Id_seq"', 1, true);


--
-- Name: Semester_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Semester_Id_seq"', 1, true);


--
-- Name: SessionAddress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."SessionAddress_id_seq"', 4, true);


--
-- Name: SessionSpeaker_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."SessionSpeaker_id_seq"', 1, true);


--
-- Name: User_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_Id_seq"', 1, false);


--
-- Name: RentAScientistConfig_id_seq; Type: SEQUENCE SET; Schema: rentAScientist; Owner: -
--

SELECT pg_catalog.setval('"rentAScientist"."RentAScientistConfig_id_seq"', 1, false);


--
-- Name: SchoolClassRequest_id_seq; Type: SEQUENCE SET; Schema: rentAScientist; Owner: -
--

SELECT pg_catalog.setval('"rentAScientist"."SchoolClassRequest_id_seq"', 1, false);


--
-- Name: SchoolClass_id_seq; Type: SEQUENCE SET; Schema: rentAScientist; Owner: -
--

SELECT pg_catalog.setval('"rentAScientist"."SchoolClass_id_seq"', 1, false);


--
-- Name: ScientistOffer_id_seq; Type: SEQUENCE SET; Schema: rentAScientist; Owner: -
--

SELECT pg_catalog.setval('"rentAScientist"."ScientistOffer_id_seq"', 1, false);


--
-- Name: Scientist_id_seq; Type: SEQUENCE SET; Schema: rentAScientist; Owner: -
--

SELECT pg_catalog.setval('"rentAScientist"."Scientist_id_seq"', 1, false);


--
-- Name: Teacher_id_seq; Type: SEQUENCE SET; Schema: rentAScientist; Owner: -
--

SELECT pg_catalog.setval('"rentAScientist"."Teacher_id_seq"', 1, false);


--
-- Name: event_invocation_logs event_invocation_logs_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.event_invocation_logs
    ADD CONSTRAINT event_invocation_logs_pkey PRIMARY KEY (id);


--
-- Name: event_log event_log_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.event_log
    ADD CONSTRAINT event_log_pkey PRIMARY KEY (id);


--
-- Name: hdb_action_log hdb_action_log_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_action_log
    ADD CONSTRAINT hdb_action_log_pkey PRIMARY KEY (id);


--
-- Name: hdb_cron_event_invocation_logs hdb_cron_event_invocation_logs_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_cron_event_invocation_logs
    ADD CONSTRAINT hdb_cron_event_invocation_logs_pkey PRIMARY KEY (id);


--
-- Name: hdb_cron_events hdb_cron_events_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_cron_events
    ADD CONSTRAINT hdb_cron_events_pkey PRIMARY KEY (id);


--
-- Name: hdb_event_log_cleanups hdb_event_log_cleanups_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_event_log_cleanups
    ADD CONSTRAINT hdb_event_log_cleanups_pkey PRIMARY KEY (id);


--
-- Name: hdb_event_log_cleanups hdb_event_log_cleanups_trigger_name_scheduled_at_key; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_event_log_cleanups
    ADD CONSTRAINT hdb_event_log_cleanups_trigger_name_scheduled_at_key UNIQUE (trigger_name, scheduled_at);


--
-- Name: hdb_metadata hdb_metadata_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_metadata
    ADD CONSTRAINT hdb_metadata_pkey PRIMARY KEY (id);


--
-- Name: hdb_metadata hdb_metadata_resource_version_key; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_metadata
    ADD CONSTRAINT hdb_metadata_resource_version_key UNIQUE (resource_version);


--
-- Name: hdb_scheduled_event_invocation_logs hdb_scheduled_event_invocation_logs_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_scheduled_event_invocation_logs
    ADD CONSTRAINT hdb_scheduled_event_invocation_logs_pkey PRIMARY KEY (id);


--
-- Name: hdb_scheduled_events hdb_scheduled_events_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_scheduled_events
    ADD CONSTRAINT hdb_scheduled_events_pkey PRIMARY KEY (id);


--
-- Name: hdb_schema_notifications hdb_schema_notifications_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_schema_notifications
    ADD CONSTRAINT hdb_schema_notifications_pkey PRIMARY KEY (id);


--
-- Name: hdb_version hdb_version_pkey; Type: CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_version
    ADD CONSTRAINT hdb_version_pkey PRIMARY KEY (hasura_uuid);


--
-- Name: AchievementOptionCourse AchievementOptionCourse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionCourse"
    ADD CONSTRAINT "AchievementOptionCourse_pkey" PRIMARY KEY (id);


--
-- Name: AchievementOptionMentor AchievementOptionMentor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionMentor"
    ADD CONSTRAINT "AchievementOptionMentor_pkey" PRIMARY KEY (id);


--
-- Name: AchievementOption AchievementOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOption"
    ADD CONSTRAINT "AchievementOption_pkey" PRIMARY KEY (id);


--
-- Name: AchievementRecordAuthor AchievementRecordAuthor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecordAuthor"
    ADD CONSTRAINT "AchievementRecordAuthor_pkey" PRIMARY KEY (id);


--
-- Name: AchievementRecordType AchievementRecordType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecordType"
    ADD CONSTRAINT "AchievementRecordType_pkey" PRIMARY KEY (value);


--
-- Name: AchievementRecord AchievementRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecord"
    ADD CONSTRAINT "AchievementRecord_pkey" PRIMARY KEY (id);


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceSource AttendanceSource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSource"
    ADD CONSTRAINT "AttendanceSource_pkey" PRIMARY KEY (value);


--
-- Name: AttendanceStatus AttendanceStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceStatus"
    ADD CONSTRAINT "AttendanceStatus_pkey" PRIMARY KEY (value);


--
-- Name: Attendance Attendence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendence_pkey" PRIMARY KEY (id);


--
-- Name: CourseLocation CourseAddress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseLocation"
    ADD CONSTRAINT "CourseAddress_pkey" PRIMARY KEY (id);


--
-- Name: CourseInstructor CourseInstructor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseInstructor"
    ADD CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY (id);


--
-- Name: CourseStatus CourseStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseStatus"
    ADD CONSTRAINT "CourseStatus_pkey" PRIMARY KEY (value);


--
-- Name: Course Course_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_pkey" PRIMARY KEY (id);


--
-- Name: Session Date_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Date_pkey" PRIMARY KEY (id);


--
-- Name: Employment Employment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employment"
    ADD CONSTRAINT "Employment_pkey" PRIMARY KEY (value);


--
-- Name: CourseEnrollmentStatus EnrollmentStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollmentStatus"
    ADD CONSTRAINT "EnrollmentStatus_pkey" PRIMARY KEY (value);


--
-- Name: CourseEnrollment Enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment"
    ADD CONSTRAINT "Enrollment_pkey" PRIMARY KEY (id);


--
-- Name: Expert Instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expert"
    ADD CONSTRAINT "Instructor_pkey" PRIMARY KEY (id);


--
-- Name: Language Languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Language"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (value);


--
-- Name: LocationOption LocationOptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LocationOption"
    ADD CONSTRAINT "LocationOptions_pkey" PRIMARY KEY (value);


--
-- Name: MailStatus MailStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MailStatus"
    ADD CONSTRAINT "MailStatus_pkey" PRIMARY KEY (value);


--
-- Name: MailTemplate MailTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MailTemplate"
    ADD CONSTRAINT "MailTemplate_pkey" PRIMARY KEY (id);


--
-- Name: MailLog Mail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MailLog"
    ADD CONSTRAINT "Mail_pkey" PRIMARY KEY (id);


--
-- Name: MotivationRating MotivationGrade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MotivationRating"
    ADD CONSTRAINT "MotivationGrade_pkey" PRIMARY KEY (value);


--
-- Name: AchievementRecordRating PerformanceRating_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecordRating"
    ADD CONSTRAINT "PerformanceRating_pkey" PRIMARY KEY (value);


--
-- Name: User Person_AnonymId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "Person_AnonymId_key" UNIQUE ("anonymousId");


--
-- Name: Program Semester_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Program"
    ADD CONSTRAINT "Semester_pkey" PRIMARY KEY (id);


--
-- Name: SessionAddressType SessionAddressType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionAddressType"
    ADD CONSTRAINT "SessionAddressType_pkey" PRIMARY KEY (value);


--
-- Name: SessionAddress SessionAddress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionAddress"
    ADD CONSTRAINT "SessionAddress_pkey" PRIMARY KEY (id);


--
-- Name: SessionSpeaker SessionSpeaker_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionSpeaker"
    ADD CONSTRAINT "SessionSpeaker_pkey" PRIMARY KEY (id);


--
-- Name: University University_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."University"
    ADD CONSTRAINT "University_pkey" PRIMARY KEY (value);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: RentAScientistConfig RentAScientistConfig_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."RentAScientistConfig"
    ADD CONSTRAINT "RentAScientistConfig_pkey" PRIMARY KEY (id);


--
-- Name: SchoolClassRequest SchoolClassRequest_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest"
    ADD CONSTRAINT "SchoolClassRequest_pkey" PRIMARY KEY (id);


--
-- Name: SchoolClass SchoolClass_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClass"
    ADD CONSTRAINT "SchoolClass_pkey" PRIMARY KEY (id);


--
-- Name: School School_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."School"
    ADD CONSTRAINT "School_pkey" PRIMARY KEY (dstnr);


--
-- Name: ScientistOfferRelation ScientistOfferRelation_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."ScientistOfferRelation"
    ADD CONSTRAINT "ScientistOfferRelation_pkey" PRIMARY KEY ("offerId", "scientistId");


--
-- Name: ScientistOffer ScientistOffer_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."ScientistOffer"
    ADD CONSTRAINT "ScientistOffer_pkey" PRIMARY KEY (id);


--
-- Name: Scientist Scientist_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."Scientist"
    ADD CONSTRAINT "Scientist_pkey" PRIMARY KEY (id);


--
-- Name: Teacher Teacher_pkey; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."Teacher"
    ADD CONSTRAINT "Teacher_pkey" PRIMARY KEY (id);


--
-- Name: Teacher Teacher_userId_key; Type: CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."Teacher"
    ADD CONSTRAINT "Teacher_userId_key" UNIQUE ("userId");


--
-- Name: event_invocation_logs_event_id_idx; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE INDEX event_invocation_logs_event_id_idx ON hdb_catalog.event_invocation_logs USING btree (event_id);


--
-- Name: event_log_fetch_events; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE INDEX event_log_fetch_events ON hdb_catalog.event_log USING btree (locked NULLS FIRST, next_retry_at NULLS FIRST, created_at) WHERE ((delivered = false) AND (error = false) AND (archived = false));


--
-- Name: event_log_trigger_name_idx; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE INDEX event_log_trigger_name_idx ON hdb_catalog.event_log USING btree (trigger_name);


--
-- Name: hdb_cron_event_invocation_event_id; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE INDEX hdb_cron_event_invocation_event_id ON hdb_catalog.hdb_cron_event_invocation_logs USING btree (event_id);


--
-- Name: hdb_cron_event_status; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE INDEX hdb_cron_event_status ON hdb_catalog.hdb_cron_events USING btree (status);


--
-- Name: hdb_cron_events_unique_scheduled; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE UNIQUE INDEX hdb_cron_events_unique_scheduled ON hdb_catalog.hdb_cron_events USING btree (trigger_name, scheduled_time) WHERE (status = 'scheduled'::text);


--
-- Name: hdb_scheduled_event_status; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE INDEX hdb_scheduled_event_status ON hdb_catalog.hdb_scheduled_events USING btree (status);


--
-- Name: hdb_source_catalog_version_one_row; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE UNIQUE INDEX hdb_source_catalog_version_one_row ON hdb_catalog.hdb_source_catalog_version USING btree (((version IS NOT NULL)));


--
-- Name: hdb_version_one_row; Type: INDEX; Schema: hdb_catalog; Owner: -
--

CREATE UNIQUE INDEX hdb_version_one_row ON hdb_catalog.hdb_version USING btree (((version IS NOT NULL)));


--
-- Name: Admin notify_hasura_add_keycloak_admin_role_INSERT; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "notify_hasura_add_keycloak_admin_role_INSERT" AFTER INSERT ON public."Admin" FOR EACH ROW EXECUTE FUNCTION hdb_catalog."notify_hasura_add_keycloak_admin_role_INSERT"();


--
-- Name: Expert notify_hasura_add_keycloak_instructor_role_INSERT; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "notify_hasura_add_keycloak_instructor_role_INSERT" AFTER INSERT ON public."Expert" FOR EACH ROW EXECUTE FUNCTION hdb_catalog."notify_hasura_add_keycloak_instructor_role_INSERT"();


--
-- Name: MailLog notify_hasura_send_mail_INSERT; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "notify_hasura_send_mail_INSERT" AFTER INSERT ON public."MailLog" FOR EACH ROW EXECUTE FUNCTION hdb_catalog."notify_hasura_send_mail_INSERT"();


--
-- Name: AchievementOptionCourse set_public_AchievementOptionCourse_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_AchievementOptionCourse_updated_at" BEFORE UPDATE ON public."AchievementOptionCourse" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_AchievementOptionCourse_updated_at" ON "AchievementOptionCourse"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_AchievementOptionCourse_updated_at" ON public."AchievementOptionCourse" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: AchievementOptionMentor set_public_AchievementOptionMentor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_AchievementOptionMentor_updated_at" BEFORE UPDATE ON public."AchievementOptionMentor" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_AchievementOptionMentor_updated_at" ON "AchievementOptionMentor"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_AchievementOptionMentor_updated_at" ON public."AchievementOptionMentor" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: AchievementRecordAuthor set_public_AchievementRecordAuthor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_AchievementRecordAuthor_updated_at" BEFORE UPDATE ON public."AchievementRecordAuthor" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_AchievementRecordAuthor_updated_at" ON "AchievementRecordAuthor"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_AchievementRecordAuthor_updated_at" ON public."AchievementRecordAuthor" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: Admin set_public_Admin_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Admin_updated_at" BEFORE UPDATE ON public."Admin" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Admin_updated_at" ON "Admin"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Admin_updated_at" ON public."Admin" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: Attendance set_public_Attendence_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Attendence_updated_at" BEFORE UPDATE ON public."Attendance" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Attendence_updated_at" ON "Attendance"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Attendence_updated_at" ON public."Attendance" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: CourseLocation set_public_CourseAddress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_CourseAddress_updated_at" BEFORE UPDATE ON public."CourseLocation" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_CourseAddress_updated_at" ON "CourseLocation"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_CourseAddress_updated_at" ON public."CourseLocation" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: CourseInstructor set_public_CourseInstructor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_CourseInstructor_updated_at" BEFORE UPDATE ON public."CourseInstructor" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_CourseInstructor_updated_at" ON "CourseInstructor"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_CourseInstructor_updated_at" ON public."CourseInstructor" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: Course set_public_Course_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Course_updated_at" BEFORE UPDATE ON public."Course" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Course_updated_at" ON "Course"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Course_updated_at" ON public."Course" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: CourseEnrollment set_public_Enrollment_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Enrollment_updated_at" BEFORE UPDATE ON public."CourseEnrollment" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Enrollment_updated_at" ON "CourseEnrollment"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Enrollment_updated_at" ON public."CourseEnrollment" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: Expert set_public_Instructor_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Instructor_updated_at" BEFORE UPDATE ON public."Expert" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Instructor_updated_at" ON "Expert"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Instructor_updated_at" ON public."Expert" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: MailTemplate set_public_MailTemplate_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_MailTemplate_updated_at" BEFORE UPDATE ON public."MailTemplate" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_MailTemplate_updated_at" ON "MailTemplate"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_MailTemplate_updated_at" ON public."MailTemplate" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: MailLog set_public_Mail_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Mail_updated_at" BEFORE UPDATE ON public."MailLog" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Mail_updated_at" ON "MailLog"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Mail_updated_at" ON public."MailLog" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: User set_public_Person_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Person_updated_at" BEFORE UPDATE ON public."User" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Person_updated_at" ON "User"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Person_updated_at" ON public."User" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: SessionAddress set_public_SessionAddress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_SessionAddress_updated_at" BEFORE UPDATE ON public."SessionAddress" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_SessionAddress_updated_at" ON "SessionAddress"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_SessionAddress_updated_at" ON public."SessionAddress" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: SessionSpeaker set_public_SessionSpeaker_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_SessionSpeaker_updated_at" BEFORE UPDATE ON public."SessionSpeaker" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_SessionSpeaker_updated_at" ON "SessionSpeaker"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_SessionSpeaker_updated_at" ON public."SessionSpeaker" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: Session set_public_Session_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "set_public_Session_updated_at" BEFORE UPDATE ON public."Session" FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();


--
-- Name: TRIGGER "set_public_Session_updated_at" ON "Session"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER "set_public_Session_updated_at" ON public."Session" IS 'trigger to set value of column "updated_at" to current timestamp on row update';


--
-- Name: hdb_cron_event_invocation_logs hdb_cron_event_invocation_logs_event_id_fkey; Type: FK CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_cron_event_invocation_logs
    ADD CONSTRAINT hdb_cron_event_invocation_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES hdb_catalog.hdb_cron_events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hdb_scheduled_event_invocation_logs hdb_scheduled_event_invocation_logs_event_id_fkey; Type: FK CONSTRAINT; Schema: hdb_catalog; Owner: -
--

ALTER TABLE ONLY hdb_catalog.hdb_scheduled_event_invocation_logs
    ADD CONSTRAINT hdb_scheduled_event_invocation_logs_event_id_fkey FOREIGN KEY (event_id) REFERENCES hdb_catalog.hdb_scheduled_events(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AchievementOptionCourse AchievementOptionCourse_achievementOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionCourse"
    ADD CONSTRAINT "AchievementOptionCourse_achievementOptionId_fkey" FOREIGN KEY ("achievementOptionId") REFERENCES public."AchievementOption"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: AchievementOptionCourse AchievementOptionCourse_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionCourse"
    ADD CONSTRAINT "AchievementOptionCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: AchievementOptionMentor AchievementOptionMentor_achievementOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionMentor"
    ADD CONSTRAINT "AchievementOptionMentor_achievementOptionId_fkey" FOREIGN KEY ("achievementOptionId") REFERENCES public."AchievementOption"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: AchievementOptionMentor AchievementOptionMentor_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOptionMentor"
    ADD CONSTRAINT "AchievementOptionMentor_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: AchievementOption AchievementOption_recordType_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementOption"
    ADD CONSTRAINT "AchievementOption_recordType_fkey" FOREIGN KEY ("recordType") REFERENCES public."AchievementRecordType"(value) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: AchievementRecordAuthor AchievementRecordAuthor_achievementRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecordAuthor"
    ADD CONSTRAINT "AchievementRecordAuthor_achievementRecordId_fkey" FOREIGN KEY ("achievementRecordId") REFERENCES public."AchievementRecord"(id) ON UPDATE RESTRICT ON DELETE CASCADE;


--
-- Name: AchievementRecordAuthor AchievementRecordAuthor_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecordAuthor"
    ADD CONSTRAINT "AchievementRecordAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: AchievementRecord AchievementRecord_AchievementOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecord"
    ADD CONSTRAINT "AchievementRecord_AchievementOptionId_fkey" FOREIGN KEY ("achievementOptionId") REFERENCES public."AchievementOption"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: AchievementRecord AchievementRecord_rating_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AchievementRecord"
    ADD CONSTRAINT "AchievementRecord_rating_fkey" FOREIGN KEY (rating) REFERENCES public."AchievementRecordRating"(value) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: Admin Admin_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_status_fkey" FOREIGN KEY (status) REFERENCES public."AttendanceStatus"(value) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Attendance Attendance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CourseEnrollment CourseEnrollment_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CourseEnrollment CourseEnrollment_motivationRating_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_motivationRating_fkey" FOREIGN KEY ("motivationRating") REFERENCES public."MotivationRating"(value) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: CourseEnrollment CourseEnrollment_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_status_fkey" FOREIGN KEY (status) REFERENCES public."CourseEnrollmentStatus"(value) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: CourseEnrollment CourseEnrollment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseEnrollment"
    ADD CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CourseInstructor CourseInstructor_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseInstructor"
    ADD CONSTRAINT "CourseInstructor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CourseInstructor CourseInstructor_expertId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseInstructor"
    ADD CONSTRAINT "CourseInstructor_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES public."Expert"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CourseLocation CourseLocation_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CourseLocation"
    ADD CONSTRAINT "CourseLocation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Course Course_programId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Course Course_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Course"
    ADD CONSTRAINT "Course_status_fkey" FOREIGN KEY (status) REFERENCES public."CourseStatus"(value) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Expert Expert_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expert"
    ADD CONSTRAINT "Expert_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SessionAddress SessionAddress_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionAddress"
    ADD CONSTRAINT "SessionAddress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SessionAddress SessionAddress_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionAddress"
    ADD CONSTRAINT "SessionAddress_type_fkey" FOREIGN KEY (type) REFERENCES public."SessionAddressType"(value) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: SessionSpeaker SessionSpeaker_expertId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionSpeaker"
    ADD CONSTRAINT "SessionSpeaker_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES public."Expert"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SessionSpeaker SessionSpeaker_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SessionSpeaker"
    ADD CONSTRAINT "SessionSpeaker_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."Session"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_courseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_employment_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_employment_fkey" FOREIGN KEY (employment) REFERENCES public."Employment"(value) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: User User_university_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_university_fkey" FOREIGN KEY (university) REFERENCES public."University"(value) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: RentAScientistConfig RentAScientistConfig_program_id_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."RentAScientistConfig"
    ADD CONSTRAINT "RentAScientistConfig_program_id_fkey" FOREIGN KEY (program_id) REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolClassRequest SchoolClassRequest_classId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest"
    ADD CONSTRAINT "SchoolClassRequest_classId_fkey" FOREIGN KEY ("classId") REFERENCES "rentAScientist"."SchoolClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolClassRequest SchoolClassRequest_offerId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest"
    ADD CONSTRAINT "SchoolClassRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "rentAScientist"."ScientistOffer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolClass SchoolClass_schoolId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClass"
    ADD CONSTRAINT "SchoolClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "rentAScientist"."School"(dstnr) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolClass SchoolClass_teacherId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."SchoolClass"
    ADD CONSTRAINT "SchoolClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "rentAScientist"."Teacher"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScientistOfferRelation ScientistOfferRelation_offerId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."ScientistOfferRelation"
    ADD CONSTRAINT "ScientistOfferRelation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "rentAScientist"."ScientistOffer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScientistOfferRelation ScientistOfferRelation_scientistId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."ScientistOfferRelation"
    ADD CONSTRAINT "ScientistOfferRelation_scientistId_fkey" FOREIGN KEY ("scientistId") REFERENCES "rentAScientist"."Scientist"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScientistOffer ScientistOffer_programId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."ScientistOffer"
    ADD CONSTRAINT "ScientistOffer_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Teacher Teacher_userId_fkey; Type: FK CONSTRAINT; Schema: rentAScientist; Owner: -
--

ALTER TABLE ONLY "rentAScientist"."Teacher"
    ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

