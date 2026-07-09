-- Occupation fields (Berufsfelder), seeded from the StuJo Rails occupations
-- lookup. The comment carries the original German name; display labels
-- (de/en) live in frontend i18n.
CREATE TABLE "public"."JobOccupation" (
  "value" text PRIMARY KEY,
  "comment" text
);

COMMENT ON TABLE "public"."JobOccupation" IS 'Occupation fields (Berufsfelder) for job postings, from StuJo';

INSERT INTO "public"."JobOccupation" ("value", "comment") VALUES
  ('ADMINISTRATION', 'Administration und Sachbearbeitung'),
  ('EDUCATION_TRAINING', 'Aus- und Weiterbildung'),
  ('BANKING_INSURANCE', 'Banken, Versicherungen und Finanzdienstleistungen'),
  ('CUSTOMER_SERVICE', 'Customer Service und Kundenbetreuung'),
  ('DESIGN_ARCHITECTURE', 'Design, Gestaltung und Architektur'),
  ('PURCHASING_LOGISTICS', 'Einkauf, Transport und Logistik'),
  ('MANUFACTURING_CONSTRUCTION', 'Fertigung, Bau und Handwerk'),
  ('ACCOUNTING', 'Finanz- und Rechnungswesen'),
  ('RESEARCH_SCIENCE', 'Forschung, Entwicklung und Wissenschaft'),
  ('HEALTH_SOCIAL', 'Gesundheit, Medizin und Soziales'),
  ('HOSPITALITY', 'Hotel und Gastronomie'),
  ('ENGINEERING', 'Ingenieurwesen und technische Berufe'),
  ('MAINTENANCE', 'Instandhaltung'),
  ('IT_TELECOMMUNICATIONS', 'IT und Telekommunikation'),
  ('ARTS_CULTURE', 'Kunst und Kultur'),
  ('AGRICULTURE_ENVIRONMENT', 'Land-, Forst-, Fischwirtschaft und Umwelt'),
  ('MARKETING_ADVERTISING', 'Marketing und Werbung'),
  ('PUBLIC_SERVICE', 'Oeffentlicher Dienst und Verbaende'),
  ('HUMAN_RESOURCES', 'Personalwesen'),
  ('PRODUCTION', 'Produktion'),
  ('PROJECT_MANAGEMENT', 'Projektmanagement'),
  ('QUALITY_MANAGEMENT', 'Qualitaetswesen'),
  ('LEGAL', 'Recht'),
  ('MEDIA_EDITORIAL', 'Redaktion, Medien und Information'),
  ('SECURITY_CIVIL_PROTECTION', 'Sicherheit und Zivilschutz'),
  ('MANAGEMENT', 'Unternehmensfuehrung / Geschaeftsleitung'),
  ('SALES_RETAIL', 'Vertrieb und Handel'),
  ('OTHER', 'Sonstiges Berufsfeld');
