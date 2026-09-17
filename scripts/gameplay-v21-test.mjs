import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CONTRACT_VERSION,
  REQUIRED_DEBUG_METHODS,
  assertSubset,
  commandReference,
  createReferenceState,
  migrateReferenceSave,
  runDebugScenarios,
  stepReference
} from './helpers/gameplay-v21-contract.mjs';

const root = path.resolve(import.meta.dirname, '..');
const fixturePath = path.join(root, 'scripts/fixtures/gameplay-v21-vectors.json');
const sourcePath = path.resolve(root, process.env.EVERLIGHT_GAME_SOURCE || 'js/game-v4.js');
const vectors = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

assert.equal(vectors.meta.contractVersion, CONTRACT_VERSION, 'fixture contract version drifted');
assert.equal(vectors.meta.seed, 1337, 'fixture seed must remain stable');
assert.equal(vectors.scenarios.length, 11, 'all gameplay contract scenarios must remain present');
assert.equal(new Set(vectors.scenarios.map(item => item.id)).size, vectors.scenarios.length, 'scenario IDs must be unique');

for (const required of [
  'enemy-telegraph-timing', 'loot-drop-and-pickup', 'camera-safe-zone-tracking',
  'zone-transitions', 'shop-purchase', 'quest-progression', 'faction-join',
  'skill-unlock', 'equipment-equip', 'mount-toggle', 'save-load-migration'
]) {
  assert(vectors.scenarios.some(item => item.id === required), `missing vector ${required}`);
}

function runReferenceVectors() {
  for (const scenario of vectors.scenarios) {
    let state = createReferenceState(scenario.initial);
    for (const [index, action] of scenario.actions.entries()) {
      if (action.type === 'step') state = stepReference(state, action.ms);
      else if (action.type === 'migrate') state = migrateReferenceSave(action.save);
      else state = commandReference(state, action.name, action.payload);
      assertSubset(state, action.expect, `reference:${scenario.id}[${index}]`);
    }
  }
}

function inspectRuntimeSource() {
  assert(fs.existsSync(sourcePath), `runtime source not found: ${sourcePath}`);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const hasDebugApi = source.includes('__EVERLIGHT_DEBUG__');
  if (!hasDebugApi) return { hasDebugApi, missing: REQUIRED_DEBUG_METHODS };
  const marker = source.lastIndexOf('__EVERLIGHT_DEBUG__');
  const contractSource = source.slice(marker, marker + 6000);
  const missing = REQUIRED_DEBUG_METHODS.filter(name => !new RegExp(`\\b${name}\\b`).test(contractSource));
  return { hasDebugApi, missing };
}

async function maybeRunAdapter() {
  const adapterPath = process.env.EVERLIGHT_DEBUG_ADAPTER;
  if (!adapterPath) return false;
  const adapter = await import(pathToFileURL(path.resolve(adapterPath)).href);
  assert.equal(typeof adapter.getDebugApi, 'function', 'adapter must export getDebugApi()');
  const api = await adapter.getDebugApi();
  await runDebugScenarios(api, vectors);
  if (typeof adapter.close === 'function') await adapter.close();
  return true;
}

runReferenceVectors();
console.log(`\u2713 ${vectors.scenarios.length} deterministic gameplay vector scenarios passed`);

const sourceContract = inspectRuntimeSource();
if (sourceContract.hasDebugApi && sourceContract.missing.length) {
  throw new Error(`Runtime debug API is incomplete: missing ${sourceContract.missing.join(', ')}`);
}

const adapterRan = await maybeRunAdapter();
if (adapterRan) {
  console.log('\u2713 browser debug API matched deterministic snapshots');
} else if (sourceContract.hasDebugApi) {
  console.log('\u2713 runtime source exposes the complete __EVERLIGHT_DEBUG__ contract');
  console.log('  Set EVERLIGHT_DEBUG_ADAPTER to execute the same vectors against a browser session.');
} else if (process.env.EVERLIGHT_REQUIRE_DEBUG === '1') {
  throw new Error(`Runtime does not expose window.__EVERLIGHT_DEBUG__ in ${path.relative(root, sourcePath)}`);
} else {
  console.log(`\u26a0 runtime debug hook is pending in ${path.relative(root, sourcePath)}`);
  console.log('  Use EVERLIGHT_REQUIRE_DEBUG=1 after runtime integration to make this a hard failure.');
}
