import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Share, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ErrorMessage, Header, Screen, s } from '../components/ui';
import { useInspection } from '../services/inspection-context';
import { colors as c } from '../constants/theme';
export default function Report() {
  const { result, demo } = useInspection();
  const [location, setLocation] = useState(''), [memo, setMemo] = useState('점자블록의 연결과 배치 확인을 요청합니다. 현장 점검이 필요합니다.'), [error, setError] = useState(''), [prepared, setPrepared] = useState(false), [sharing, setSharing] = useState(false);
  const eligible = result && (result.status === 'suspected' || result.checks.some(check => check.status === 'suspected'));
  if (!eligible) return <Screen><Header /><Text style={s.title}>신고할 점검 결과가 없어요</Text><Button title="홈으로" onPress={() => router.replace('/home')} /></Screen>;
  const draft = `${demo ? '[화면 체험용 예시 · 실제 분석 결과 아님]\n' : ''}[점자블록 현장 확인 요청]\n위치: ${location.trim()}\n내용: ${memo.trim()}\n점검 번호: ${result.id}\n참고: 사진 기반 참고 정보이며 현장 확인이 필요합니다.`;
  async function share() { if (sharing) return; setSharing(true); setError(''); try { await Share.share({ message: draft }); } catch { setError('공유 창을 열지 못했어요. 잠시 후 다시 시도해 주세요.'); } finally { setSharing(false); } }
  return <Screen><Header action="보고서로" onAction={() => router.back()} /><Text style={s.eyebrow}>신고 준비{demo ? ' · 예시 결과' : ''}</Text><Text style={s.title}>확인이 필요한 곳을{ '\n' }알려주세요</Text><Text style={s.text}>위치와 상황을 정리하는 화면이에요. 아직 신고 기관에 연결되지 않아 실제 접수는 되지 않아요.</Text><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Card><Text nativeID="report-location-label" style={s.heading}>발견 위치</Text><TextInput accessibilityLabel="발견 위치" placeholder="예: ○○역 2번 출구 앞 횡단보도" placeholderTextColor={c.muted} value={location} onChangeText={value => { setLocation(value); setPrepared(false); }} maxLength={250} style={inputStyle} /><Text style={s.heading}>확인이 필요한 내용</Text><TextInput accessibilityLabel="확인이 필요한 내용" multiline textAlignVertical="top" value={memo} onChangeText={value => { setMemo(value); setPrepared(false); }} maxLength={2000} style={[inputStyle, { minHeight: 130 }]} /><Text style={[s.text, { fontSize: 12 }]}>위치 정보는 자동 수집하지 않아요. 공유에는 텍스트만 포함되며 사진은 따로 첨부해야 해요.</Text></Card></KeyboardAvoidingView><ErrorMessage message={error} /><Button title="신고 내용 확인하기" onPress={() => { if (!location.trim() || !memo.trim()) { setError('발견 위치와 확인할 내용을 입력해 주세요.'); return; } setError(''); setPrepared(true); }} />{prepared && <Card><Text style={s.heading}>신고 내용이 준비됐어요</Text><Text selectable style={s.text}>{draft}</Text><Text style={s.text}>아직 접수되지 않았어요. 공유 후 실제 신고 서비스에서 접수를 완료해 주세요.</Text><Button title="신고 초안 텍스트 공유" loading={sharing} onPress={() => void share()} /></Card>}</Screen>;
}
const inputStyle = { borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 14, fontSize: 16, color: c.ink, backgroundColor: c.paper };
