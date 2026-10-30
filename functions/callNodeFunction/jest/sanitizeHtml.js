// sanitize-html is CommonJS but requires the ESM-only htmlparser2. Node 22 can require() ESM,
// Jest's module loader cannot (and it wraps createRequire from 'node:module'), so tests load
// sanitize-html through Node's own loader instead.
const { createRequire } = process.getBuiltinModule('node:module');

export default createRequire(import.meta.url)('sanitize-html');
