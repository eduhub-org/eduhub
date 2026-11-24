export interface DiffPart {
  text: string;
  type: 'same' | 'added' | 'removed';
}

/** Above this many words on a side, skip the diff and show removed then added text. */
const MAX_WORDS = 1500;

const tokenize = (text: string): string[] => text.match(/\s+|[^\s]+/g) ?? [];

const push = (parts: DiffPart[], text: string, type: DiffPart['type']) => {
  const last = parts[parts.length - 1];
  if (last && last.type === type) last.text += text;
  else parts.push({ text, type });
};

/** A word-level diff (longest common subsequence), good enough for course texts. */
export const wordDiff = (before: string, after: string): DiffPart[] => {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length > MAX_WORDS || b.length > MAX_WORDS) {
    return [
      ...(before ? [{ text: before, type: 'removed' as const }] : []),
      ...(after ? [{ text: after, type: 'added' as const }] : []),
    ];
  }

  // lengths[i][j] = LCS length of a[i..] and b[j..]
  const lengths = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(parts, a[i], 'same');
      i++;
      j++;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      push(parts, a[i++], 'removed');
    } else {
      push(parts, b[j++], 'added');
    }
  }
  while (i < a.length) push(parts, a[i++], 'removed');
  while (j < b.length) push(parts, b[j++], 'added');
  return groupChanges(parts);
};

/**
 * Within a stretch of changes, shows everything removed before everything added.
 * Otherwise the spaces both texts share split a replaced sentence into
 * alternating old and new words.
 */
const groupChanges = (parts: DiffPart[]): DiffPart[] => {
  const grouped: DiffPart[] = [];
  let removed = '';
  let added = '';
  const flush = () => {
    if (removed) push(grouped, removed, 'removed');
    if (added) push(grouped, added, 'added');
    removed = '';
    added = '';
  };
  parts.forEach((part, index) => {
    const between =
      part.type === 'same' &&
      /^\s+$/.test(part.text) &&
      (removed || added) &&
      index + 1 < parts.length &&
      parts[index + 1].type !== 'same';
    if (part.type === 'removed' || between) removed += part.text;
    if (part.type === 'added' || between) added += part.text;
    if (part.type === 'same' && !between) {
      flush();
      push(grouped, part.text, 'same');
    }
  });
  flush();
  return grouped;
};
