/**
 * Run: node --test security.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { getProvidedSecret, secretsMatch } from "./security.js";

test("reads the Hasura-Secret header", () => {
  assert.equal(getProvidedSecret({ "hasura-secret": "s3cret" }), "s3cret");
});

test("falls back to the legacy secret header", () => {
  assert.equal(getProvidedSecret({ secret: "s3cret" }), "s3cret");
});

test("prefers Hasura-Secret when both are sent", () => {
  assert.equal(getProvidedSecret({ "hasura-secret": "new", secret: "old" }), "new");
});

test("is undefined without either header", () => {
  assert.equal(getProvidedSecret({}), undefined);
  assert.equal(getProvidedSecret(undefined), undefined);
});

test("secretsMatch rejects a missing or wrong secret", () => {
  assert.equal(secretsMatch(undefined, "s3cret"), false);
  assert.equal(secretsMatch("wrong", "s3cret"), false);
  assert.equal(secretsMatch("s3cret", "s3cret"), true);
});
