/**
 * @jest-environment node
 */
import fs from 'fs';
import path from 'path';

// Next.js turns every file under pages/ into a route and loads all of them when
// the production server starts. A test file there therefore runs in production:
// its top-level `process.env.X = ...` overwrites the server's real config. That
// is how v2.29.0 pointed GRAPHQL_URI at http://hasura.test and silently stopped
// new users from being created in Hasura. Tests for pages live in this folder.
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;

const collect = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [full] : collect(full);
    return TEST_FILE.test(entry.name) ? [full] : [];
  });

describe('pages/', () => {
  it('contains no test files or __tests__ folders', () => {
    const pagesDir = path.join(__dirname, '../../pages');
    const offenders = collect(pagesDir).map((file) => path.relative(pagesDir, file));
    expect(offenders).toEqual([]);
  });
});
