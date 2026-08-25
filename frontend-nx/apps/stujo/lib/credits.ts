/**
 * Free-posting quota of an employer organization (JobPostingCredit rows).
 *
 * An admin can grant a countable number of free postings or unlimited ones
 * ("Unbegrenzt" in the job-board settings). An unlimited grant carries no
 * meaningful `remaining`, so it must not be summed into the counter.
 */

export type JobPostingCreditLike = {
  remaining?: number | null;
  unlimited?: boolean | null;
};

export type CreditSummary = {
  /** At least one unlimited grant — postings publish for free indefinitely. */
  unlimited: boolean;
  /** Countable credits left; 0 when only unlimited grants exist. */
  total: number;
  /** Whether the next posting is covered without payment. */
  hasFree: boolean;
};

export const summarizeCredits = (credits: JobPostingCreditLike[] | null | undefined): CreditSummary => {
  const rows = credits ?? [];
  const unlimited = rows.some((credit) => credit.unlimited === true);
  const total = rows
    .filter((credit) => credit.unlimited !== true)
    .reduce((sum, credit) => sum + (credit.remaining ?? 0), 0);
  return { unlimited, total, hasFree: unlimited || total > 0 };
};
