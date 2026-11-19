import { DEFAULT_MATRIX_SERVER_NAME, matrixDirectMessageUrl, matrixRoomUrl, toMatrixUserId } from './matrix';

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

describe('matrixDirectMessageUrl', () => {
  it('builds a matrix.to link to the person', () => {
    expect(matrixDirectMessageUrl('nina', 'matrix.opencampus.sh')).toBe(
      'https://matrix.to/#/@nina:matrix.opencampus.sh'
    );
  });

  it('returns null when the handle cannot be addressed', () => {
    expect(matrixDirectMessageUrl(null, 'matrix.opencampus.sh')).toBeNull();
  });

  it.each([undefined, null, ''])('falls back to the default server name for %p', (serverName) => {
    expect(matrixDirectMessageUrl('nina', serverName)).toBe(`https://matrix.to/#/@nina:${DEFAULT_MATRIX_SERVER_NAME}`);
  });

  it('still prefers a handle that carries its own domain over the fallback', () => {
    expect(matrixDirectMessageUrl('@nina:matrix.org', undefined)).toBe('https://matrix.to/#/@nina:matrix.org');
  });
});

describe('matrixRoomUrl', () => {
  it('links a room id through matrix.to with its own server as via', () => {
    expect(matrixRoomUrl('!hlHJnEyyeNJCWHyTWE:opencampus.sh', 'other.server')).toBe(
      'https://matrix.to/#/!hlHJnEyyeNJCWHyTWE:opencampus.sh?via=opencampus.sh'
    );
  });

  it('falls back to the server name for a room id without a server part', () => {
    expect(matrixRoomUrl('!abc', 'matrix.example')).toBe('https://matrix.to/#/!abc?via=matrix.example');
    expect(matrixRoomUrl('!abc', '  ')).toBe(`https://matrix.to/#/!abc?via=${DEFAULT_MATRIX_SERVER_NAME}`);
  });

  it('returns null for an empty or missing room id', () => {
    expect(matrixRoomUrl(null)).toBeNull();
    expect(matrixRoomUrl('   ')).toBeNull();
  });
});
