import fs from 'fs';
import path from 'path';
import { DocumentNode, FieldNode, Kind, SelectionSetNode, visit } from 'graphql';

/**
 * Every Course_by_pk selection must request `id`. Without it Apollo cannot
 * normalize the Course and stores it inline under Query.Course_by_pk, whose
 * merge policy (config/apollo.ts) then replaces the reference that other
 * queries of the same course wrote. On the manage page ManagedCourse and the
 * participations query evicted each other that way and refetched in a loop,
 * hundreds of requests a minute.
 */
const QUERIES_DIR = path.join(__dirname, '..');

const documentsOf = (file: string): [string, DocumentNode][] =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Object.entries(require(path.join(QUERIES_DIR, file)) as Record<string, unknown>).filter(
    (entry): entry is [string, DocumentNode] => (entry[1] as DocumentNode)?.kind === Kind.DOCUMENT
  );

const coursePkSelectionsWithoutId = (doc: DocumentNode): number => {
  const fragments = new Map<string, SelectionSetNode>();
  doc.definitions.forEach((definition) => {
    if (definition.kind === Kind.FRAGMENT_DEFINITION) fragments.set(definition.name.value, definition.selectionSet);
  });
  // Follows fragment spreads, as Apollo does when it writes the result.
  const selectsId = (selectionSet: SelectionSetNode): boolean =>
    selectionSet.selections.some((selection) => {
      if (selection.kind === Kind.FIELD) return selection.name.value === 'id';
      if (selection.kind === Kind.INLINE_FRAGMENT) return selectsId(selection.selectionSet);
      const fragment = fragments.get(selection.name.value);
      return !!fragment && selectsId(fragment);
    });

  let missing = 0;
  visit(doc, {
    Field(node: FieldNode) {
      if (node.name.value === 'Course_by_pk' && node.selectionSet && !selectsId(node.selectionSet)) missing += 1;
    },
  });
  return missing;
};

const documents = fs
  .readdirSync(QUERIES_DIR)
  .filter((file) => file.endsWith('.ts'))
  .flatMap((file) => documentsOf(file).map(([name, doc]) => [`${file} ${name}`, doc] as const));

describe('Course_by_pk selections', () => {
  it('finds the query documents', () => {
    expect(documents.length).toBeGreaterThan(50);
  });

  it.each(documents)('%s selects id on Course_by_pk', (_name, doc) => {
    expect(coursePkSelectionsWithoutId(doc)).toBe(0);
  });
});
