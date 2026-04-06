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

test("isValidMatrixRoomId", () => {
  assert.equal(isValidMatrixRoomId("!abc:example.org"), true);
  assert.equal(isValidMatrixRoomId("not-a-room"), false);
});
