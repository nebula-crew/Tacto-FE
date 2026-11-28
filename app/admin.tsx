import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { labels as checkLabels } from '../components/ui';
import {
  AdminAuthError, REPORT_STATUSES, REPORT_STATUS_LABELS, RULE_FAMILIES, RULE_NAMES, getAnalysisImage, getReport, listReports, loadToken, mapUrl, photoUrl, saveToken, updateReport,
  type ReportDetail, type ReportStatus, type ReportSummary, type RuleFinding,
} from '../services/admin-api';
import type { CheckStatus } from '../types/inspection';

// 관리 기관용 웹 콘솔: 관리자 토큰으로 들어가 시민 신고 목록을 보고 처리 상태·메모를 남긴다.
// 사용자 앱(모바일)과 달리 데스크톱 브라우저 기준: 상단 바 + 표 + 오른쪽 상세 패널. 좁은 화면에서는 상세가 목록을 대신한다.

type StatusFilter = ReportStatus | 'all';
// react-native-web은 Pressable 상태에 hovered를 넣어 준다 (RN 타입에는 없음)
type PressState = { pressed: boolean; hovered?: boolean };

export default function Admin() {
  const [token, setToken] = useState(loadToken());
  const [rows, setRows] = useState<ReportSummary[] | null>(null);
  const [onlyReported, setOnlyReported] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [listLoading, setListLoading] = useState(false), [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(''), [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const requested = useRef<string | null>(null);
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  // 상세 패널: 화면 절반 정도 (사진·분석 이미지를 크게 보려고). 최소 520, 최대 820
  const sideWidth = Math.round(Math.min(820, Math.max(520, width * 0.5)));

  const fail = useCallback((e: unknown) => {
    if (e instanceof AdminAuthError) { saveToken(''); setToken(''); setRows(null); setDetail(null); setSelectedId(null); }
    setError(e instanceof Error ? e.message : '요청을 처리하지 못했어요.');
  }, []);

  const refresh = useCallback(async (t: string, reported: boolean) => {
    setListLoading(true); setError('');
    try { setRows(await listReports(t, reported)); setUpdatedAt(new Date()); } catch (e) { fail(e); } finally { setListLoading(false); }
  }, [fail]);

  // 토큰이 생기거나 범위가 바뀌면 서버에서 목록을 다시 받는다 (외부 데이터 동기화라 effect에서 불러옴)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (token) void refresh(token, onlyReported); }, [token, onlyReported, refresh]);

  const close = useCallback(() => { requested.current = null; setSelectedId(null); setDetail(null); setDetailLoading(false); }, []);

  // 웹에서는 Esc로 상세 패널을 닫는다
  useEffect(() => {
    if (Platform.OS !== 'web' || !selectedId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, close]);

  async function open(id: string) {
    if (id === selectedId) return;
    requested.current = id; setSelectedId(id); setDetail(null); setDetailLoading(true); setError('');
    try {
      const d = await getReport(token, id);
      if (requested.current === id) setDetail(d); // 그 사이 다른 행을 눌렀으면 버린다
    } catch (e) { if (requested.current === id) fail(e); } finally { if (requested.current === id) setDetailLoading(false); }
  }

  function onSaved(d: ReportDetail) {
    setDetail(d);
    setRows(prev => prev?.map(r => r.inspection_id === d.inspection_id ? { ...r, status: d.status } : r) ?? prev);
  }

  function logout() { saveToken(''); setToken(''); setRows(null); close(); setError(''); }

  const counts = useMemo(() => {
    const n: Record<StatusFilter, number> = { all: rows?.length ?? 0, received: 0, reviewing: 0, resolved: 0, rejected: 0 };
    rows?.forEach(r => { n[r.status] += 1; });
    return n;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter(r => (statusFilter === 'all' || r.status === statusFilter)
      && (!q || (r.location?.address ?? '').toLowerCase().includes(q) || r.inspection_id.toLowerCase().includes(q)));
  }, [rows, statusFilter, query]);

  if (!token) return <Login error={error} onLogin={t => { setError(''); saveToken(t); setToken(t); }} onError={setError} />;

  const panel = selectedId ? <DetailPanel key={selectedId} token={token} detail={detail} loading={detailLoading} error={error} onClose={close} onSaved={onSaved} onFail={fail} /> : null;

  return <View style={a.root}>
    <Head><title>신고 관리 · Tacto 관리자</title></Head>
    <TopBar right={<>
      <GhostButton title="사용자 앱" onPress={() => router.replace('/home')} />
      <GhostButton title="로그아웃" onPress={logout} />
    </>} />
    <View style={a.body}>
      {(wide || !panel) && <ScrollView style={a.main} contentContainerStyle={[a.mainInner, wide && { paddingHorizontal: 32 }]}>
        <View style={a.pageHead}>
          <View style={{ gap: 4, flexShrink: 1 }}>
            <Text style={a.h1}>신고 관리</Text>
            <Text style={a.sub}>시민이 접수한 보도블록 점검 신고를 확인하고 처리 상태를 기록합니다.</Text>
          </View>
          <View style={a.row}>
            {!!updatedAt && <Text style={a.meta}>{fmtClock(updatedAt)} 업데이트</Text>}
            <OutlineButton title={listLoading ? '불러오는 중…' : '새로고침'} disabled={listLoading} onPress={() => void refresh(token, onlyReported)} />
          </View>
        </View>

        <View style={a.stats}>
          {(['all', ...REPORT_STATUSES] as StatusFilter[]).map(k => <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: statusFilter === k }}
            onPress={() => setStatusFilter(k)} style={[a.stat, statusFilter === k && a.statOn]}>
            <View style={a.row}>{k !== 'all' && <View style={[a.dot, { backgroundColor: STATUS_TONE[k].fg }]} />}<Text style={a.statLabel}>{k === 'all' ? '전체' : REPORT_STATUS_LABELS[k]}</Text></View>
            <Text style={a.statValue}>{rows ? counts[k] : '–'}</Text>
          </Pressable>)}
        </View>

        <View style={a.card}>
          <View style={a.toolbar}>
            <Segmented value={onlyReported ? 'reported' : 'all'} onChange={v => setOnlyReported(v === 'reported')}
              options={[{ value: 'reported', label: '신고 접수 건' }, { value: 'all', label: '전체 점검' }]} />
            <TextInput accessibilityLabel="주소 또는 점검 번호 검색" value={query} onChangeText={setQuery} placeholder="주소 또는 점검 번호 검색"
              placeholderTextColor={t.faint} style={[a.input, a.search]} />
          </View>
          {!!error && !selectedId && <Text accessibilityRole="alert" style={a.errorBar}>{error}</Text>}
          <ReportTable rows={visible} loaded={!!rows} loading={listLoading} compact={!wide || !!panel && width - sideWidth < 760} selectedId={selectedId} onOpen={id => void open(id)}
            empty={rows?.length ? '조건에 맞는 신고가 없습니다.' : onlyReported ? '아직 접수된 신고가 없습니다.' : '점검 기록이 없습니다.'} />
          {!!rows && <View style={a.tableFoot}><Text style={a.meta}>{visible.length}건 표시 · 최근 100건 기준</Text></View>}
        </View>
      </ScrollView>}
      {panel && <View style={wide ? [a.side, { width: sideWidth }] : a.sideFull}>{panel}</View>}
    </View>
  </View>;
}

// ── 로그인 ──────────────────────────────────────────────

function Login({ error, onLogin, onError }: { error: string; onLogin: (t: string) => void; onError: (m: string) => void }) {
  const [input, setInput] = useState('');
  const submit = () => { const v = input.trim(); if (!v) onError('관리자 토큰을 입력해 주세요.'); else onLogin(v); };
  return <View style={[a.root, { alignItems: 'center', justifyContent: 'center', padding: 16 }]}>
    <Head><title>로그인 · Tacto 관리자</title></Head>
    <View style={a.loginCard}>
      <Brand />
      <View style={{ gap: 6 }}>
        <Text style={a.h2}>관리자 로그인</Text>
        <Text style={a.sub}>발급받은 관리자 토큰을 입력하세요.</Text>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={a.label}>관리자 토큰</Text>
        <TextInput accessibilityLabel="관리자 토큰" secureTextEntry autoCapitalize="none" autoCorrect={false} autoFocus value={input} onChangeText={setInput}
          onSubmitEditing={submit} placeholder="토큰 입력" placeholderTextColor={t.faint} style={a.input} />
        <Text style={a.meta}>토큰은 이 브라우저 탭을 닫으면 지워집니다.</Text>
      </View>
      {!!error && <Text accessibilityRole="alert" style={a.errorBar}>{error}</Text>}
      <PrimaryButton title="로그인" onPress={submit} />
      <Pressable accessibilityRole="link" onPress={() => router.replace('/home')} style={{ alignSelf: 'center', cursor: 'pointer' }}><Text style={a.link}>사용자 앱으로 돌아가기</Text></Pressable>
    </View>
  </View>;
}

// ── 목록 표 ─────────────────────────────────────────────

const COLS = { time: 150, overall: 110, codes: 110, status: 110 };

function ReportTable({ rows, loaded, loading, compact, selectedId, onOpen, empty }: {
  rows: ReportSummary[]; loaded: boolean; loading: boolean; compact: boolean; selectedId: string | null; onOpen: (id: string) => void; empty: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  if (!loaded) return <View style={a.emptyBox}>{loading ? <ActivityIndicator color={t.muted} /> : <Text style={a.meta}>목록을 불러오지 못했습니다.</Text>}</View>;
  return <View>
    {!compact && <View style={[a.tr, a.thead]}>
      <Text style={[a.th, { width: COLS.time }]}>접수 시각</Text>
      <Text style={[a.th, { flex: 1 }]}>위치</Text>
      <Text style={[a.th, { width: COLS.overall }]}>AI 판정</Text>
      <Text style={[a.th, { width: COLS.codes }]}>의심 규칙</Text>
      <Text style={[a.th, { width: COLS.status }]}>처리 상태</Text>
    </View>}
    {rows.length === 0 && <View style={a.emptyBox}><Text style={a.meta}>{empty}</Text></View>}
    {rows.map(r => {
      const on = r.inspection_id === selectedId;
      const style = [a.tr, hover === r.inspection_id && { backgroundColor: t.hover }, on && a.trOn];
      const addr = <Text style={[a.td, { fontWeight: '500', color: r.location?.address ? t.ink : t.faint }]} numberOfLines={1}>{r.location?.address || (mapUrl(r.location) ? '주소 미입력 · 촬영 위치 있음' : '위치 미입력')}</Text>;
      return <Pressable key={r.inspection_id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onOpen(r.inspection_id)}
        onHoverIn={() => setHover(r.inspection_id)} onHoverOut={() => setHover(h => h === r.inspection_id ? null : h)} style={style}>
        {compact ? <View style={{ flex: 1, gap: 6 }}>
          <View style={[a.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}>{addr}</View><StatusPill status={r.status} /></View>
          <View style={a.row}><Text style={a.meta}>{fmtDateTime(r.created_at)}</Text><Text style={a.meta}>·</Text><CheckPill status={r.overall} /><Text style={[a.meta, a.mono]}>{r.codes.join(' · ')}</Text></View>
        </View> : <>
          <Text style={[a.td, a.mono, { width: COLS.time }]}>{fmtDateTime(r.created_at)}</Text>
          <View style={{ flex: 1, paddingRight: 16 }}>{addr}</View>
          <View style={{ width: COLS.overall }}><CheckPill status={r.overall} /></View>
          <Text style={[a.td, a.mono, { width: COLS.codes, color: r.codes.length ? t.danger : t.faint, fontWeight: '600' }]} numberOfLines={1}>{r.codes.length ? r.codes.join(' · ') : '–'}</Text>
          <View style={{ width: COLS.status }}><StatusPill status={r.status} /></View>
        </>}
      </Pressable>;
    })}
  </View>;
}

// ── 상세 패널 ───────────────────────────────────────────

function DetailPanel({ token, detail, loading, error, onClose, onSaved, onFail }: {
  token: string; detail: ReportDetail | null; loading: boolean; error: string; onClose: () => void; onSaved: (d: ReportDetail) => void; onFail: (e: unknown) => void;
}) {
  const [memo, setMemo] = useState<string | null>(null);
  const [saving, setSaving] = useState<'status' | 'memo' | null>(null), [notice, setNotice] = useState('');
  const memoValue = memo ?? detail?.admin_memo ?? '';
  const dirty = !!detail && memoValue.trim() !== (detail.admin_memo ?? '').trim();

  async function save(change: { status?: ReportStatus; admin_memo?: string }) {
    if (!detail || saving) return;
    setSaving(change.status ? 'status' : 'memo'); setNotice('');
    try {
      const d = await updateReport(token, detail.inspection_id, change);
      onSaved(d); if (change.admin_memo !== undefined) setMemo(null);
      setNotice(change.status ? `처리 상태를 '${REPORT_STATUS_LABELS[d.status]}'(으)로 변경했습니다.` : '메모를 저장했습니다.');
    } catch (e) { onFail(e); } finally { setSaving(null); }
  }

  const head = <View style={a.panelHead}>
    <Text style={a.panelTitle}>신고 상세</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="상세 닫기" onPress={onClose} style={({ hovered }: PressState) => [a.iconBtn, hovered && { backgroundColor: t.hover }]}>
      <Text style={{ fontSize: 18, lineHeight: 18, color: t.muted }}>✕</Text>
    </Pressable>
  </View>;

  if (!detail) return <View style={{ flex: 1 }}>{head}<View style={a.emptyBox}>
    {loading ? <ActivityIndicator color={t.muted} /> : <Text accessibilityRole="alert" style={a.errorText}>{error || '상세 정보를 불러오지 못했습니다.'}</Text>}
  </View></View>;

  const img = photoUrl(detail), ins = detail.inspection, map = mapUrl(detail.location);
  return <View style={{ flex: 1 }}>
    {head}
    <ScrollView contentContainerStyle={a.panelBody}>
      <View style={{ gap: 6 }}>
        <Text style={a.h2}>{detail.location?.address || (map ? '주소 미입력 · 촬영 위치 있음' : '위치 미입력')}</Text>
        {!!detail.location?.memo && <Text style={a.sub}>{detail.location.memo}</Text>}
        <View style={a.row}><StatusPill status={detail.status} /><CheckPill status={ins.status} /></View>
      </View>

      <View style={a.dl}>
        <Field label="접수 시각" value={fmtDateTime(detail.created_at) || '–'} />
        <Field label="최근 변경" value={fmtDateTime(detail.updated_at) || '–'} />
        <Field label="점검 번호" value={detail.inspection_id} mono />
        {detail.location?.lat != null && detail.location?.lng != null && <Field label="좌표" value={`${detail.location.lat.toFixed(5)}, ${detail.location.lng.toFixed(5)}`} mono />}
        {map && <View style={a.field}>
          <Text style={[a.meta, { width: 72 }]}>지도</Text>
          <Pressable accessibilityRole="link" accessibilityLabel="카카오맵에서 촬영 위치 보기" onPress={() => void openMap(map)} style={{ cursor: 'pointer' }}>
            <Text style={[a.link, { color: t.ink }]}>카카오맵에서 촬영 위치 보기 ↗</Text>
          </Pressable>
        </View>}
      </View>

      {img && <PhotoViewer key={detail.inspection_id} token={token} id={detail.inspection_id} photo={img} onAuthFail={onFail} />}

      <Section title="규칙별 판정">
        <RuleTable findings={detail.findings} scope={detail.scope} />
      </Section>

      <Section title="처리 상태">
        <Segmented value={detail.status} disabled={!!saving} onChange={v => void save({ status: v as ReportStatus })}
          options={REPORT_STATUSES.map(st => ({ value: st, label: REPORT_STATUS_LABELS[st] }))} />
      </Section>

      <Section title="관리자 메모">
        <TextInput accessibilityLabel="관리자 메모" multiline textAlignVertical="top" maxLength={1000} value={memoValue} onChangeText={setMemo}
          placeholder="현장 확인 결과, 조치 내용 등" placeholderTextColor={t.faint} editable={!saving} style={[a.input, { minHeight: 110, lineHeight: 21 }]} />
        <View style={[a.row, { justifyContent: 'space-between' }]}>
          <Text style={a.meta}>{memoValue.length}/1000</Text>
          <View style={a.row}>
            {dirty && <OutlineButton title="되돌리기" disabled={!!saving} onPress={() => setMemo(null)} />}
            <PrimaryButton small title={saving === 'memo' ? '저장 중…' : '메모 저장'} disabled={!dirty || !!saving} onPress={() => void save({ admin_memo: memoValue.trim() })} />
          </View>
        </View>
      </Section>

      {!!notice && <Text style={a.notice}>{notice}</Text>}
      {!!error && <Text accessibilityRole="alert" style={a.errorBar}>{error}</Text>}

      <Section title="시민에게 보인 결과 설명">
        <Text style={[a.td, { color: t.body, lineHeight: 21 }]}>{ins.summary}</Text>
        <View style={a.checks}>
          {ins.checks.map((ch, i) => <View key={ch.code + i} style={[a.check, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}>
            <View style={[a.row, { justifyContent: 'space-between' }]}>
              <Text style={[a.td, { fontWeight: '600', flexShrink: 1 }]}>{ch.title}</Text>
              <CheckPill status={ch.status} />
            </View>
            <Text style={[a.meta, { lineHeight: 19 }]}>{ch.detail}</Text>
          </View>)}
        </View>
      </Section>
    </ScrollView>
  </View>;
}

// ── 작은 부품 ───────────────────────────────────────────

function Brand() {
  return <View style={a.row}>
    <View style={a.logo}>{Array.from({ length: 9 }, (_, i) => <View key={i} style={a.logoDot} />)}</View>
    <Text style={a.brand}>Tacto</Text>
    <View style={a.tag}><Text style={a.tagText}>관리자</Text></View>
  </View>;
}

function TopBar({ right }: { right: ReactNode }) {
  return <View style={a.topbar}><Brand /><View style={a.row}>{right}</View></View>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={{ gap: 10 }}><Text style={a.sectionTitle}>{title}</Text>{children}</View>;
}

// 규칙별 판정: 서버 판정 원본 (규칙 코드·이름·판정·서버 메시지·근거 조항·개선 방향). 의심 → 보류 → 정상 순.
function RuleTable({ findings, scope }: { findings: RuleFinding[]; scope: Record<string, string> }) {
  const families = Object.entries(scope);
  return <View style={{ gap: 10 }}>
    {families.length > 0 && <View style={[a.row, { flexWrap: 'wrap', columnGap: 14, rowGap: 4 }]}>
      {families.map(([k, v]) => <Text key={k} style={a.meta}><Text style={[a.mono, { fontWeight: '600', color: t.ink }]}>{k}</Text> {RULE_FAMILIES[k] ?? ''}: {v}</Text>)}
    </View>}
    {findings.length === 0
      ? <Text style={a.meta}>판정된 규칙이 없습니다.</Text>
      : <View style={a.checks}>
        {findings.map((f, i) => <View key={f.code + i} style={[a.check, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}>
          <View style={[a.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
            <View style={[a.row, { gap: 8, flexShrink: 1 }]}>
              <View style={[a.codeChip, { backgroundColor: CHECK_TONE[f.verdict].bg }]}><Text style={[a.codeText, { color: CHECK_TONE[f.verdict].fg }]}>{f.code}</Text></View>
              <Text style={[a.td, { fontWeight: '600', flexShrink: 1 }]}>{RULE_NAMES[f.code] ?? f.code}{f.primary === false ? ' (참고)' : ''}</Text>
            </View>
            <CheckPill status={f.verdict} />
          </View>
          <Text style={[a.td, { color: t.body, fontSize: 13, lineHeight: 19 }]}>{f.message}</Text>
          {!!f.clause && <Text style={[a.meta, { lineHeight: 18 }]}>근거: {f.clause}</Text>}
          {!!f.suggestion && <Text style={[a.meta, { lineHeight: 18 }]}>개선 방향: {f.suggestion}</Text>}
        </View>)}
      </View>}
  </View>;
}

// 사진 보기: [원본 | AI 분석] 전환. 분석 이미지는 처음 누를 때 한 번만 받는다 (점검 건이 바뀌면 key로 새로 만듦).
const ANALYSIS_LEGEND: { color: string; label: string; dashed?: boolean }[] = [
  { color: '#E63CC8', label: '횡단보도' }, { color: '#1E8CE6', label: '차도' },
  { color: '#FFC814', label: '선형 블록' }, { color: '#FF641E', label: '점형 블록' },
  { color: '#3CE650', label: '선형 중심선' }, { color: '#00C8E6', label: '점형 범위', dashed: true },
  { color: '#EB2828', label: '연장선 → 차도', dashed: true }, { color: '#3CC850', label: '연장선 → 횡단보도 입구', dashed: true },
];

function PhotoViewer({ token, id, photo, onAuthFail }: { token: string; id: string; photo: string; onAuthFail: (e: unknown) => void }) {
  const [view, setView] = useState<'photo' | 'analysis'>('photo');
  const [analysis, setAnalysis] = useState<string | null | undefined>(undefined);  // undefined = 아직 안 받음, null = 없음
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [photoFailed, setPhotoFailed] = useState(false);
  async function show(next: string) {
    setView(next as 'photo' | 'analysis');
    if (next !== 'analysis' || analysis !== undefined || loading) return;
    setLoading(true); setError('');
    try { setAnalysis(await getAnalysisImage(token, id)); }
    catch (e) { if (e instanceof AdminAuthError) onAuthFail(e); else setError(e instanceof Error ? e.message : '분석 이미지를 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }
  return <View style={{ gap: 10 }}>
    <Segmented value={view} onChange={v => void show(v)} options={[{ value: 'photo', label: '원본 사진' }, { value: 'analysis', label: 'AI 분석' }]} />
    {view === 'photo'
      ? photoFailed
        ? <View style={[a.photo, { alignItems: 'center', justifyContent: 'center' }]}><Text style={[a.meta, { color: '#D1D5DB' }]}>저장소에서 사진을 찾지 못했습니다.</Text></View>
        : <Image source={{ uri: photo }} accessibilityLabel="신고 사진" resizeMode="contain" style={a.photo} onError={() => setPhotoFailed(true)} />
      : <>
        <View style={[a.photo, { alignItems: 'center', justifyContent: 'center' }]}>
          {loading ? <ActivityIndicator color="#FFFFFF" />
            : analysis ? <Image source={{ uri: analysis }} accessibilityLabel="AI 분석 이미지: 인식한 영역, 블록 경로, 판정 위치" resizeMode="contain" style={{ width: '100%', height: '100%' }} />
              : <Text style={[a.meta, { color: '#D1D5DB', textAlign: 'center', paddingHorizontal: 24 }]}>{error || '이 기능을 넣기 전에 접수된 점검이라 분석 이미지가 없습니다.'}</Text>}
        </View>
        {!!analysis && <View style={[a.row, { flexWrap: 'wrap', columnGap: 12, rowGap: 6 }]}>
          {ANALYSIS_LEGEND.map(l => <View key={l.label} style={[a.row, { gap: 5 }]}>
            <View style={l.dashed ? { width: 14, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: l.color } : { width: 10, height: 10, borderRadius: 2, backgroundColor: l.color }} />
            <Text style={a.meta}>{l.label}</Text>
          </View>)}
          <Text style={a.meta}>원 + 코드 = 판정 위치 (빨강 의심 · 초록 정상 · 회색 보류)</Text>
        </View>}
      </>}
  </View>;
}

// 지도는 새 탭으로 연다 (관리 화면 상태 유지). 웹이 아니면 기기 기본 브라우저·지도 앱으로.
async function openMap(url: string) {
  if (Platform.OS === 'web') { globalThis.open?.(url, '_blank', 'noopener,noreferrer'); return; }
  try { await Linking.openURL(url); } catch { /* 열 수 있는 앱이 없으면 무시 */ }
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <View style={a.field}><Text style={[a.meta, { width: 72 }]}>{label}</Text><Text selectable style={[a.td, { flex: 1, fontSize: 13 }, mono && a.mono]}>{value}</Text></View>;
}

function Segmented({ value, options, onChange, disabled }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; disabled?: boolean }) {
  return <View accessibilityRole="tablist" style={[a.seg, disabled && { opacity: 0.6 }]}>
    {options.map(o => <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: value === o.value, disabled }} disabled={disabled}
      onPress={() => { if (o.value !== value) onChange(o.value); }} style={[a.segItem, value === o.value && a.segOn]}>
      <Text style={[a.segText, value === o.value && { color: t.ink, fontWeight: '600' }]}>{o.label}</Text>
    </Pressable>)}
  </View>;
}

const STATUS_TONE: Record<ReportStatus, { fg: string; bg: string }> = {
  received: { fg: '#B45309', bg: '#FEF3C7' },
  reviewing: { fg: '#1D4ED8', bg: '#DBEAFE' },
  resolved: { fg: '#047857', bg: '#D1FAE5' },
  rejected: { fg: '#6B7280', bg: '#F3F4F6' },
};
const CHECK_TONE: Record<CheckStatus, { fg: string; bg: string }> = {
  suspected: { fg: '#B91C1C', bg: '#FEE2E2' },
  normal: { fg: '#047857', bg: '#ECFDF5' },
  hold: { fg: '#6B7280', bg: '#F3F4F6' },
  not_applicable: { fg: '#9CA3AF', bg: '#F9FAFB' },
};

function StatusPill({ status }: { status: ReportStatus }) {
  const tone = STATUS_TONE[status];
  return <View style={[a.pill, { backgroundColor: tone.bg }]}><View style={[a.dot, { backgroundColor: tone.fg }]} /><Text style={[a.pillText, { color: tone.fg }]}>{REPORT_STATUS_LABELS[status]}</Text></View>;
}
function CheckPill({ status }: { status: CheckStatus }) {
  const tone = CHECK_TONE[status];
  return <View style={[a.pill, { backgroundColor: tone.bg }]}><Text style={[a.pillText, { color: tone.fg }]}>{checkLabels[status]}</Text></View>;
}

function PrimaryButton({ title, onPress, disabled, small }: { title: string; onPress: () => void; disabled?: boolean; small?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed, hovered }: PressState) => [a.btn, a.btnPrimary, small && a.btnSmall, hovered && { backgroundColor: '#000' }, (pressed || disabled) && { opacity: disabled ? 0.35 : 0.8 }]}>
    <Text style={[a.btnText, { color: '#fff' }]}>{title}</Text>
  </Pressable>;
}
function OutlineButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed, hovered }: PressState) => [a.btn, a.btnSmall, a.btnOutline, hovered && { backgroundColor: t.hover }, (pressed || disabled) && { opacity: 0.6 }]}>
    <Text style={a.btnText}>{title}</Text>
  </Pressable>;
}
function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ hovered }: PressState) => [a.btn, a.btnSmall, hovered && { backgroundColor: t.hover }]}>
    <Text style={[a.btnText, { color: t.muted, fontWeight: '500' }]}>{title}</Text>
  </Pressable>;
}

// "2026.11.15 16:30"
function fmtDateTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())} ${fmtClock(d)}`;
}
function fmtClock(d: Date): string { return `${p2(d.getHours())}:${p2(d.getMinutes())}`; }
function p2(n: number): string { return String(n).padStart(2, '0'); }

// 관리자 콘솔 전용 팔레트 (사용자 앱보다 중립적인 회색 계열)
const t = { bg: '#F7F8FA', paper: '#FFFFFF', ink: '#111827', body: '#374151', muted: '#6B7280', faint: '#9CA3AF', line: '#E5E7EB', hover: '#F3F4F6', selected: '#F0FDF4', accent: '#19875B', danger: '#B91C1C' };
const font = Platform.select({ web: 'Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", sans-serif', default: undefined });
const mono = Platform.select({ web: 'ui-monospace, SFMono-Regular, Menlo, monospace', default: undefined });

const a = StyleSheet.create({
  root: { flex: 1, backgroundColor: t.bg, minHeight: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  topbar: { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.paper, borderBottomWidth: 1, borderBottomColor: t.line },
  logo: { width: 18, height: 18, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', gap: 2 }, logoDot: { width: 4.6, height: 4.6, borderRadius: 3, backgroundColor: t.accent },
  brand: { color: t.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.4, fontFamily: font },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: t.hover }, tagText: { fontSize: 11, fontWeight: '600', color: t.muted, fontFamily: font },
  body: { flex: 1, flexDirection: 'row', minHeight: 0 },
  main: { flex: 1 }, mainInner: { padding: 16, paddingVertical: 28, gap: 20, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  pageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' },
  h1: { fontSize: 22, fontWeight: '700', color: t.ink, letterSpacing: -0.5, fontFamily: font },
  h2: { fontSize: 17, fontWeight: '700', color: t.ink, letterSpacing: -0.3, lineHeight: 24, fontFamily: font },
  sub: { fontSize: 13, color: t.muted, lineHeight: 19, fontFamily: font },
  meta: { fontSize: 12, color: t.muted, fontFamily: font },
  label: { fontSize: 13, fontWeight: '600', color: t.body, fontFamily: font },
  link: { fontSize: 13, color: t.muted, textDecorationLine: 'underline', fontFamily: font },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexGrow: 1, flexBasis: 120, padding: 14, paddingHorizontal: 16, gap: 6, backgroundColor: t.paper, borderRadius: 10, borderWidth: 1, borderColor: t.line, cursor: 'pointer' },
  statOn: { borderColor: t.ink, boxShadow: `0 0 0 1px ${t.ink}` },
  statLabel: { fontSize: 12, color: t.muted, fontWeight: '500', fontFamily: font },
  statValue: { fontSize: 24, fontWeight: '700', color: t.ink, letterSpacing: -0.5, fontFamily: font, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: t.paper, borderRadius: 12, borderWidth: 1, borderColor: t.line, overflow: 'hidden' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.line, flexWrap: 'wrap' },
  input: { borderWidth: 1, borderColor: t.line, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12, fontSize: 14, color: t.ink, backgroundColor: t.paper, fontFamily: font },
  search: { flexGrow: 1, flexBasis: 220, maxWidth: 320 },
  seg: { flexDirection: 'row', padding: 3, gap: 2, backgroundColor: t.hover, borderRadius: 8, alignSelf: 'flex-start', flexWrap: 'wrap' },
  segItem: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, cursor: 'pointer' },
  segOn: { backgroundColor: t.paper, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' },
  segText: { fontSize: 13, color: t.muted, fontWeight: '500', fontFamily: font },
  thead: { backgroundColor: '#FAFAFB', cursor: 'auto', minHeight: 38 },
  th: { fontSize: 12, fontWeight: '600', color: t.muted, fontFamily: font },
  tr: { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: t.line, cursor: 'pointer' },
  trOn: { backgroundColor: t.selected, boxShadow: `inset 3px 0 0 ${t.accent}` },
  td: { fontSize: 14, color: t.ink, fontFamily: font },
  mono: { fontFamily: mono, fontSize: 12.5, color: t.body },
  tableFoot: { paddingVertical: 10, paddingHorizontal: 16 },
  emptyBox: { paddingVertical: 48, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '600', fontFamily: font },
  dot: { width: 6, height: 6, borderRadius: 3 },
  side: { width: 440, backgroundColor: t.paper, borderLeftWidth: 1, borderLeftColor: t.line },
  sideFull: { flex: 1, backgroundColor: t.paper },
  panelHead: { height: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: t.line },
  panelTitle: { fontSize: 14, fontWeight: '600', color: t.ink, fontFamily: font },
  panelBody: { padding: 20, gap: 24, paddingBottom: 40 },
  iconBtn: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  dl: { borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 14 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 10, backgroundColor: '#0B0F14' },  // 세로 사진이 많아 정사각형 틀
  sectionTitle: { fontSize: 12, fontWeight: '600', color: t.muted, letterSpacing: 0.3, fontFamily: font },
  checks: { borderWidth: 1, borderColor: t.line, borderRadius: 10 },
  check: { padding: 12, paddingHorizontal: 14, gap: 6 },
  codeChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  codeText: { fontFamily: mono, fontSize: 12.5, fontWeight: '700' },
  notice: { fontSize: 13, color: t.accent, fontFamily: font },
  errorText: { fontSize: 13, color: t.danger, fontFamily: font, textAlign: 'center', paddingHorizontal: 20 },
  errorBar: { fontSize: 13, color: t.danger, backgroundColor: '#FEF2F2', paddingVertical: 10, paddingHorizontal: 14, fontFamily: font },
  loginCard: { width: '100%', maxWidth: 380, padding: 28, gap: 20, backgroundColor: t.paper, borderRadius: 14, borderWidth: 1, borderColor: t.line, boxShadow: '0 8px 30px rgba(17,24,39,0.06)' },
  btn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  btnSmall: { minHeight: 34, paddingHorizontal: 12 },
  btnPrimary: { backgroundColor: t.ink },
  btnOutline: { borderWidth: 1, borderColor: t.line, backgroundColor: t.paper },
  btnText: { fontSize: 13, fontWeight: '600', color: t.ink, fontFamily: font },
});
