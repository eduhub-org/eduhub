import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from '@jest/globals';
import yaml from 'js-yaml';
import { functionMap } from '../index.js';

// Keeps the dispatcher's functionMap, the handler folders and the Hasura
// metadata (actions, cron triggers, event triggers) in step, so a handler
// that is not registered, or a metadata entry naming a function that does not
// exist, fails here instead of in production.

const UNIT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const METADATA_DIR = path.resolve(UNIT_DIR, '../../backend/metadata');
const URL_TEMPLATE = '{{CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION}}';
const URL_ENV = 'CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION';
// Header the dispatcher routes on (index.js reads only `req.headers.name`).
const NAME_HEADERS = new Set(['name']);

// Folders with an index.js that are not handlers.
const NON_HANDLER_DIRS = new Set(['lib', 'scripts', 'shared', 'node_modules', 'coverage', 'jest']);
// Handlers registered under another name than their folder.
const EXTRA_KEYS = { deleteMyAccount: 'anonymizeUser' };
// functionMap keys that no metadata entry is expected to reference.
const UNREFERENCED_ALLOWED = new Set([]);

const readYaml = (file) => yaml.load(fs.readFileSync(file, 'utf8')) ?? [];

const isCallNodeFunction = (url, urlFromEnv) => url === URL_TEMPLATE || urlFromEnv === URL_ENV;

const functionNameOf = (headers = []) =>
  headers.find((header) => NAME_HEADERS.has(String(header.name).toLowerCase()))?.value;

/** Every metadata entry that calls this unit, as { source, functionName }. */
const collectMetadataReferences = () => {
  const references = [];

  for (const action of readYaml(path.join(METADATA_DIR, 'actions.yaml')).actions ?? []) {
    const { handler, headers } = action.definition ?? {};
    if (isCallNodeFunction(handler)) {
      references.push({ source: `action ${action.name}`, functionName: functionNameOf(headers) });
    }
  }

  for (const cron of readYaml(path.join(METADATA_DIR, 'cron_triggers.yaml'))) {
    if (isCallNodeFunction(cron.webhook, cron.webhook_from_env)) {
      references.push({ source: `cron ${cron.name}`, functionName: functionNameOf(cron.headers) });
    }
  }

  const databasesDir = path.join(METADATA_DIR, 'databases');
  for (const database of fs.readdirSync(databasesDir, { withFileTypes: true })) {
    if (!database.isDirectory()) continue;
    const tablesDir = path.join(databasesDir, database.name, 'tables');
    if (!fs.existsSync(tablesDir)) continue;
    for (const file of fs.readdirSync(tablesDir).filter((name) => name.endsWith('.yaml'))) {
      const table = readYaml(path.join(tablesDir, file));
      for (const trigger of table?.event_triggers ?? []) {
        if (isCallNodeFunction(trigger.webhook, trigger.webhook_from_env)) {
          references.push({
            source: `event trigger ${trigger.name} (${file})`,
            functionName: functionNameOf(trigger.headers),
          });
        }
      }
    }
  }

  return references;
};

const handlerDirs = () =>
  fs
    .readdirSync(UNIT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('__'))
    .filter((entry) => !NON_HANDLER_DIRS.has(entry.name))
    .filter((entry) => fs.existsSync(path.join(UNIT_DIR, entry.name, 'index.js')))
    .map((entry) => entry.name);

describe('handler registry', () => {
  const references = collectMetadataReferences();

  it('finds the metadata entries that call callNodeFunction', () => {
    expect(references.length).toBeGreaterThan(20);
  });

  it('registers every handler folder in functionMap', () => {
    const missing = handlerDirs().filter((dir) => !Object.hasOwn(functionMap, dir));
    expect(missing).toEqual([]);
  });

  it('maps every functionMap key to a handler folder', () => {
    const dirs = new Set(handlerDirs());
    const orphaned = Object.keys(functionMap).filter(
      (key) => !dirs.has(key) && !dirs.has(EXTRA_KEYS[key])
    );
    expect(orphaned).toEqual([]);
  });

  it('resolves every function name in Hasura metadata', () => {
    const unresolved = references
      .filter(({ functionName }) => !functionName || !Object.hasOwn(functionMap, functionName))
      .map(({ source, functionName }) => `${source} -> ${functionName ?? '(no name header)'}`);
    expect(unresolved).toEqual([]);
  });

  it('references every registered function from Hasura metadata', () => {
    const referenced = new Set(references.map(({ functionName }) => functionName));
    const unreferenced = Object.keys(functionMap).filter(
      (key) => !referenced.has(key) && !UNREFERENCED_ALLOWED.has(key)
    );
    expect(unreferenced).toEqual([]);
  });
});
