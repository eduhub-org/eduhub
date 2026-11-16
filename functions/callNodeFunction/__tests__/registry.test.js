import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from '@jest/globals';
import yaml from 'js-yaml';
import {
  callNodeFunctionHandlers,
  identityHandlers,
  identityPinnedActions,
  mediaHandlers,
  movedHandlers,
} from '../index.js';

// Keeps the dispatchers' handler maps, the handler folders and the Hasura
// metadata (actions, cron triggers, event triggers) in step, so a handler
// that is not registered, or a metadata entry naming a function that its
// unit does not route, fails here instead of in production.

const UNIT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const METADATA_DIR = path.resolve(UNIT_DIR, '../../backend/metadata');

// The units built from this code: the Hasura URL variable each one is reached
// through, and the handlers it serves.
const DISPATCHERS = [
  { unit: 'callNodeFunction', urlEnv: 'CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION', handlers: callNodeFunctionHandlers },
  {
    unit: 'identity',
    urlEnv: 'CLOUD_FUNCTION_LINK_IDENTITY',
    handlers: identityHandlers,
    pinnedActions: identityPinnedActions,
  },
  { unit: 'media', urlEnv: 'CLOUD_FUNCTION_LINK_MEDIA', handlers: mediaHandlers },
];
const DISPATCHER_BY_ENV = new Map(DISPATCHERS.map((dispatcher) => [dispatcher.urlEnv, dispatcher]));

// Header the dispatcher routes on (`name` is the legacy spelling).
const NAME_HEADERS = new Set(['name', 'function-name']);

// Folders with an index.js that are not handlers.
const NON_HANDLER_DIRS = new Set(['lib', 'scripts', 'shared', 'node_modules', 'coverage', 'jest']);
// Handlers registered under another name than their folder.
const EXTRA_KEYS = { deleteMyAccount: 'anonymizeUser' };
// Handler keys that no metadata entry is expected to reference.
// Folded in from their own units; the metadata still calls those units.
const UNREFERENCED_ALLOWED = new Set(['updateFromKeycloak', 'addKeycloakRole', 'removeKeycloakRole', 'sendQuestionaires']);

const readYaml = (file) => yaml.load(fs.readFileSync(file, 'utf8')) ?? [];

/** URL variable of a `{{VAR}}` template or a `webhook_from_env` entry. */
const urlEnvOf = (url, urlFromEnv) => urlFromEnv ?? /^\{\{(\w+)\}\}$/.exec(url ?? '')?.[1];

const functionNameOf = (headers = []) =>
  headers.find((header) => NAME_HEADERS.has(String(header.name).toLowerCase()))?.value;

/** Every metadata entry that calls one of these units, as { source, urlEnv, functionName }. */
const collectMetadataReferences = () => {
  const references = [];
  const add = (source, urlEnv, headers, action = {}) => {
    if (DISPATCHER_BY_ENV.has(urlEnv)) {
      references.push({ source, urlEnv, functionName: functionNameOf(headers), ...action });
    }
  };

  for (const action of readYaml(path.join(METADATA_DIR, 'actions.yaml')).actions ?? []) {
    const { handler, headers, forward_client_headers: forwardsClientHeaders } = action.definition ?? {};
    add(`action ${action.name}`, urlEnvOf(handler), headers, {
      actionName: action.name,
      forwardsClientHeaders: forwardsClientHeaders === true,
    });
  }

  for (const cron of readYaml(path.join(METADATA_DIR, 'cron_triggers.yaml'))) {
    add(`cron ${cron.name}`, urlEnvOf(cron.webhook, cron.webhook_from_env), cron.headers);
  }

  const databasesDir = path.join(METADATA_DIR, 'databases');
  for (const database of fs.readdirSync(databasesDir, { withFileTypes: true })) {
    if (!database.isDirectory()) continue;
    const tablesDir = path.join(databasesDir, database.name, 'tables');
    if (!fs.existsSync(tablesDir)) continue;
    for (const file of fs.readdirSync(tablesDir).filter((name) => name.endsWith('.yaml'))) {
      const table = readYaml(path.join(tablesDir, file));
      for (const trigger of table?.event_triggers ?? []) {
        add(
          `event trigger ${trigger.name} (${file})`,
          urlEnvOf(trigger.webhook, trigger.webhook_from_env),
          trigger.headers
        );
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

const allKeys = () => DISPATCHERS.flatMap(({ handlers }) => Object.keys(handlers));

describe('handler registry', () => {
  const references = collectMetadataReferences();

  it('finds the metadata entries that call the dispatchers', () => {
    expect(references.length).toBeGreaterThan(20);
  });

  it('registers every handler folder in exactly one dispatcher', () => {
    const keys = allKeys();
    const counts = handlerDirs().map((dir) => [dir, keys.filter((key) => key === dir).length]);
    expect(counts.filter(([, count]) => count !== 1)).toEqual([]);
  });

  it('registers every handler name in exactly one dispatcher', () => {
    const keys = allKeys();
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([]);
  });

  it('maps every handler key to a handler folder', () => {
    const dirs = new Set(handlerDirs());
    const orphaned = allKeys().filter((key) => !dirs.has(key) && !dirs.has(EXTRA_KEYS[key]));
    expect(orphaned).toEqual([]);
  });

  it("resolves every function name in Hasura metadata in its URL's dispatcher", () => {
    const unresolved = references
      .filter(({ urlEnv, functionName }) => {
        const { handlers } = DISPATCHER_BY_ENV.get(urlEnv);
        return !functionName || !Object.hasOwn(handlers, functionName);
      })
      .map(({ source, urlEnv, functionName }) => `${source} -> ${urlEnv} ${functionName ?? '(no name header)'}`);
    expect(unresolved).toEqual([]);
  });

  it.each(DISPATCHERS)('references every $unit handler through $urlEnv', ({ urlEnv, handlers }) => {
    const referenced = new Set(
      references.filter((reference) => reference.urlEnv === urlEnv).map(({ functionName }) => functionName)
    );
    const unreferenced = Object.keys(handlers).filter(
      (key) => !referenced.has(key) && !UNREFERENCED_ALLOWED.has(key)
    );
    expect(unreferenced).toEqual([]);
  });

  // A caller can add their own routing header to an action that forwards
  // client headers; only a pinned action ignores it.
  it('pins every action that forwards client headers to its handler', () => {
    const unpinned = references
      .filter(({ forwardsClientHeaders }) => forwardsClientHeaders)
      .filter(({ urlEnv, actionName, functionName }) => {
        const { pinnedActions = {} } = DISPATCHER_BY_ENV.get(urlEnv);
        return pinnedActions[actionName] !== functionName;
      })
      .map(({ source }) => source);
    expect(unpinned).toEqual([]);
  });

  it('pins actions only to handlers of their dispatcher', () => {
    const invalid = DISPATCHERS.flatMap(({ unit, handlers, pinnedActions = {} }) =>
      Object.entries(pinnedActions)
        .filter(([, handler]) => !Object.hasOwn(handlers, handler))
        .map(([action, handler]) => `${unit}: ${action} -> ${handler}`)
    );
    expect(invalid).toEqual([]);
  });

  it('keeps routing in callNodeFunction only handlers that moved to identity or media', () => {
    const moved = Object.keys(movedHandlers).filter(
      (key) => movedHandlers[key] !== (identityHandlers[key] ?? mediaHandlers[key])
    );
    expect(moved).toEqual([]);
  });
});
