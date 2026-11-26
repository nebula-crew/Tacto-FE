import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Share, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ErrorMessage, Header, Screen, s } from '../components/ui';
import { useInspection } from '../services/inspection-context';
import { submitReport } from '../services/api';
import { colors as c } from '../constants/theme';
export default function Report() {
  const { result, demo, coords } = useInspection();
  const [location, setLocation] = useState(''), [memo, setMemo] = useState('점자블록의 연결과 배치 확인을 요청합니다. 현장 점검이 필요합니다.'), [error, setError] = useState(''), [prepared, setPrepared] = useState(false), [sharing, setSharing] = useState(false), [submitting, setSubmitting] = useState(false), [submitted, setSubmitted] = useState(false);
  const eligible = result && (result.status === 'suspected' || result.checks.some(check => check.status === 'suspected'));
  if (!eligible) return <Screen><Header /><Text style={s.title}>신고할 점검 결과가 없어요</Text><Button title="홈으로" onPress={() => router.replace('/home')} /></Screen>;
  const draft = `${demo ? '[화면 체험용 예시 · 실제 분석 결과 아님]\n' : ''}[점자블록 현장 확인 요청]\n위치: ${location.trim()}\n내용: ${memo.trim()}\n점검 번호: ${result.id}\n참고: 사진 기반 참고 정보이며 현장 확인이 필요합니다.`;
  const edit = (set: (v: string) => void) => (value: string) => { set(value); setPrepared(false); setSubmitted(false); };
  function validate() { if (!location.trim() || !memo.trim()) { setError('발견 위치와 확인할 내용을 입력해 주세요.'); return false; } setError(''); return true; }
  async function share() { if (sharing) return; setSharing(true); setError(''); try { await Share.share({ message: draft }); } catch { setError('공유 창을 열지 못했어요. 잠시 후 다시 시도해 주세요.'); } finally { setSharing(false); } }
  async function submit() {
    if (submitting || !validate()) return;
    setSubmitting(true);
    try { await submitReport(result!.id, { address: location.trim(), memo: memo.trim(), ...(coords ?? {}) }); setSubmitted(true); }
    catch (e) { setError(e instanceof Error ? e.message : '신고를 접수하지 못했어요.'); }
    finally { setSubmitting(false); }
  }
  const intro = demo ? '예시 결과는 실제 접수되지 않아요. 신고 내용을 정리해 텍스트로 공유할 수 있어요.' : '위치와 상황을 적어 접수하면 담당 기관의 신고 목록에 사진·판정 결과와 함께 전달돼요.';
  return <Screen><Header action="보고서로" onAction={() => router.back()} /><Text style={s.eyebrow}>신고{demo ? ' · 예시 결과' : ''}</Text><Text style={s.title}>확인이 필요한 곳을{ '\n' }알려주세요</Text><Text style={s.text}>{intro}</Text><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Card><Text nativeID="report-location-label" style={s.heading}>발견 위치</Text><TextInput accessibilityLabel="발견 위치" placeholder="예: ○○역 2번 출구 앞 횡단보도" placeholderTextColor={c.muted} value={location} onChangeText={edit(setLocation)} maxLength={200} editable={!submitting} style={inputStyle} /><Text style={s.heading}>확인이 필요한 내용</Text><TextInput accessibilityLabel="확인이 필요한 내용" multiline textAlignVertical="top" value={memo} onChangeText={edit(setMemo)} maxLength={1000} editable={!submitting} style={[inputStyle, { minHeight: 130 }]} /><Text style={[s.text, { fontSize: 12 }]}>{coords ? '사진 촬영 때 받은 위치(위도·경도)가 신고와 함께 전달돼요. 담당자가 찾기 쉽게 장소 이름도 적어 주세요.' : '사진 촬영으로 점검하면 촬영 위치가 자동으로 함께 저장돼요. 갤러리 사진은 위치를 저장하지 않아요.'} 점검에 쓴 사진은 이미 서버에 저장되어 신고와 함께 전달돼요.</Text></Card></KeyboardAvoidingView><ErrorMessage message={error} />
    {demo
      ? <><Button title="신고 내용 확인하기" onPress={() => { if (validate()) setPrepared(true); }} />{prepared && <Card><Text style={s.heading}>신고 내용이 준비됐어요</Text><Text selectable style={s.text}>{draft}</Text><Text style={s.text}>예시 결과라 접수되지 않았어요.</Text><Button title="신고 초안 텍스트 공유" loading={sharing} onPress={() => void share()} /></Card>}</>
      : submitted
        ? <Card><Text style={s.heading}>신고가 접수됐어요</Text><Text selectable style={s.text}>{`점검 번호: ${result.id}\n위치: ${location.trim()}`}</Text><Text style={s.text}>담당자가 확인을 시작하기 전까지는 내용을 고쳐 다시 접수할 수 있어요.</Text><Button title="다른 사진 점검하기" onPress={() => router.dismissTo('/home')} /><Button title="신고 내용 텍스트 공유" secondary loading={sharing} onPress={() => void share()} /></Card>
        : <Button title="신고 접수하기" loading={submitting} onPress={() => void submit()} />}
  </Screen>;
}
const inputStyle = { borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, fontSize: 16, color: c.ink, backgroundColor: c.paper };
