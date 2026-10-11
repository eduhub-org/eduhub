import { isNewlyIssued } from './index.js';

const update = (oldUrl, newUrl) => ({
  op: 'UPDATE',
  data: { old: { id: 1, certificateURL: oldUrl }, new: { id: 1, certificateURL: newUrl } },
});

describe('isNewlyIssued', () => {
  it('fires when the certificate is set for the first time', () => {
    expect(isNewlyIssued(update(null, 'u/4/instructor_certificate.pdf'))).toBe(true);
  });

  it('does not fire again when a certificate is regenerated or removed', () => {
    expect(isNewlyIssued(update('u/4/a.pdf', 'u/4/a.pdf'))).toBe(false);
    expect(isNewlyIssued(update('u/4/a.pdf', null))).toBe(false);
  });

  it('ignores other operations', () => {
    expect(isNewlyIssued({ op: 'INSERT', data: { old: null, new: { certificateURL: 'x' } } })).toBe(false);
  });
});
