import { elementDirectMessageUrl, toMatrixUserId } from './matrix';

describe('toMatrixUserId', () => {
  it('qualifies a bare localpart with the server name', () => {
    expect(toMatrixUserId('nina.petersen.ab12cd', 'matrix.opencampus.sh')).toBe(
      '@nina.petersen.ab12cd:matrix.opencampus.sh'
    );
  });

  it('keeps a handle that is already fully qualified', () => {
    expect(toMatrixUserId('@nina:other.server', 'matrix.opencampus.sh')).toBe('@nina:other.server');
  });

  it('strips a leading sigil before qualifying', () => {
    expect(toMatrixUserId('@nina', 'matrix.opencampus.sh')).toBe('@nina:matrix.opencampus.sh');
  });

  it('returns null for a localpart with no server name, rather than "@nina:"', () => {
    expect(toMatrixUserId('nina', undefined)).toBeNull();
    expect(toMatrixUserId('nina', '   ')).toBeNull();
  });

  it('returns null for an empty or missing handle', () => {
    expect(toMatrixUserId(null, 'matrix.opencampus.sh')).toBeNull();
    expect(toMatrixUserId('   ', 'matrix.opencampus.sh')).toBeNull();
  });

  it('returns null when a qualified handle is missing either half', () => {
    expect(toMatrixUserId('@:server', 'matrix.opencampus.sh')).toBeNull();
    expect(toMatrixUserId('nina:', 'matrix.opencampus.sh')).toBeNull();
  });
});

describe('elementDirectMessageUrl', () => {
  it('builds a direct-message link', () => {
    expect(elementDirectMessageUrl('nina', 'matrix.opencampus.sh', 'https://element.example')).toBe(
      'https://element.example/#/user/@nina:matrix.opencampus.sh'
    );
  });

  it('tolerates a trailing slash on the client url', () => {
    expect(elementDirectMessageUrl('nina', 'matrix.opencampus.sh', 'https://element.example/')).toBe(
      'https://element.example/#/user/@nina:matrix.opencampus.sh'
    );
  });

  it('returns null when the element client is not configured', () => {
    expect(elementDirectMessageUrl('nina', 'matrix.opencampus.sh', undefined)).toBeNull();
  });

  it('returns null when the handle cannot be addressed', () => {
    expect(elementDirectMessageUrl(null, 'matrix.opencampus.sh', 'https://element.example')).toBeNull();
  });
});
