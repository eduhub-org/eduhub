import { isAbsoluteHttpUrl, websiteHref, websiteLabel } from '../website';

describe('isAbsoluteHttpUrl', () => {
  it('accepts http and https URLs with a host', () => {
    expect(isAbsoluteHttpUrl('https://example.de')).toBe(true);
    expect(isAbsoluteHttpUrl('http://example.de/jobs')).toBe(true);
  });

  it('rejects a scheme without a host, other schemes and bare hostnames', () => {
    expect(isAbsoluteHttpUrl('https://')).toBe(false);
    expect(isAbsoluteHttpUrl('ftp://example.de')).toBe(false);
    expect(isAbsoluteHttpUrl('example.de')).toBe(false);
  });
});

describe('websiteHref', () => {
  it('passes an absolute URL through', () => {
    expect(websiteHref('https://example.de/jobs')).toBe('https://example.de/jobs');
  });

  // Without this a scheme-less value would resolve against /mein-stujo.
  it('assumes https for a scheme-less legacy value', () => {
    expect(websiteHref('www.example.de')).toBe('https://www.example.de');
  });

  it('has nothing to link to for empty or unusable values', () => {
    expect(websiteHref('')).toBeNull();
    expect(websiteHref('   ')).toBeNull();
    expect(websiteHref(null)).toBeNull();
    expect(websiteHref(undefined)).toBeNull();
    expect(websiteHref('https://')).toBeNull();
  });
});

describe('websiteLabel', () => {
  it('drops the scheme, the www prefix and a trailing slash', () => {
    expect(websiteLabel('https://www.example.de/')).toBe('example.de');
  });

  it('keeps a meaningful path', () => {
    expect(websiteLabel('https://example.de/jobs')).toBe('example.de/jobs');
  });

  it('is empty when there is no website', () => {
    expect(websiteLabel(null)).toBe('');
  });
});
