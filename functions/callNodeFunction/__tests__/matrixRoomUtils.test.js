import { describe, expect, it, test } from "@jest/globals";
import assert from "node:assert/strict";
import { normalizeMatrixRoomId, isValidMatrixRoomId, parseMatrixResponse } from "../lib/matrixRoomUtils.js";

test("normalizeMatrixRoomId from Element hash URL", () => {
  assert.equal(
    normalizeMatrixRoomId("https://matrix.example.com/#/room/!abc:example.org"),
    "!abc:example.org"
  );
});

test("normalizeMatrixRoomId from raw id", () => {
  assert.equal(normalizeMatrixRoomId("!xyz:domain.tld"), "!xyz:domain.tld");
});

test("normalizeMatrixRoomId strips query params from Element URL", () => {
  assert.equal(
    normalizeMatrixRoomId("https://matrix.example.com/#/room/!abc:example.org?via=example.org"),
    "!abc:example.org"
  );
});

test("normalizeMatrixRoomId from matrix.to permalink", () => {
  assert.equal(
    normalizeMatrixRoomId(
      "https://matrix.to/#/!uDGcWwlZAIdpXeaMsX:opencampus.sh?via=opencampus.sh"
    ),
    "!uDGcWwlZAIdpXeaMsX:opencampus.sh"
  );
});

test("normalizeMatrixRoomId from percent-encoded matrix.to hash", () => {
  assert.equal(
    normalizeMatrixRoomId(
      "https://matrix.to/#/%21uDGcWwlZAIdpXeaMsX%3Aopencampus.sh?via=opencampus.sh"
    ),
    "!uDGcWwlZAIdpXeaMsX:opencampus.sh"
  );
});

test("normalizeMatrixRoomId from matrix.to v12 local-only room in hash", () => {
  assert.equal(
    normalizeMatrixRoomId("https://matrix.to/#/!localopaque123?via=example.org"),
    "!localopaque123"
  );
});

test("isValidMatrixRoomId", () => {
  assert.equal(isValidMatrixRoomId("!abc:example.org"), true);
  assert.equal(isValidMatrixRoomId("!localopaque"), true);
  assert.equal(isValidMatrixRoomId("!abc:example.org:443"), true);
  assert.equal(isValidMatrixRoomId("!abc:[2001:db8::1]:8448"), true);
  assert.equal(isValidMatrixRoomId("!abc:192.168.0.1"), true);
  assert.equal(isValidMatrixRoomId("not-a-room"), false);
});

describe('parseMatrixResponse', () => {
  const response = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => (body === undefined ? JSON.parse('not json') : body),
  });

  it('returns the JSON body of a successful response', async () => {
    await expect(parseMatrixResponse(response(200, { room_id: '!a:b' }))).resolves.toEqual({
      room_id: '!a:b',
    });
  });

  it('returns null for a successful response without JSON', async () => {
    await expect(parseMatrixResponse(response(200))).resolves.toBeNull();
  });

  it('throws with Matrix error details otherwise', async () => {
    await expect(
      parseMatrixResponse(response(403, { errcode: 'M_FORBIDDEN', error: 'nope' }))
    ).rejects.toMatchObject({ message: 'nope', status: 403, errcode: 'M_FORBIDDEN' });
    await expect(parseMatrixResponse(response(502))).rejects.toMatchObject({
      message: 'Matrix request failed with HTTP 502',
      status: 502,
    });
  });
});
