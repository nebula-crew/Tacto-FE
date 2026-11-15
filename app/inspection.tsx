import { useState } from 'react';
import { Image, Linking, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, ErrorMessage, Header, Screen, s, labels } from '../components/ui';
import { PavingIllustration } from '../components/paving-illustration';
import { useInspection } from '../services/inspection-context';
import { usePhotoPicker } from '../services/use-photo-picker';
import type { InspectionStatus } from '../types/inspection';
import { colors as c } from '../constants/theme';

export default function InspectionScreen() {
  const state = useInspection(), picker = usePhotoPicker();
  const [demoStatus, setDemoStatus] = useState<InspectionStatus>('suspected');
  const { height, width } = useWindowDimensions();
  const compact = height < 820 || width < 360;
  const short = height < 700;
  async function change() { const photo = await picker.pick(false); if (photo) state.selectPhoto(photo); }
  function start() { state.start(demoStatus); router.push('/loading'); }
  if (!state.photo && !state.demo) return <Screen><Header /><Text style={s.title}>먼저 사진을 골라 주세요</Text><Button title="홈으로" onPress={() => router.replace('/home')} /></Screen>;

  if (state.photo) return <SafeAreaView style={s.safe}><View style={i.page}>
    <View style={i.header}><Header action="이전" onAction={() => router.replace('/home')} /></View>
    <View style={[i.intro, compact && i.compactIntro]}>
      <Text style={s.eyebrow}>사진 확인</Text>
      <Text style={[s.title, i.title, compact && i.compactTitle]}>이 사진으로 점검할까요?</Text>
      <Text style={[s.text, i.description]}>주변 길과 블록의 연결이 잘 보이는지 확인해 주세요.</Text>
    </View>
    <Image accessibilityLabel="선택한 점검 사진" source={{ uri: state.photo.uri }} style={[i.photo, compact && i.compactPhoto, short && i.shortPhoto]} resizeMode="contain" />
    <ErrorMessage message={picker.error || state.error} />
    {picker.permissionDenied && <Button title="권한 설정 열기" secondary style={i.button} onPress={() => { void Linking.openSettings().catch(() => {}); }} />}
    <View style={[i.footer, compact && i.compactFooter]}>
      <Button title="점검 시작하기" disabled={picker.picking || state.pending} style={i.button} onPress={start} />
      <Button title="다른 사진 선택" secondary disabled={picker.picking || state.pending} style={i.button} onPress={() => void change()} />
    </View>
  </View></SafeAreaView>;

  return <Screen><Header action="이전" onAction={() => router.replace('/home')} /><Text style={s.eyebrow}>사진 확인 · 예시 모드</Text><Text style={[s.title, i.title]}>이 사진으로 점검할까요?</Text><Text style={s.text}>주변 길과 블록의 연결이 잘 보이는지 확인해 주세요.</Text><PavingIllustration label="" /><Text style={s.eyebrow}>사진 1장 · 실제 분석이 아닌 예시입니다</Text><Card><Text style={s.heading}>결과 화면 미리보기</Text>{(['suspected', 'normal', 'hold'] as const).map(status => <Button key={status} title={`${demoStatus === status ? '✓ ' : ''}${labels[status]}`} secondary={demoStatus !== status} onPress={() => setDemoStatus(status)} />)}</Card><ErrorMessage message={picker.error || state.error} /><View style={s.footer}><Text style={s.text}>분석 결과는 현장 확인을 돕는 참고 정보예요.</Text><Button title="예시 점검 시작하기" disabled={picker.picking || state.pending} onPress={start} /><Button title="다른 사진 선택" secondary disabled={picker.picking || state.pending} onPress={() => void change()} /></View></Screen>;
}

const i = StyleSheet.create({
  page: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 22 },
  header: { marginBottom: 12 },
  intro: { gap: 6, marginBottom: 24 },
  compactIntro: { gap: 4, marginBottom: 18 },
  title: { fontSize: 24, lineHeight: 34 },
  compactTitle: { fontSize: 21, lineHeight: 30 },
  description: { lineHeight: 21 },
  photo: { flex: 1, minHeight: 120, width: '100%', borderRadius: 18, backgroundColor: c.paper, marginBottom: 24 },
  compactPhoto: { minHeight: 100, marginBottom: 20 },
  shortPhoto: { minHeight: 80, marginBottom: 16 },
  footer: { gap: 18, marginTop: 'auto' },
  compactFooter: { gap: 16 },
  button: { minHeight: 50, padding: 12 },
});
