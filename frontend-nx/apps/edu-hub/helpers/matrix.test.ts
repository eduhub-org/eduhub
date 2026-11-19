import {
  DEFAULT_MATRIX_SERVER_NAME,
  elementDirectMessageUrl,
  elementRoomUrl,
  matrixDirectMessageLinks,
  matrixDirectMessageUrl,
  matrixRoomLinks,
  matrixRoomUrl,
  toMatrixUserId,
} from './matrix';

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

  it.each([undefined, null, ''])('falls back to the default server name for %p', (serverName) => {
    expect(elementDirectMessageUrl('nina', serverName, 'https://element.example')).toBe(
      `https://element.example/#/user/@nina:${DEFAULT_MATRIX_SERVER_NAME}`
    );
  });

  it('still prefers a handle that carries its own domain over the fallback', () => {
    expect(elementDirectMessageUrl('@nina:matrix.org', undefined, 'https://element.example')).toBe(
      'https://element.example/#/user/@nina:matrix.org'
    );
  });
});

describe('elementRoomUrl', () => {
  it('links the room in the Element web client', () => {
    expect(elementRoomUrl('!abc:opencampus.sh', 'https://element.example/')).toBe(
      'https://element.example/#/room/!abc:opencampus.sh'
    );
  });

  it('returns null without a room id or a web client', () => {
    expect(elementRoomUrl(null, 'https://element.example')).toBeNull();
    expect(elementRoomUrl('!abc:opencampus.sh', '')).toBeNull();
  });
});

describe('matrixRoomLinks', () => {
  const original = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL;
  afterEach(() => {
    process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL = original;
  });

  it('pairs the Element web client with a matrix.to link for the apps', () => {
    process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL = 'https://element.example';
    expect(matrixRoomLinks('!abc:opencampus.sh')).toEqual({
      web: 'https://element.example/#/room/!abc:opencampus.sh',
      app: 'https://matrix.to/#/!abc:opencampus.sh?via=opencampus.sh',
    });
  });

  it('falls back to matrix.to alone without a web client', () => {
    process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL = '';
    expect(matrixRoomLinks('!abc:opencampus.sh')).toEqual({
      web: 'https://matrix.to/#/!abc:opencampus.sh?via=opencampus.sh',
      app: null,
    });
  });

  it('has no links without a room', () => {
    expect(matrixRoomLinks(null)).toEqual({ web: null, app: null });
  });
});

describe('matrixDirectMessageLinks', () => {
  it('pairs the Element web client with a matrix.to link for the apps', () => {
    const original = process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL;
    process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL = 'https://element.example';
    process.env.NEXT_PUBLIC_MATRIX_SERVER_NAME = 'opencampus.sh';
    expect(matrixDirectMessageLinks('nina')).toEqual({
      web: 'https://element.example/#/user/@nina:opencampus.sh',
      app: 'https://matrix.to/#/@nina:opencampus.sh',
    });
    process.env.NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL = original;
  });
});
