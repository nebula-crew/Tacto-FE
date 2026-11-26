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
const backend = { inspection_id: 'abc123', overall: 'suspected', scope: { C: '판정', M: '건너뜀 (블록 영역이 너무 작거나 없음)' }, findings: [
  { code: 'H2', verdict: 'hold', message: '시점 보정 실패로 횡단보도 진입 방향(C4) 판정 보류', clause: null, suggestion: null, primary: true },
  { code: 'C1', verdict: 'suspected', message: '블록이 횡단보도 쪽을 향하지만 입구까지 이어지지 않음', clause: '장애인등편의법 시행규칙 별표 1 제16호 나목(2)', suggestion: '블록 경로를 횡단보도 입구까지 연장', primary: true },
  { code: 'C3', verdict: 'suspected', message: '보조 판정', primary: false },
] };
test('backend InspectionResult maps to screen checks with clause, suggestion and not-applicable scope', () => {
  const { parseInspection } = load('services/inspection-schema.ts');
  const r = parseInspection(backend);
  assert.equal(r.id, 'abc123'); assert.equal(r.status, 'suspected');
  assert.match(r.summary, /횡단보도 입구에 닿기 전에 끝나는 것으로 보여요.*외 1건/);
  assert.equal(r.checks.map(c => c.code).join(), 'C1,C3,H2,M');
  assert.equal(r.checks[0].title, '횡단보도 입구까지 연결 확인');
  assert.match(r.checks[0].detail, /개선 방향: 선형 블록이 횡단보도 입구까지 이어져 보행자가 건너기 시작하는 지점을 찾을 수 있어야 해요.\n근거: 「장애인등편의법 시행규칙」/);
  assert.equal(r.checks[1].title, '횡단보도 입구 방향 안내 확인 (참고)');
  assert.equal(r.checks[2].title, '사진 각도 때문에 방향은 판단하지 못했어요');
  assert.match(r.checks[2].detail, /사진 각도 때문에 횡단보도와 블록의 진행 방향을 정확히 비교하기 어려워요/);
  assert.equal(parseInspection({ inspection_id: 'h', overall: 'hold', scope: {}, findings: [{ code: 'M3', verdict: 'hold', message: '후보 없음 (M3 대상 불명확).' }] }).checks[0].title, '꺾임·분기점 점형: 판단하지 못했어요');
  assert.equal(r.checks[3].status, 'not_applicable'); assert.equal(r.checks[3].detail, '블록 영역이 너무 작거나 없음');
});
test('backend format rejects unknown verdicts and malformed findings', () => {
  const { parseInspection } = load('services/inspection-schema.ts');
  for (const value of [{ ...backend, overall: 'safe' }, { ...backend, findings: null }, { ...backend, findings: [{ code: 'C1', verdict: 'bad', message: 'x' }] }]) assert.throws(() => parseInspection(value));
  assert.equal(parseInspection({ inspection_id: 'n', overall: 'normal', scope: {}, findings: [] }).summary, '사진에서 확인한 항목에는 뚜렷한 설치 오류가 보이지 않아요. 항목별로 확인한 내용을 아래에서 살펴보세요.');
});
test('normal result shows friendly explanations without rule codes or not-applicable items', () => {
  const { parseInspection, plain } = load('services/inspection-schema.ts');
  const r = parseInspection({ inspection_id: 'n', overall: 'normal', scope: { C: '판정', M: '대상 없음 (꺾임·분기점이 보이지 않음)' }, findings: [
    { code: 'C1', verdict: 'normal', message: '블록 경로가 횡단보도 입구까지 이어짐' },
    { code: 'C4', verdict: 'normal', message: '횡단보도 진입부에 점형 블록이 확인됨' },
    { code: 'C4', verdict: 'normal', message: '진입부 선형 돌출선 방향이 횡단보도 방향과 일치함' },
  ] });
  assert.equal(r.summary, '사진에서 확인한 항목에는 뚜렷한 설치 오류가 보이지 않아요. 항목별로 확인한 내용을 아래에서 살펴보세요.');
  assert.equal(r.checks.map(c => c.title).join('|'), '횡단보도 입구 연결: 문제 없어요|진입부 점형·돌출선 방향: 문제 없어요');
  assert.ok(r.checks.every(c => c.status === 'normal'));
  const held = parseInspection({ inspection_id: 'h', overall: 'hold', scope: {}, findings: [{ code: 'H2', verdict: 'hold', message: '시점 보정 실패로 돌출선 방향(C4) 판정 보류 (흰 줄 간격이 고르지 않음)' }] });
  assert.equal(held.summary, '사진 각도 때문에 방향은 판단하지 못했어요. 횡단보도 흰 줄이 4개 이상 보이게 찍으면 방향까지 확인할 수 있어요.');
  assert.equal(plain('횡단보도가 보이지 않아 연결 판정(C1·C3·C4) 보류. 차도 직진(C2)만 확인함'), '횡단보도가 보이지 않아 연결 판정 보류. 차도 직진만 확인함');
});
test('repeated findings keep each distinct explanation only once', () => {
  const { parseInspection } = load('services/inspection-schema.ts');
  for (const code of ['M3', 'M4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6']) {
    for (const verdict of ['suspected', 'normal', 'hold']) {
      const finding = { code, verdict, message: '같은 사진에서 반복된 판정', suggestion: '설치 상태 확인', clause: '동일 근거' };
      const result = parseInspection({ inspection_id: 'repeat', overall: verdict, scope: {}, findings: Array.from({ length: 4 }, () => ({ ...finding })) });
      assert.equal(result.checks.length, 1, `${code} ${verdict}`);
      const lines = result.checks[0].detail.split('\n');
      assert.equal(lines.length, new Set(lines).size, `${code} ${verdict}: duplicate detail`);
      assert.equal(lines.filter(line => line.startsWith('확인 기준:')).length, 1, `${code} ${verdict}: rule`);
      assert.equal(lines.filter(line => line.startsWith('사진에서 확인한 내용:')).length, 1, `${code} ${verdict}: observation`);
    }
  }
  const c4 = parseInspection({ inspection_id: 'two-observations', overall: 'normal', scope: {}, findings: [
    { code: 'C4', verdict: 'normal', message: '점형 블록이 확인됨' },
    { code: 'C4', verdict: 'normal', message: '돌출선 방향이 횡단보도와 일치함' },
  ] });
  assert.equal(c4.checks[0].detail.split('\n').filter(line => line.startsWith('사진에서 확인한 내용:')).length, 2);
});
test('overall status: suspected beats normal, normal beats hold, hold only stays hold', () => {
  const { parseInspection } = load('services/inspection-schema.ts');
  const f = (code, verdict) => ({ code, verdict, message: `${code} ${verdict}` });
  const run = (overall, findings) => parseInspection({ inspection_id: 'x', overall, scope: {}, findings });
  const normalHold = run('hold', [f('C1', 'normal'), f('H2', 'hold'), f('M3', 'normal')]);
  assert.equal(normalHold.status, 'normal');
  assert.ok(normalHold.checks.every(c => c.status === 'normal'));  // 정상이면 정상 이유만
  assert.equal(run('hold', [f('H2', 'hold')]).status, 'hold');
  assert.equal(run('suspected', [f('C2', 'suspected'), f('H2', 'hold')]).status, 'suspected');
  assert.equal(run('suspected', [f('C1', 'normal'), f('M3', 'suspected')]).status, 'suspected');
  assert.equal(run('suspected', [f('C1', 'normal'), f('M3', 'suspected'), f('H2', 'hold')]).status, 'suspected');
  assert.equal(run('hold', []).status, 'hold');
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
test('web upload sends one multipart photo field and the configured endpoint', async () => {
  let calls = 0;
  const api = load('services/api.ts', {}, { fetch: async (url, options) => {
    calls++; assert.equal(url, 'http://example.test:8000/api/inspections'); assert.equal(options.method, 'POST');
    assert.equal(options.headers, undefined); assert.equal([...options.body.keys()].join(), 'photo');
    assert.equal(options.body.get('photo').name, 'photo.jpg');
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
test('report submit posts JSON location to the inspection and surfaces server refusals', async () => {
  let sent;
  let api = load('services/api.ts', {}, { fetch: async (url, options) => { sent = { url, options }; return { ok: true, status: 200 }; } });
  await api.submitReport('id/1', { address: '우암동 횡단보도', memo: '연결 안 됨' });
  assert.equal(sent.url, 'http://example.test:8000/api/inspections/id%2F1/report');
  assert.equal(sent.options.method, 'POST'); assert.equal(sent.options.headers['Content-Type'], 'application/json');
  assert.equal(sent.options.body, JSON.stringify({ address: '우암동 횡단보도', memo: '연결 안 됨' }));
  api = load('services/api.ts', {}, { fetch: async () => ({ ok: false, status: 409 }) });
  await assert.rejects(api.submitReport('x', { address: 'a' }), /확인 중/);
  api = load('services/api.ts', {}, { fetch: async () => ({ ok: false, status: 502 }) });
  await assert.rejects(api.submitReport('x', { address: 'a' }), /HTTP 502/);
  api = load('services/api.ts', {}, { fetch: async () => { throw new TypeError('fail'); } });
  await assert.rejects(api.submitReport('x', { address: 'a' }), /연결할 수 없어요/);
});
test('camera photo upload adds lat/lng fields next to the photo; no coords sends photo only', async () => {
  const bodies = [];
  const api = load('services/api.ts', {}, { fetch: async (_url, options) => { bodies.push(options.body); return { ok: true, json: async () => valid }; } });
  const photo = { uri: 'unused', name: 'photo.jpg', mimeType: 'image/jpeg', file: new Blob(['image']) };
  await api.createInspection(photo, new AbortController().signal, () => {}, { lat: 37.566535, lng: 126.977969 });
  assert.equal([...bodies[0].keys()].join(), 'photo,lat,lng');
  assert.equal(bodies[0].get('lat'), '37.566535'); assert.equal(bodies[0].get('lng'), '126.977969');
  await api.createInspection(photo, new AbortController().signal, () => {}, null);
  assert.equal([...bodies[1].keys()].join(), 'photo');
});
test('report keeps the capture coordinates so the server does not clear them', async () => {
  let body;
  const api = load('services/api.ts', {}, { fetch: async (_url, options) => { body = JSON.parse(options.body); return { ok: true, status: 200 }; } });
  await api.submitReport('id', { address: '정문 앞 횡단보도', memo: '확인 요청', lat: 37.5, lng: 127.1 });
  assert.deepEqual(body, { address: '정문 앞 횡단보도', memo: '확인 요청', lat: 37.5, lng: 127.1 });
});
test('admin map link uses capture coordinates and skips missing or invalid ones', () => {
  const { mapUrl } = load('services/admin-api.ts');
  assert.equal(mapUrl({ address: '정문 앞, 횡단보도', lat: 37.566535, lng: 126.977969 }), `https://map.kakao.com/link/map/${encodeURIComponent('정문 앞  횡단보도')},37.566535,126.977969`);
  assert.equal(mapUrl({ lat: 37.5, lng: 127 }), `https://map.kakao.com/link/map/${encodeURIComponent('신고 위치')},37.5,127`);
  for (const loc of [null, undefined, { address: '주소만' }, { lat: 37.5, lng: null }, { lat: 91, lng: 0 }, { lat: Number.NaN, lng: 1 }]) assert.equal(mapUrl(loc), null);
});
function locationModule(location) {
  return load('services/location.ts', { 'expo-location': { Accuracy: { Balanced: 3 }, ...location } });
}
test('location: granted permission returns rounded coordinates within server range', async () => {
  const loc = locationModule({
    requestForegroundPermissionsAsync: async () => ({ granted: true }),
    getCurrentPositionAsync: async () => ({ coords: { latitude: 37.56653512345, longitude: 126.97796912345 } }),
  });
  assert.deepEqual({ ...(await loc.getCurrentCoords()) }, { lat: 37.566535, lng: 126.977969 });
  assert.equal(loc.toCoords(91, 0), null); assert.equal(loc.toCoords(0, -181), null);
  assert.equal(loc.toCoords(Number.NaN, 0), null); assert.equal(loc.toCoords('37', 127), null);
});
test('location: denied permission, errors and timeouts all fall back to no location', async () => {
  let asked = false;
  let loc = locationModule({ requestForegroundPermissionsAsync: async () => ({ granted: false }), getCurrentPositionAsync: async () => { asked = true; } });
  assert.equal(await loc.getCurrentCoords(), null); assert.equal(asked, false);
  loc = locationModule({ requestForegroundPermissionsAsync: async () => ({ granted: true }), getCurrentPositionAsync: async () => { throw new Error('unavailable'); } });
  assert.equal(await loc.getCurrentCoords(), null);
  loc = locationModule({ requestForegroundPermissionsAsync: async () => ({ granted: true }), getCurrentPositionAsync: () => new Promise(() => {}) });
  assert.equal(await loc.getCurrentCoords(20), null);
  assert.equal(await loc.settleWithin(new Promise(() => {}), 20), null);
  assert.equal(await loc.settleWithin(Promise.reject(new Error('x')), 20), null);
  assert.equal(await loc.settleWithin(null, 20), null);
  assert.deepEqual({ ...(await loc.settleWithin(Promise.resolve({ lat: 1, lng: 2 }), 1000)) }, { lat: 1, lng: 2 });
});
