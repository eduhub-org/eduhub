import { isValidMatrixRoomId, normalizeMatrixRoomId } from './matrixRoom';

describe('isValidMatrixRoomId', () => {
  it('accepts room ids with a server name, port or IP', () => {
    expect(isValidMatrixRoomId('!abc:example.org')).toBe(true);
    expect(isValidMatrixRoomId('!abc:example.org:8448')).toBe(true);
    expect(isValidMatrixRoomId('!abc:192.168.0.1')).toBe(true);
  });

  it('accepts room version 12 ids, which have no server name', () => {
    expect(isValidMatrixRoomId('!FGdr_TaXi2Zjq1y7jBVW7qXVJokAlTrYDkOCV6g0QWU')).toBe(true);
  });

  it('rejects anything that is not a room id', () => {
    expect(isValidMatrixRoomId('not-a-room')).toBe(false);
    expect(isValidMatrixRoomId('#alias:example.org')).toBe(false);
    expect(isValidMatrixRoomId('!abc def')).toBe(false);
    expect(isValidMatrixRoomId('!')).toBe(false);
    expect(isValidMatrixRoomId('   ')).toBe(false);
  });
});

describe('normalizeMatrixRoomId', () => {
  it('reads a room version 12 id from a matrix.to link', () => {
    expect(normalizeMatrixRoomId('https://matrix.to/#/!localopaque123?via=example.org')).toBe('!localopaque123');
  });

  it('reads a room id from an Element link', () => {
    expect(normalizeMatrixRoomId('https://element.example.org/#/room/!abc:example.org')).toBe('!abc:example.org');
  });
});
