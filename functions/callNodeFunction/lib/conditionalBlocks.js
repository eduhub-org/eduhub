/**
 * Drops [#if:Flag] ... [/if:Flag] sections whose flag is falsy and unwraps the
 * rest, so one template can serve several cases (paid, free and
 * credit-funded postings; a session change with or without a new time).
 *
 * Loops because String.replace does not rescan replaced regions, and the
 * invoice block nests an inner [#if:InvoiceLink].
 *
 * With `onlyFlags`, blocks whose flag is not one of `flags`' own keys are left
 * untouched, for a caller that resolves just its own blocks and leaves the
 * rest to another step.
 */
export function applyConditionalBlocks(text, flags = {}, { onlyFlags = false } = {}) {
  const pattern = /\[#if:([A-Za-z]+)\]([\s\S]*?)\[\/if:\1\]/g;
  let result = text || '';
  for (let pass = 0; pass < 5; pass += 1) {
    const next = result.replace(pattern, (match, key, body) => {
      if (onlyFlags && !Object.prototype.hasOwnProperty.call(flags, key)) return match;
      return flags[key] ? body : '';
    });
    if (next === result) return next;
    result = next;
  }
  return result;
}
