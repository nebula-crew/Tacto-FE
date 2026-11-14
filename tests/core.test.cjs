const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, mocks = {}, globals = {}) {
  const filename = path.join(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const dependencies = { 'react-native': { Platform: { OS: 'web' } }, ...mocks };
  const requireLocal = name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (name.startsWith('.')) return load(path.relative(path.join(__dirname, '..'), path.resolve(path.dirname(filename), name + '.ts')), mocks, globals);
    throw new Error('Unexpected dependency: ' + name);
  };
  const context = { module, exports: module.exports, require: requireLocal, process: { env: { EXPO_PUBLIC_API_URL: 'http://example.test:8000/' } }, AbortController, FormData, Blob, setTimeout, clearTimeout, ...globals };
  vm.runInNewContext(source, context, { filename });
  return module.exports;
}
const valid = { id: 'one', status: 'suspected', summary: '현장 확인 필요', checks: [{ code: 'M3', title: '연결부', detail: '현장 확인', status: 'suspected' }, { code: 'H3', title: '대상 여부', detail: '없음', status: 'not_applicable' }] };
test('contract accepts all overall states and not-applicable checks', () => {
  const { parseInspection } = load('services/inspection-schema.ts');
  for (const status of ['suspected', 'normal', 'hold']) assert.equal(parseInspection({ ...valid, status }).status, status);
  assert.equal(parseInspection(valid).checks[1].status, 'not_applicable');
});
test('contract rejects unknown states, missing checks and malformed items', () => {
  const { parseInspection } = load('services/inspection-schema.ts');
  for (const value of [null, { ...valid, status: 'safe' }, { ...valid, checks: null }, { ...valid, checks: [{ code: 'M3', status: 'normal' }] }]) assert.throws(() => parseInspection(value));
});
test('intro is absent on first launch and remains completed after a new storage reader is created', async () => {
  const saved = new Map();
  const localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  let prefs = load('services/preferences.ts', {}, { localStorage });
  assert.equal(await prefs.readIntroDone(), false);
  await prefs.writeIntroDone();
  prefs = load('services/preferences.ts', {}, { localStorage });
  assert.equal(await prefs.readIntroDone(), true);
});
test('native intro persists through File/Paths adapter without storing photos', async () => {
  const disk = new Map();
  class File { constructor(parent, name) { this.key = parent + '/' + name; } get exists() { return disk.has(this.key); } create() { disk.set(this.key, ''); } async text() { return disk.get(this.key); } write(text) { disk.set(this.key, text); } }
  const mocks = { 'react-native': { Platform: { OS: 'android' } }, 'expo-file-system': { File, Paths: { document: 'documents' } } };
  const prefs = load('services/preferences.ts', mocks);
  assert.equal(await prefs.readIntroDone(), false); await prefs.writeIntroDone();
  assert.equal(await load('services/preferences.ts', mocks).readIntroDone(), true);
  assert.equal(disk.size, 1);
});
test('storage denial is surfaced to allow the UI to offer retry/session-only skip', async () => {
  const prefs = load('services/preferences.ts', {}, { localStorage: { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } } });
  await assert.rejects(prefs.readIntroDone(), /denied/); await assert.rejects(prefs.writeIntroDone(), /denied/);
});
test('web upload uses one multipart file and the configured endpoint', async () => {
  let calls = 0;
  const api = load('services/api.ts', {}, { fetch: async (url, options) => {
    calls++; assert.equal(url, 'http://example.test:8000/api/inspections'); assert.equal(options.method, 'POST');
    assert.equal(options.headers, undefined); assert.equal([...options.body.keys()].join(), 'file');
    assert.equal(options.body.get('file').name, 'photo.jpg');
    return { ok: true, json: async () => valid };
  } });
  const stages = [];
  const result = await api.createInspection({ uri: 'unused', name: 'photo.jpg', mimeType: 'image/jpeg', file: new Blob(['image']) }, new AbortController().signal, stage => stages.push(stage));
  assert.equal(result.id, 'one'); assert.equal(calls, 1); assert.equal(stages.join(), 'preparing,waiting,report');
});
test('HTTP and invalid-response failures never become a demo success', async () => {
  const photo = { uri: 'unused', name: 'photo.jpg', file: new Blob(['x']) };
  const controller = new AbortController();
  let api = load('services/api.ts', {}, { fetch: async () => ({ ok: false, status: 422 }) });
  await assert.rejects(api.createInspection(photo, controller.signal, () => {}), /HTTP 422/);
  api = load('services/api.ts', {}, { fetch: async () => ({ ok: true, json: async () => ({ status: 'normal' }) }) });
  await assert.rejects(api.createInspection(photo, controller.signal, () => {}));
});
test('cancelling aborts the actual HTTP request', async () => {
  const controller = new AbortController(); let requestStarted;
  const started = new Promise(resolve => { requestStarted = resolve; });
  const api = load('services/api.ts', {}, { fetch: (_url, options) => new Promise((_resolve, reject) => { requestStarted(); options.signal.addEventListener('abort', () => reject(new Error('aborted'))); }) });
  const request = api.createInspection({ uri: '', name: 'x.jpg', file: new Blob(['x']) }, controller.signal, () => {});
  await started; controller.abort(); await assert.rejects(request, /취소/);
});
