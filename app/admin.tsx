import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Button, Card, ErrorMessage, Header, Screen, s } from '../components/ui';
import { colors as c } from '../constants/theme';
import {
  AdminAuthError, REPORT_STATUSES, REPORT_STATUS_LABELS, formatTime, getReport, listReports, loadToken, photoUrl, saveToken, updateReport,
  type ReportDetail, type ReportStatus, type ReportSummary,
} from '../services/admin-api';

// 관리 기관용 화면: 관리자 토큰으로 들어가 시민 신고 목록을 보고 처리 상태·메모를 남긴다.
export default function Admin() {
  const [token, setToken] = useState(loadToken()), [input, setInput] = useState('');
  const [rows, setRows] = useState<ReportSummary[] | null>(null), [onlyReported, setOnlyReported] = useState(true);
  const [detail, setDetail] = useState<ReportDetail | null>(null), [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState('');

  const fail = useCallback((e: unknown) => {
    if (e instanceof AdminAuthError) { saveToken(''); setToken(''); setRows(null); setDetail(null); }
    setError(e instanceof Error ? e.message : '요청을 처리하지 못했어요.');
  }, []);

  const refresh = useCallback(async (t: string, reported: boolean) => {
    setLoading(true); setError('');
    try { setRows(await listReports(t, reported)); } catch (e) { fail(e); } finally { setLoading(false); }
  }, [fail]);

  // 토큰이 생기거나 필터가 바뀌면 서버에서 목록을 다시 받는다 (외부 데이터 동기화라 effect에서 불러옴)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (token) void refresh(token, onlyReported); }, [token, onlyReported, refresh]);

  function login() {
    const t = input.trim();
    if (!t) { setError('관리자 토큰을 입력해 주세요.'); return; }
    saveToken(t); setToken(t); setInput('');
  }
  function logout() { saveToken(''); setToken(''); setRows(null); setDetail(null); setError(''); }

  async function open(id: string) {
    setLoading(true); setError(''); setSaved('');
    try { const d = await getReport(token, id); setDetail(d); setMemo(d.admin_memo ?? ''); } catch (e) { fail(e); } finally { setLoading(false); }
  }
  async function save(change: { status?: ReportStatus; admin_memo?: string }) {
    if (!detail || saving) return;
    setSaving(true); setError(''); setSaved('');
    try {
      const d = await updateReport(token, detail.inspection_id, change);
      setDetail(d); setMemo(d.admin_memo ?? '');
      setRows(prev => prev?.map(r => r.inspection_id === d.inspection_id ? { ...r, status: d.status } : r) ?? prev);
      setSaved(change.status ? `처리 상태를 '${REPORT_STATUS_LABELS[d.status]}'(으)로 바꿨어요.` : '메모를 저장했어요.');
    } catch (e) { fail(e); } finally { setSaving(false); }
  }

  if (!token) return <Screen><Header action="홈으로" onAction={() => router.replace('/home')} />
    <Text style={s.eyebrow}>관리 기관</Text><Text style={s.title}>신고 관리</Text>
    <Text style={s.text}>관리자 토큰으로 들어가 시민이 접수한 신고를 확인하고 처리 상태를 남길 수 있어요.</Text>
    <Card><Text style={s.heading}>관리자 토큰</Text>
      <TextInput accessibilityLabel="관리자 토큰" secureTextEntry autoCapitalize="none" autoCorrect={false} value={input} onChangeText={setInput} onSubmitEditing={login} placeholder="토큰 입력" placeholderTextColor={c.muted} style={inputStyle} />
      <Text style={[s.text, { fontSize: 12 }]}>토큰은 이 브라우저 탭을 닫으면 지워져요.</Text>
    </Card>
    <ErrorMessage message={error} /><Button title="들어가기" onPress={login} />
  </Screen>;

  if (detail) {
    const img = photoUrl(detail), d = detail.inspection;
    return <Screen><Header action="목록으로" onAction={() => { setDetail(null); setSaved(''); setError(''); }} />
      <View style={s.row}><Text style={s.eyebrow}>신고 상세 · {formatTime(detail.created_at)}</Text><Badge status={d.status} /></View>
      <Text style={s.title}>{detail.location?.address || '위치 미입력'}</Text>
      {!!detail.location?.memo && <Text style={s.text}>{detail.location.memo}</Text>}
      {img && <Card style={{ padding: 0, overflow: 'hidden' }}><Image source={{ uri: img }} accessibilityLabel="신고 사진" style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: c.line }} resizeMode="contain" /></Card>}
      <Card><Text style={s.heading}>처리 상태</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{REPORT_STATUSES.map(st => <Pressable key={st} accessibilityRole="button" accessibilityState={{ selected: detail.status === st, disabled: saving }} disabled={saving} onPress={() => void save({ status: st })}
          style={[chip, detail.status === st && chipOn]}><Text style={{ color: detail.status === st ? c.onGreen : c.ink, fontWeight: '600' }}>{REPORT_STATUS_LABELS[st]}</Text></Pressable>)}</View>
        <Text style={s.heading}>관리자 메모</Text>
        <TextInput accessibilityLabel="관리자 메모" multiline textAlignVertical="top" maxLength={1000} value={memo} onChangeText={setMemo} placeholder="현장 확인 결과, 조치 내용 등" placeholderTextColor={c.muted} editable={!saving} style={[inputStyle, { minHeight: 100 }]} />
        <Button title="메모 저장" secondary loading={saving} onPress={() => void save({ admin_memo: memo.trim() })} />
        {!!saved && <Text style={[s.text, { color: c.greenInk }]}>{saved}</Text>}
      </Card>
      <ErrorMessage message={error} />
      <Card><Text style={s.heading}>AI 판정</Text><Text style={s.text}>{d.summary}</Text>
        {d.checks.map((ch, i) => <View key={ch.code + i} style={{ gap: 4, paddingTop: 10, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
          <View style={s.row}><Badge status={ch.status} /><Text style={{ color: c.ink, fontWeight: '600', flexShrink: 1 }}>{ch.title}</Text></View>
          <Text style={s.text}>{ch.detail}</Text></View>)}
      </Card>
      <Text style={[s.text, { fontSize: 12 }]}>점검 번호: {detail.inspection_id}</Text>
    </Screen>;
  }

  return <Screen><Header action="나가기" onAction={logout} />
    <Text style={s.eyebrow}>관리 기관</Text><Text style={s.title}>신고 목록</Text>
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {[{ v: true, t: '신고 접수된 것만' }, { v: false, t: '전체 점검' }].map(o => <Pressable key={o.t} accessibilityRole="button" accessibilityState={{ selected: onlyReported === o.v }} onPress={() => setOnlyReported(o.v)} style={[chip, onlyReported === o.v && chipOn]}>
        <Text style={{ color: onlyReported === o.v ? c.onGreen : c.ink, fontWeight: '600' }}>{o.t}</Text></Pressable>)}
      <Pressable accessibilityRole="button" onPress={() => void refresh(token, onlyReported)} style={chip}><Text style={{ color: c.ink, fontWeight: '600' }}>새로고침</Text></Pressable>
    </View>
    <ErrorMessage message={error} />
    {loading && !rows && <Text style={s.text}>불러오는 중…</Text>}
    {rows && rows.length === 0 && <Card><Text style={s.text}>{onlyReported ? '아직 접수된 신고가 없어요.' : '점검 기록이 없어요.'}</Text></Card>}
    {rows?.map(r => <Pressable key={r.inspection_id} accessibilityRole="button" onPress={() => void open(r.inspection_id)} style={({ pressed }) => [s.card, { gap: 6 }, pressed && { opacity: 0.7 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <Text style={[s.heading, { flexShrink: 1 }]} numberOfLines={1}>{r.location?.address || '위치 미입력'}</Text>
        <Text style={{ color: r.status === 'received' ? c.amber : c.greenInk, fontWeight: '700' }}>{REPORT_STATUS_LABELS[r.status]}</Text>
      </View>
      <Text style={[s.text, { fontSize: 13 }]}>{formatTime(r.created_at)} · {r.codes.length ? `오류 의심 ${r.codes.length}건` : '오류 의심 없음'}</Text>
    </Pressable>)}
  </Screen>;
}

const inputStyle = { borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, fontSize: 16, color: c.ink, backgroundColor: c.paper };
const chip = { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper };
const chipOn = { backgroundColor: c.green, borderColor: c.green };
