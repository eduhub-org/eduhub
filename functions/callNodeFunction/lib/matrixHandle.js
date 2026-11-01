import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// The implementation lives in shared_libs so updateFromKeycloak and the
// backfill script compute the exact same handle.
let computeMatrixHandle;
try {
  ({ computeMatrixHandle } = require('../shared_libs/node/matrixHandle.cjs'));
} catch {
  ({ computeMatrixHandle } = require('../../shared_libs/node/matrixHandle.cjs'));
}

export { computeMatrixHandle };
