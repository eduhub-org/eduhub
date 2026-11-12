/**
 * Drops [#if:Flag] ... [/if:Flag] sections whose flag is falsy and unwraps the
 * rest, so one template can serve several cases (paid, free and
 * credit-funded postings; a session change with or without a new time).
 *
 * Loops because String.replace does not rescan replaced regions, and the
 * invoice block nests an inner [#if:InvoiceLink].
 */
export function applyConditionalBlocks(text, flags = {}) {
  const pattern = /\[#if:([A-Za-z]+)\]([\s\S]*?)\[\/if:\1\]/g;
  let result = text || '';
  for (let pass = 0; pass < 5; pass += 1) {
    const next = result.replace(pattern, (_match, key, body) => (flags[key] ? body : ''));
    if (next === result) return next;
    result = next;
  }
  return result;
}
