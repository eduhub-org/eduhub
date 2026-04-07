import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMatrixRoomId, isValidMatrixRoomId } from "../lib/matrixRoomUtils.js";

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
