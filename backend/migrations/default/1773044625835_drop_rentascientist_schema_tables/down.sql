CREATE SCHEMA IF NOT EXISTS "rentAScientist";

CREATE TABLE "rentAScientist"."RentAScientistConfig" (
    id integer NOT NULL,
    program_id integer NOT NULL,
    test_operation boolean DEFAULT true NOT NULL,
    "mailFrom" text
);

COMMENT ON TABLE "rentAScientist"."RentAScientistConfig" IS 'table configures rent-a-scientist: Which program to use? Needs to be switched once a year...';

CREATE SEQUENCE "rentAScientist"."RentAScientistConfig_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "rentAScientist"."RentAScientistConfig_id_seq" OWNED BY "rentAScientist"."RentAScientistConfig".id;

CREATE TABLE "rentAScientist"."School" (
    dstnr text NOT NULL,
    name text NOT NULL,
    "schoolType" text NOT NULL,
    district text NOT NULL,
    street text NOT NULL,
    "postalCode" text NOT NULL,
    city text NOT NULL
);

COMMENT ON TABLE "rentAScientist"."School" IS 'all the schools that exist in Schleswig Holstein. dstnr is the primary key: "Dienstnummer"';

CREATE TABLE "rentAScientist"."SchoolClass" (
    name text NOT NULL,
    id integer NOT NULL,
    "schoolId" text NOT NULL,
    "teacherId" integer NOT NULL,
    grade integer NOT NULL,
    "studensCount" integer DEFAULT 0 NOT NULL,
    contact text
);

COMMENT ON TABLE "rentAScientist"."SchoolClass" IS 'A class of a school enrolled into rent-a-scientist by a teacher';

CREATE TABLE "rentAScientist"."SchoolClassRequest" (
    id integer NOT NULL,
    "classId" integer NOT NULL,
    "offerId" integer NOT NULL,
    "possibleDays" integer[] NOT NULL,
    assigned_day integer,
    "commentTime" text,
    "commentGeneral" text
);

COMMENT ON TABLE "rentAScientist"."SchoolClassRequest" IS 'A request from a school class for a specific offer from a scientist. It can be fulfilled by given an assignment.';
COMMENT ON COLUMN "rentAScientist"."SchoolClassRequest".assigned_day IS 'Needs to be one of the possibleDays values to be valid. -1 is used as value to indicate rejection.';

CREATE SEQUENCE "rentAScientist"."SchoolClassRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "rentAScientist"."SchoolClassRequest_id_seq" OWNED BY "rentAScientist"."SchoolClassRequest".id;

CREATE SEQUENCE "rentAScientist"."SchoolClass_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "rentAScientist"."SchoolClass_id_seq" OWNED BY "rentAScientist"."SchoolClass".id;

CREATE TABLE "rentAScientist"."Scientist" (
    forename text NOT NULL,
    surname text NOT NULL,
    title text NOT NULL,
    id integer NOT NULL,
    image text
);

COMMENT ON TABLE "rentAScientist"."Scientist" IS 'Rent-A-Scientist scientist offers courses';

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

COMMENT ON TABLE "rentAScientist"."ScientistOffer" IS 'An offer from a scientist for Rent-A-Scientist';

CREATE TABLE "rentAScientist"."ScientistOfferRelation" (
    "offerId" integer NOT NULL,
    "scientistId" integer NOT NULL
);

COMMENT ON TABLE "rentAScientist"."ScientistOfferRelation" IS 'relation between scientists and their offer';

CREATE SEQUENCE "rentAScientist"."ScientistOffer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "rentAScientist"."ScientistOffer_id_seq" OWNED BY "rentAScientist"."ScientistOffer".id;

CREATE SEQUENCE "rentAScientist"."Scientist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "rentAScientist"."Scientist_id_seq" OWNED BY "rentAScientist"."Scientist".id;

CREATE TABLE "rentAScientist"."Teacher" (
    id integer NOT NULL,
    "userId" uuid NOT NULL
);

COMMENT ON TABLE "rentAScientist"."Teacher" IS 'a teacher that has enrolled into rent-a-scientist';

CREATE SEQUENCE "rentAScientist"."Teacher_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "rentAScientist"."Teacher_id_seq" OWNED BY "rentAScientist"."Teacher".id;

ALTER TABLE ONLY "rentAScientist"."RentAScientistConfig" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."RentAScientistConfig_id_seq"'::regclass);
ALTER TABLE ONLY "rentAScientist"."SchoolClass" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."SchoolClass_id_seq"'::regclass);
ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."SchoolClassRequest_id_seq"'::regclass);
ALTER TABLE ONLY "rentAScientist"."Scientist" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."Scientist_id_seq"'::regclass);
ALTER TABLE ONLY "rentAScientist"."ScientistOffer" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."ScientistOffer_id_seq"'::regclass);
ALTER TABLE ONLY "rentAScientist"."Teacher" ALTER COLUMN id SET DEFAULT nextval('"rentAScientist"."Teacher_id_seq"'::regclass);

ALTER TABLE ONLY "rentAScientist"."RentAScientistConfig" ADD CONSTRAINT "RentAScientistConfig_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest" ADD CONSTRAINT "SchoolClassRequest_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "rentAScientist"."SchoolClass" ADD CONSTRAINT "SchoolClass_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "rentAScientist"."School" ADD CONSTRAINT "School_pkey" PRIMARY KEY (dstnr);
ALTER TABLE ONLY "rentAScientist"."ScientistOfferRelation" ADD CONSTRAINT "ScientistOfferRelation_pkey" PRIMARY KEY ("offerId", "scientistId");
ALTER TABLE ONLY "rentAScientist"."ScientistOffer" ADD CONSTRAINT "ScientistOffer_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "rentAScientist"."Scientist" ADD CONSTRAINT "Scientist_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "rentAScientist"."Teacher" ADD CONSTRAINT "Teacher_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY "rentAScientist"."Teacher" ADD CONSTRAINT "Teacher_userId_key" UNIQUE ("userId");

ALTER TABLE ONLY "rentAScientist"."RentAScientistConfig"
    ADD CONSTRAINT "RentAScientistConfig_program_id_fkey" FOREIGN KEY (program_id) REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest"
    ADD CONSTRAINT "SchoolClassRequest_classId_fkey" FOREIGN KEY ("classId") REFERENCES "rentAScientist"."SchoolClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."SchoolClassRequest"
    ADD CONSTRAINT "SchoolClassRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "rentAScientist"."ScientistOffer"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."SchoolClass"
    ADD CONSTRAINT "SchoolClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "rentAScientist"."School"(dstnr) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."SchoolClass"
    ADD CONSTRAINT "SchoolClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "rentAScientist"."Teacher"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."ScientistOfferRelation"
    ADD CONSTRAINT "ScientistOfferRelation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "rentAScientist"."ScientistOffer"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."ScientistOfferRelation"
    ADD CONSTRAINT "ScientistOfferRelation_scientistId_fkey" FOREIGN KEY ("scientistId") REFERENCES "rentAScientist"."Scientist"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."ScientistOffer"
    ADD CONSTRAINT "ScientistOffer_programId_fkey" FOREIGN KEY ("programId") REFERENCES public."Program"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "rentAScientist"."Teacher"
    ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
