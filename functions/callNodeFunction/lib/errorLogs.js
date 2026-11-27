import { env } from "./config.js";
import { accessToken } from "./expertEmbeddings.js";
import { redactEmails } from "./knowledge/safety.js";

/**
 * The production errors for the weekly summary (generateIssueReportSummary): read from Cloud
 * Logging with the filter of the Slack error alert (infrastructure/application/10_monitoring.tf),
 * then grouped, so the model sees "23× Hasura validation-failed: field 'x' not found" instead of 23
 * log entries.
 *
 * The groups follow the alert's categories (GraphQL request, Hasura trigger, app log, error text,
 * 5xx request, other). Within a message, ids, numbers, e-mail and IP addresses are replaced, so
 * the same error with different ids is one group and nothing that identifies a person goes to the
 * model. Nothing else of a log entry is sent: no user ids, roles, IPs or URLs.
 *
 * Off unless ERROR_LOG_PROJECT and ERROR_LOG_FILTER are set (Terraform sets both next to the
 * summary model; locally there are no Cloud Logging logs). The function's service account needs
 * roles/logging.viewer.
 */

const LOGGING_URL = "https://logging.googleapis.com/v2/entries:list";
// Only the fields the grouping reads (leaves out the request's IP, URL and user agent). A mask
// can't select inside resource.labels, which is a map, so `resource` goes whole.
const FIELDS = "entries(timestamp,resource,textPayload,jsonPayload,httpRequest(status,requestMethod)),nextPageToken";
const PAGE_SIZE = 1000;
export const MAX_ENTRIES = 10_000;
// The summary has 170 s in all, of which the model call may take 140 s.
const DEADLINE_MS = 20_000;
export const MAX_GROUPS = 60;
const MAX_MESSAGE = 200;

/** `read` looks up one setting by name (lib/config.js by default; tests pass their own). */
export const errorLogConfig = (read = env) => {
  const project = (read("ERROR_LOG_PROJECT") || "").trim();
  const filter = (read("ERROR_LOG_FILTER") || "").trim();
  return project && filter ? { project, filter } : null;
};

/** One error message with what varies per occurrence replaced, cut to a few hundred characters. */
export const normalizeMessage = (text) => {
  const clean = redactEmails(String(text ?? "").split("\n")[0])
    .replace(/^\d{4}-\d\d-\d\d[T ][\d:.,]+Z?\s+/, "") // leading timestamp (Keycloak)
    .replace(/https?:\/\/\S+/g, (url) => url.replace(/[?#].*$/, "")) // query strings hold tokens and ids
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<id>")
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, "<ip>")
    .replace(/\b(?=[0-9a-f]*\d)[0-9a-f]{12,}\b/gi, "<id>")
    // Numbers are mostly ids; HTTP status codes and error codes such as KC-SERVICES0013 say what
    // failed.
    .replace(/\d+/g, (digits, offset, whole) =>
      /(?:HTTP|status(?: code)?)\s*$|[A-Za-z]$/i.test(whole.slice(0, offset)) ? digits : "<n>"
    )
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > MAX_MESSAGE ? `${clean.slice(0, MAX_MESSAGE)}…` : clean;
};

const isObject = (value) => value !== null && typeof value === "object";

/** The group an error log entry belongs to: same categories, in the same order, as the alert. */
export const errorGroupOf = (entry) => {
  const service = entry.resource?.labels?.service_name ?? "unknown";
  const json = isObject(entry.jsonPayload) ? entry.jsonPayload : null;
  const detail = isObject(json?.detail) ? json.detail : {};
  if (json?.type === "http-log") {
    const error = isObject(detail.operation?.error) ? detail.operation.error : {};
    return {
      service,
      kind: "graphql",
      message: normalizeMessage(`Hasura ${error.code ?? "error"}: ${error.error ?? ""}`),
      operation: detail.operation?.query?.operationName ?? undefined,
    };
  }
  if (json?.type === "event-trigger" || json?.type === "scheduled-trigger") {
    const trigger = /rigger "([A-Za-z0-9_]+)"/.exec(String(detail.error ?? ""))?.[1] ?? "unknown";
    return { service, kind: "trigger", message: `Hasura ${json.type} ${trigger}: ${detail.code ?? "error"}` };
  }
  if (json && typeof json.message === "string") {
    return { service, kind: "app", message: normalizeMessage(json.message) };
  }
  if (typeof entry.textPayload === "string") {
    return { service, kind: "text", message: normalizeMessage(entry.textPayload) };
  }
  const status = Number(entry.httpRequest?.status);
  if (status >= 500) {
    return { service, kind: "request", message: `HTTP ${status} on ${entry.httpRequest.requestMethod ?? "request"}` };
  }
  return { service, kind: "other", message: json?.type ? `Hasura ${json.type}` : "error" };
};

/**
 * Groups the entries, most frequent first. Per group: how often, on how many days, and the first
 * and last time it was logged.
 */
export const groupErrors = (entries) => {
  const groups = new Map();
  for (const entry of entries) {
    const group = errorGroupOf(entry);
    const key = [group.service, group.kind, group.message, group.operation ?? ""].join("\u0000");
    const timestamp = String(entry.timestamp ?? "");
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.days.add(timestamp.slice(0, 10));
      if (timestamp < existing.firstSeen) existing.firstSeen = timestamp;
      if (timestamp > existing.lastSeen) existing.lastSeen = timestamp;
    } else {
      groups.set(key, { ...group, count: 1, days: new Set([timestamp.slice(0, 10)]), firstSeen: timestamp, lastSeen: timestamp });
    }
  }
  return [...groups.values()]
    .map(({ days, ...group }) => ({ ...group, days: days.size }))
    .sort((a, b) => b.count - a.count || a.message.localeCompare(b.message));
};

/**
 * The error log entries of [since, until), newest first, at most MAX_ENTRIES. `complete` is false
 * when there were more or the reading ran out of time; the counts are then lower bounds.
 */
export const readErrorEntries = async (config, { since, until, fetchImpl = globalThis.fetch, now = Date.now } = {}) => {
  const token = await accessToken(fetchImpl);
  const deadline = now() + DEADLINE_MS;
  const entries = [];
  let pageToken;
  do {
    const remaining = deadline - now();
    if (remaining <= 0) return { entries, complete: false };
    let body;
    try {
      body = await readPage(config, { since, until, pageToken, token, fetchImpl, timeoutMs: remaining });
    } catch (error) {
      // The budget ran out while a page was loading: keep the pages already read.
      if ((error.name === "TimeoutError" || error.name === "AbortError") && entries.length) return { entries, complete: false };
      throw error;
    }
    entries.push(...(body.entries ?? []));
    pageToken = body.nextPageToken;
    if (entries.length >= MAX_ENTRIES) {
      return { entries: entries.slice(0, MAX_ENTRIES), complete: !pageToken && entries.length === MAX_ENTRIES };
    }
  } while (pageToken);
  return { entries, complete: true };
};

/** One page of entries:list. */
const readPage = async (config, { since, until, pageToken, token, fetchImpl, timeoutMs }) => {
  const response = await fetchImpl(`${LOGGING_URL}?fields=${encodeURIComponent(FIELDS)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceNames: [`projects/${config.project}`],
      filter: `${config.filter}\nAND timestamp>="${since}" AND timestamp<"${until}"`,
      orderBy: "timestamp desc",
      pageSize: PAGE_SIZE,
      pageToken,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  // The status only: an error body can quote the filter.
  if (!response.ok) throw new Error(`Cloud Logging answered ${response.status}`);
  return response.json();
};
