import { useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ErrorMessage, Header, Screen, s, labels } from '../components/ui';
import { PavingIllustration } from '../components/paving-illustration';
import { useInspection } from '../services/inspection-context';
import { usePhotoPicker } from '../services/use-photo-picker';
import type { InspectionStatus } from '../types/inspection';
export default function InspectionScreen() {
  const state = useInspection(), picker = usePhotoPicker(); const [demoStatus, setDemoStatus] = useState<InspectionStatus>('suspected');
  async function change() { const photo = await picker.pick(false); if (photo) state.selectPhoto(photo); }
  if (!state.photo && !state.demo) return <Screen><Header /><Text style={s.title}>먼저 사진을 골라 주세요</Text><Button title="홈으로" onPress={() => router.replace('/home')} /></Screen>;
  return <Screen><Header action="이전" onAction={() => router.replace('/home')} /><Text style={s.eyebrow}>사진 확인{state.demo ? ' · 예시 모드' : ''}</Text><Text style={s.title}>이 사진으로{ '\n' }점검할까요?</Text><Text style={s.text}>주변 길과 블록의 연결이 잘 보이는지 확인해 주세요.</Text>{state.photo ? <Image accessibilityLabel="선택한 점검 사진" source={{ uri: state.photo.uri }} style={s.image} resizeMode="contain" /> : <PavingIllustration label="화면 체험용 그림" />}<Text style={s.eyebrow}>사진 1장{state.demo ? ' · 실제 분석이 아닌 예시입니다' : ' · 분석 요청 시 서버로 전송됩니다'}</Text>{state.demo && <Card><Text style={s.heading}>결과 화면 미리보기</Text>{(['suspected', 'normal', 'hold'] as const).map(status => <Button key={status} title={`${demoStatus === status ? '✓ ' : ''}${labels[status]}`} secondary={demoStatus !== status} onPress={() => setDemoStatus(status)} />)}</Card>}<ErrorMessage message={picker.error || state.error} />{picker.permissionDenied && <Button title="권한 설정 열기" secondary onPress={() => { void Linking.openSettings().catch(() => {}); }} />}<View style={s.footer}><Text style={s.text}>분석 결과는 현장 확인을 돕는 참고 정보예요.</Text><Button title={state.demo ? '예시 점검 시작하기' : '점검 시작하기'} disabled={picker.picking || state.pending} onPress={() => { state.start(demoStatus); router.push('/loading'); }} /><Button title="다른 사진 선택" secondary disabled={picker.picking || state.pending} onPress={() => void change()} /></View></Screen>;
}
