import { useMutation, useQuery } from '@apollo/client';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { useCurrentUserId } from '@eduhub/hooks/authentication';

import Layout from '../../components/Layout';
import JobCard from '../../components/JobCard';
import OrganizationSwitcher from '../../components/OrganizationSwitcher';
import {
  ACTION_ROLE_CONTEXT,
  CREATE_JOB_POSTING,
  ENUM_OPTIONS,
  GET_JOB_POSTING_FOR_EDIT,
  MY_JOB_POSTINGS,
  PUBLISH_JOB_POSTING_ACTION,
  SAVE_JOB_POSTING_PDF,
  UPDATE_JOB_POSTING,
  useEmployerRoleContext,
} from '../../lib/employer';
import { useEmployerOrganization } from '../../lib/useEmployerOrganization';
import { resolvePortal, PortalBranding } from '../../lib/portal';
import { resolveStorageUrl } from '../../lib/storage';

type Props = { portal: PortalBranding };

type FormState = {
  title: string;
  type: string;
  occupation: string;
  region: string;
  location: string;
  salaryText: string;
  startText: string;
  durationText: string;
  hoursPerWeek: string;
  applicationDeadline: string;
  description: string;
  requirement: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  type: 'WORKING_STUDENT',
  occupation: 'OTHER',
  region: 'KIEL',
  location: '',
  salaryText: '',
  startText: '',
  durationText: '',
  hoursPerWeek: '',
  applicationDeadline: '',
  description: '',
  requirement: '',
};

/**
 * Two-step posting creation (form -> preview & publish), per
 * design/stujo-design.pen. Also used for editing drafts (?id=...).
 * Publishing runs through the publishJobPosting action: free/credit
 * postings go live directly, paid ones redirect to Stripe Checkout.
 */
const NeuesAngebot: FC<Props> = ({ portal }) => {
  const t = useTranslations('meinStujo');
  const tType = useTranslations('jobType');
  const tOccupation = useTranslations('jobOccupation');
  const tRegion = useTranslations('jobRegion');
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  // Contact for status mails (published/expired/payment failed) and the
  // Stripe customer — without it those flows silently do nothing.
  const currentUserId = useCurrentUserId();
  const editId = typeof router.query.id === 'string' ? Number(router.query.id) : null;

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The offer PDF is the centerpiece of a StuJo posting (embedded on the
  // detail page like in the Rails app). Uploaded after the draft exists.
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const employerRole = useEmployerRoleContext();
  const {
    organizations,
    organization: selectedOrganization,
    loading: orgsLoading,
    selectOrganization,
  } = useEmployerOrganization();

  const { data: enums } = useQuery(ENUM_OPTIONS);

  const { data: editData } = useQuery(GET_JOB_POSTING_FOR_EDIT, {
    context: employerRole,
    variables: { id: editId ?? 0 },
    skip: editId === null,
  });

  // An existing posting keeps the organization it was created for — the update
  // path never writes organizationId — so editing must show that one rather than
  // whatever the switcher last selected.
  const organization = useMemo(() => {
    const postingOrganizationId = editData?.JobPosting_by_pk?.organizationId ?? null;
    if (postingOrganizationId === null) return selectedOrganization;
    return (
      organizations.find((candidate) => candidate.id === postingOrganizationId) ??
      selectedOrganization
    );
  }, [editData, organizations, selectedOrganization]);

  const { data: priceData } = useQuery(MY_JOB_POSTINGS, {
    context: employerRole,
    variables: { organizationId: organization?.id ?? 0 },
    skip: !organization,
  });

  const [createPosting, { loading: creating }] = useMutation(CREATE_JOB_POSTING, {
    context: employerRole,
  });
  const [updatePosting, { loading: updating }] = useMutation(UPDATE_JOB_POSTING, {
    context: employerRole,
  });
  const [publishPosting, { loading: publishing }] = useMutation(PUBLISH_JOB_POSTING_ACTION, {
    context: ACTION_ROLE_CONTEXT,
  });
  const [savePdf, { loading: uploadingPdf }] = useMutation(SAVE_JOB_POSTING_PDF, {
    context: ACTION_ROLE_CONTEXT,
  });

  // Published postings can be edited, but not "published" again — the
  // action rejects them with INVALID_STATUS. Offer a plain save instead.
  const isLive = editData?.JobPosting_by_pk?.status === 'PUBLISHED';

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      signIn('keycloak', undefined, { stujo_portal: portal.appName });
    }
  }, [portal.appName, sessionStatus]);

  useEffect(() => {
    const posting = editData?.JobPosting_by_pk;
    if (posting) {
      setSavedId(posting.id);
      setForm({
        title: posting.title ?? '',
        type: posting.type ?? 'WORKING_STUDENT',
        occupation: posting.occupation ?? 'OTHER',
        region: posting.region ?? 'KIEL',
        location: posting.location ?? '',
        salaryText: posting.salaryText ?? '',
        startText: posting.startText ?? '',
        durationText: posting.durationText ?? '',
        hoursPerWeek: posting.hoursPerWeek != null ? String(posting.hoursPerWeek) : '',
        applicationDeadline: posting.applicationDeadline ?? '',
        description: posting.description ?? '',
        requirement: posting.requirement ?? '',
      });
      setPdfUrl(posting.pdfUrl ?? null);
    }
  }, [editData]);

  const setField = (key: keyof FormState) => (value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const buildInput = () => ({
    title: form.title,
    type: form.type,
    occupation: form.occupation,
    region: form.region || null,
    location: form.location || null,
    salaryText: form.salaryText || null,
    startText: form.startText || null,
    durationText: form.durationText || null,
    hoursPerWeek: form.hoursPerWeek ? Number(form.hoursPerWeek) : null,
    applicationDeadline: form.applicationDeadline || null,
    description: form.description || null,
    requirement: form.requirement || null,
  });

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const uploadPdf = async (id: number): Promise<boolean> => {
    if (!pdfFile) return true;
    const base64file = await fileToBase64(pdfFile);
    const filename = pdfFile.name.replace(/[^A-Za-z0-9._-]+/g, '_');
    const result = await savePdf({ variables: { base64file, filename, jobpostingid: id } });
    const payload = result.data?.saveJobPostingPdf;
    if (!payload?.success) {
      setErrorMessage(`PDF-Upload fehlgeschlagen: ${payload?.error ?? 'Unbekannter Fehler'}`);
      return false;
    }
    await updatePosting({ variables: { id, set: { pdfUrl: payload.accessUrl } } });
    setPdfUrl(payload.accessUrl);
    setPdfFile(null);
    return true;
  };

  const saveDraft = async (): Promise<number | null> => {
    setErrorMessage(null);
    // The form only renders once an organization is resolved, so this is
    // unreachable — it keeps the create branch below type-safe.
    if (!organization) return null;
    try {
      let id = savedId;
      if (id) {
        await updatePosting({ variables: { id, set: buildInput() } });
      } else {
        const result = await createPosting({
          variables: {
            object: {
              ...buildInput(),
              organizationId: organization.id,
              contactUserId: currentUserId,
            },
          },
        });
        id = result.data?.insert_JobPosting_one?.id ?? null;
        setSavedId(id);
      }
      if (id && !(await uploadPdf(id))) {
        return null;
      }
      return id;
    } catch (error: any) {
      setErrorMessage(error.message);
      return null;
    }
  };

  const goToPreview = async () => {
    if (!form.title.trim()) {
      setErrorMessage('Bitte gib einen Titel an.');
      return;
    }
    const id = await saveDraft();
    if (id) setStep(2);
  };

  const publish = async () => {
    setErrorMessage(null);
    const id = savedId ?? (await saveDraft());
    if (!id) return;
    const result = await publishPosting({ variables: { jobPostingId: id } });
    const payload = result.data?.publishJobPosting;
    if (payload?.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }
    if (payload?.success) {
      router.push('/mein-stujo?payment=success');
    } else {
      setErrorMessage(payload?.error ?? 'Veröffentlichen fehlgeschlagen.');
    }
  };

  const price = priceData?.JobPostingPrice?.find((row: any) => row.jobPostingType === form.type);
  const netPrice = price?.price ?? 0;
  const grossPrice = Math.round(netPrice * (1 + (Number(price?.vatRate ?? 19) || 19) / 100));
  const credits = (organization?.JobPostingCredits ?? []).reduce(
    (sum: number, credit: any) => sum + credit.remaining,
    0
  );
  const busy = creating || updating || publishing || uploadingPdf;

  const field = (
    label: string,
    key: keyof FormState,
    options?: { type?: string; placeholder?: string }
  ) => (
    <label className="stujo-field">
      <span>{label}</span>
      <input
        type={options?.type ?? 'text'}
        value={form[key]}
        placeholder={options?.placeholder}
        onChange={(event) => setField(key)(event.target.value)}
      />
    </label>
  );

  const select = (
    label: string,
    key: keyof FormState,
    values: string[],
    translate: (value: string) => string
  ) => (
    <label className="stujo-field">
      <span>{label}</span>
      <select value={form[key]} onChange={(event) => setField(key)(event.target.value)}>
        {values.map((value) => (
          <option key={value} value={value}>
            {translate(value)}
          </option>
        ))}
      </select>
    </label>
  );

  if (sessionStatus !== 'authenticated' || orgsLoading) {
    return (
      <Layout portal={portal}>
        <p className="stujo-muted">Anmeldung wird geprüft …</p>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout portal={portal}>
        <h2>Neues Stellenangebot</h2>
        <p>
          Deinem Konto ist noch kein Unternehmen mit Stellen-Verwaltung zugeordnet. Bitte wende
          Dich an {portal.contactEmail || 'das StuJo-Team'}.
        </p>
      </Layout>
    );
  }

  return (
    <Layout portal={portal}>
      <h1>{editId ? 'Angebot bearbeiten' : 'Neues Stellenangebot'}</h1>
      {organizations.length > 1 &&
        (editId === null ? (
          <OrganizationSwitcher
            organizations={organizations}
            selectedId={organization.id}
            label={t('organizationLabel')}
            onSelect={selectOrganization}
          />
        ) : (
          <p className="stujo-muted" style={{ margin: '0 0 0.75rem' }}>
            {t('organizationLabel')}: {organization.name}
          </p>
        ))}
      <div className="stujo-steps">
        <span className={step === 1 ? 'stujo-step stujo-step--active' : 'stujo-step'}>
          1 · Angebot erstellen
        </span>
        <span className={step === 2 ? 'stujo-step stujo-step--active' : 'stujo-step'}>
          2 · Vorschau & Veröffentlichen
        </span>
      </div>

      {errorMessage && <div className="stujo-notice stujo-notice--error">{errorMessage}</div>}

      {step === 1 && (
        <div className="stujo-form">
          {field('Titel des Angebots *', 'title')}
          <div className="stujo-form-row">
            {select('Kategorie *', 'type', enums?.JobPostingType?.map((e: any) => e.value) ?? [], tType)}
            {select('Berufsfeld *', 'occupation', enums?.JobOccupation?.map((e: any) => e.value) ?? [], tOccupation)}
            {select('Region', 'region', enums?.JobRegion?.map((e: any) => e.value) ?? [], tRegion)}
          </div>
          <div className="stujo-form-row">
            {field('Ort', 'location', { placeholder: 'z.B. Kiel' })}
            {field('Vergütung', 'salaryText', { placeholder: 'z.B. 15 €/Stunde' })}
            {field('Eintritt', 'startText', { placeholder: 'z.B. ab sofort' })}
            {field('Std./Woche', 'hoursPerWeek', { type: 'number' })}
          </div>
          <div className="stujo-form-row">
            {field('Dauer', 'durationText', { placeholder: 'z.B. 6 Monate' })}
            {field('Bewerbungsschluss', 'applicationDeadline', { type: 'date' })}
          </div>
          <label className="stujo-field">
            <span>Beschreibung *</span>
            <textarea
              rows={7}
              value={form.description}
              onChange={(event) => setField('description')(event.target.value)}
            />
          </label>
          <label className="stujo-field">
            <span>Anforderungen</span>
            <textarea
              rows={4}
              value={form.requirement}
              onChange={(event) => setField('requirement')(event.target.value)}
            />
          </label>
          <label className="stujo-field">
            <span>Stellenausschreibung als PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file && !/\.pdf$/i.test(file.name)) {
                  setErrorMessage('Bitte wähle eine PDF-Datei aus.');
                  return;
                }
                setErrorMessage(null);
                setPdfFile(file);
              }}
            />
            {pdfUrl && !pdfFile && (
              <span style={{ fontWeight: 400 }}>
                Aktuelle Datei:{' '}
                <a href={resolveStorageUrl(pdfUrl) ?? pdfUrl} target="_blank" rel="noreferrer">
                  {decodeURIComponent(pdfUrl.split('/').pop() ?? 'PDF ansehen')}
                </a>
              </span>
            )}
            <span className="stujo-muted" style={{ fontWeight: 400 }}>
              Das PDF wird Studierenden direkt auf der Angebotsseite angezeigt (max. 15 MB).
            </span>
          </label>
          <div className="stujo-form-actions">
            <button className="stujo-btn stujo-btn--ghost" disabled={busy} onClick={saveDraft}>
              Als Entwurf speichern
            </button>
            <button className="stujo-btn stujo-btn--primary" disabled={busy} onClick={goToPreview}>
              Weiter zur Vorschau →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="stujo-preview">
          <h2 style={{ fontSize: '1rem' }}>So sehen Studierende Dein Angebot:</h2>
          <JobCard
            job={{
              id: savedId ?? 0,
              slug: null,
              title: form.title,
              type: form.type,
              region: form.region || null,
              occupation: form.occupation,
              location: form.location || null,
              featured: false,
              publishedAt: null,
              Organization: { id: organization?.id ?? 0, name: organization?.name ?? '', logo: null },
            }}
          />
          {isLive ? (
            <div className="stujo-notice">
              Dieses Angebot ist bereits veröffentlicht – Deine Änderungen werden direkt
              übernommen.
            </div>
          ) : (
          <div className="stujo-order-box">
            <h3>Deine Bestellung</h3>
            {netPrice === 0 ? (
              <p>
                <b>Kostenlos</b> – Minijob-Angebote sind gratis und werden sofort veröffentlicht.
              </p>
            ) : credits > 0 ? (
              <p>
                Du hast <b>{credits} Gratis-Kontingent{credits > 1 ? 'e' : ''}</b> – dieses Angebot
                wird ohne Zahlung veröffentlicht.
              </p>
            ) : (
              <>
                <div className="stujo-order-row">
                  <span>
                    {tType(form.type)} · {price?.durationDays ?? 56} Tage
                  </span>
                  <span>{(netPrice / 100).toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="stujo-order-row">
                  <span>{Number(price?.vatRate ?? 19)} % MwSt.</span>
                  <span>{((grossPrice - netPrice) / 100).toFixed(2).replace('.', ',')} €</span>
                </div>
                <div className="stujo-order-row stujo-order-row--total">
                  <span>Gesamt</span>
                  <span>{(grossPrice / 100).toFixed(2).replace('.', ',')} €</span>
                </div>
                <p className="stujo-muted" style={{ fontSize: '0.8rem' }}>
                  Zahlung per Karte, SEPA-Lastschrift oder Überweisung über Stripe. Dein Angebot
                  wird direkt nach der Zahlung veröffentlicht und ist {price?.durationDays ?? 56}{' '}
                  Tage sichtbar.
                </p>
              </>
            )}
          </div>
          )}
          <div className="stujo-form-actions">
            <button className="stujo-btn stujo-btn--ghost" disabled={busy} onClick={() => setStep(1)}>
              ← Zurück
            </button>
            {isLive ? (
              <button
                className="stujo-btn stujo-btn--accent"
                disabled={busy}
                onClick={async () => {
                  const id = await saveDraft();
                  if (id) router.push('/mein-stujo');
                }}
              >
                Änderungen speichern
              </button>
            ) : (
              <button className="stujo-btn stujo-btn--accent" disabled={busy} onClick={publish}>
                {netPrice === 0 || credits > 0
                  ? 'Jetzt veröffentlichen'
                  : `Kostenpflichtig veröffentlichen · ${(grossPrice / 100).toFixed(2).replace('.', ',')} €`}
              </button>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const portal = await resolvePortal(req.headers.host);
  return { props: { portal } };
};

export default NeuesAngebot;
