import { describe, expect, it } from '@jest/globals';
import { getBucket, getFunctionName } from '../requestHeaders.js';

describe('getFunctionName', () => {
  it('reads Function-Name', () => {
    expect(getFunctionName({ 'function-name': 'saveFile' })).toEqual({
      name: 'saveFile',
      header: 'function-name',
      conflict: false,
    });
  });

  it('falls back to the legacy name header', () => {
    expect(getFunctionName({ name: 'saveFile' })).toEqual({ name: 'saveFile', header: 'name', conflict: false });
  });

  it('flags two different names', () => {
    expect(getFunctionName({ name: 'saveFile', 'function-name': 'saveImage' }).conflict).toBe(true);
  });

  it('accepts two equal names', () => {
    expect(getFunctionName({ name: 'saveFile', 'function-name': 'saveFile' }).conflict).toBe(false);
  });

  it('returns no name without either header', () => {
    expect(getFunctionName({})).toEqual({ name: undefined, header: null, conflict: false });
  });
});

describe('getBucket', () => {
  // Node lowercases header names, so `Bucket` from Hasura arrives as `bucket`.
  it('reads the bucket header', () => {
    expect(getBucket({ headers: { bucket: 'eduhub-files' } })).toBe('eduhub-files');
  });

  it('is undefined without the header', () => {
    expect(getBucket({ headers: {} })).toBeUndefined();
  });
});
