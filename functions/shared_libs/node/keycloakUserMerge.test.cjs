/**
 * Run: node --test keycloakUserMerge.test.cjs
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mergeUserPutPayload } = require("./keycloakUserMerge.cjs");

test("merges partial attributes without dropping existing custom attributes", () => {
  const existing = {
    username: "u@example.com",
    firstName: "A",
    lastName: "B",
    email: "u@example.com",
    attributes: {
      picture: ["https://cdn.example.com/p.jpg"],
      locale: ["de"],
    },
    userProfileMetadata: { readOnly: false },
    access: { manage: true },
  };
  const patch = {
    attributes: {
      matrix_user_handle: ["anna.bo.abc123"],
    },
  };
  const out = mergeUserPutPayload(existing, patch);
  assert.equal(out.picture, undefined);
  assert.deepEqual(out.attributes, {
    picture: ["https://cdn.example.com/p.jpg"],
    locale: ["de"],
    matrix_user_handle: ["anna.bo.abc123"],
  });
  assert.equal(out.userProfileMetadata, undefined);
  assert.equal(out.access, undefined);
});

test("patch attribute values override existing keys", () => {
  const existing = {
    username: "x@y.com",
    attributes: { picture: ["old"] },
  };
  const out = mergeUserPutPayload(existing, {
    attributes: { picture: ["new"] },
  });
  assert.deepEqual(out.attributes, { picture: ["new"] });
});

test("clears an attribute when patch sets empty array", () => {
  const existing = {
    username: "x@y.com",
    attributes: { picture: ["x"], matrix_user_handle: ["h"] },
  };
  const out = mergeUserPutPayload(existing, {
    attributes: { picture: [] },
  });
  assert.deepEqual(out.attributes, {
    picture: [],
    matrix_user_handle: ["h"],
  });
});

test("throws when username missing", () => {
  assert.throws(
    () => mergeUserPutPayload({ email: "a@b.com" }, { firstName: "A" }),
    /username/
  );
});
