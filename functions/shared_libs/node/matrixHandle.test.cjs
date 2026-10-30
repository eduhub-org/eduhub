/**
 * Run: node --test matrixHandle.test.cjs
 *
 * The same cases live in MatrixHandleEventListenerProviderTest (Keycloak SPI);
 * update both when the expected handles change.
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { computeMatrixHandle } = require("./matrixHandle.cjs");

const UUID = "4f42bd12-3456-7890-abcd-ef0123456789";

const cases = [
  ["Anna", "Bo", "anna.bo.4f42bd"],
  ["Jürgen", "Müller-Lüdenscheidt", "jurgen.muller-ludenscheidt.4f42bd"],
  ["Renée", "O'Brien", "renee.obrien.4f42bd"],
  ["Иван", "Петров", "ivan.petrov.4f42bd"],
  ["Юлия", "Щербакова", "iuliia.shcherbakova.4f42bd"],
  ["Сергей", "Ёлкин", "sergei.elkin.4f42bd"],
  ["Олексій", "Гнатюк", "oleksii.gnatiuk.4f42bd"],
  ["Ђорђе", "Јовановић", "djordje.jovanovic.4f42bd"],
  ["Γιώργος", "Παπαδόπουλος", "giorgos.papadopoulos.4f42bd"],
  ["Ευάγγελος", "Παύλου", "evangelos.pavlou.4f42bd"],
  ["Ευστάθιος", "Αυγερινός", "efstathios.avgerinos.4f42bd"],
  ["Ηύα", "Γαλάτσευ", "iva.galatsef.4f42bd"],
  ["Weiß", "Ærø", "weiss.aero.4f42bd"],
  ["Łukasz", "Kowalski", "lukasz.kowalski.4f42bd"],
  ["小明", "王", "user.user.4f42bd"],
  ["محمد", "😀", "user.user.4f42bd"],
  ["", null, "user.user.4f42bd"],
];

for (const [first, last, expected] of cases) {
  test(`${first} ${last} -> ${expected}`, () => {
    assert.equal(computeMatrixHandle(first, last, UUID), expected);
  });
}
