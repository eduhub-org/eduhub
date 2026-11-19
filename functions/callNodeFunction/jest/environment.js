// sanitize-html is CommonJS but requires the ESM-only htmlparser2. Node 22 can
// require() ESM; Jest's module loader cannot (Jest 30 supports it only on Node
// 24.9+), and since Jest 30 createRequire and process.getBuiltinModule inside a
// test also go through that loader. The test environment itself runs outside
// the sandbox, so it loads sanitize-html with Node's own require and hands it
// to jest/sanitizeHtml.js (the moduleNameMapper target for 'sanitize-html').
import { createRequire } from 'node:module';
import { TestEnvironment } from 'jest-environment-node';

const require = createRequire(import.meta.url);

export default class SanitizeHtmlEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    Object.defineProperty(this.global, '__sanitizeHtml', {
      get: () => require('sanitize-html'),
    });
  }
}
