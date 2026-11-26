import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, ErrorMessage, Header, s } from '../components/ui';
import { ActionIcon } from '../components/action-icon';
import { TipIcon } from '../components/tip-icon';
import { useInspection } from '../services/inspection-context';
import { usePhotoPicker } from '../services/use-photo-picker';
import { colors as c } from '../constants/theme';

export default function Home() {
  const state = useInspection(), picker = usePhotoPicker();
  const { height, width } = useWindowDimensions();
  const [noResultNotice, setNoResultNotice] = useState(false);
  const compact = height < 900 || width < 360;
  const short = height < 850;
  const tiny = height < 770;
  async function pick(camera: boolean) {
    const photo = await picker.pick(camera);
    // 카메라로 찍은 사진만 촬영 위치를 함께 받는다 (권한을 거부하면 위치 없이 진행).
    if (photo) { state.selectPhoto(photo, false, camera); router.push('/inspection'); }
  }
  return <SafeAreaView style={s.safe}><View style={[s.page, h.page, compact && h.compactPage, short && h.shortPage, tiny && h.tinyPage]}>
    <View style={[h.header, compact && h.compactHeader, short && h.shortHeader]}><Header action="이용 안내" onAction={() => router.push('/onboarding')} /></View>
    <View style={[h.intro, compact && h.compactIntro, short && h.shortIntro]}>
      <Text style={s.eyebrow}>한 장으로 살펴보는 보행 환경</Text>
      <Text style={[s.title, compact && h.compactTitle]}>오늘의 길,{ '\n' }함께 확인해 볼까요?</Text>
      <Text style={s.text}>점자블록과 주변 길을 한 장에 담아 주세요.</Text>
    </View>
    <View style={[h.actions, compact && h.compactActions, short && h.shortActions]}>
      {[{ title: '사진 촬영', detail: '지금 보고 있는 길 찍기', camera: true }, { title: '갤러리', detail: '저장된 사진 불러오기', camera: false }].map(action => <Pressable
        key={action.title} accessibilityRole="button" accessibilityState={{ disabled: picker.picking }} disabled={picker.picking}
        onPress={() => void pick(action.camera)}
        style={({ pressed }) => [s.card, h.actionCard, compact && h.compactActionCard, short && h.shortActionCard, (pressed || picker.picking) && h.pressed]}
      ><ActionIcon camera={action.camera} /><View style={h.actionCopy}><Text style={[s.heading, h.actionTitle, compact && h.compactActionTitle]}>{action.title}</Text><Text style={[h.actionDetail, compact && h.compactActionDetail]}>{action.detail}</Text></View></Pressable>)}
    </View>
    {(picker.error || picker.permissionDenied) && <View style={h.error}><ErrorMessage message={picker.error} />{picker.permissionDenied && <Button secondary title="권한 설정 열기" onPress={() => { void Linking.openSettings().catch(() => {}); }} />}</View>}
    <Card style={[h.tips, compact && h.compactTips, short && h.shortTips]}>
      <Text style={s.heading}>이렇게 찍으면 좋아요</Text>
      <View style={h.tipRow}><TipIcon /><Text style={[s.text, h.tipText]}>블록만 확대하지 말고 주변 동선과 연결부까지 함께 담아 주세요.</Text></View>
      <View style={h.tipRow}><TipIcon light /><Text style={[s.text, h.tipText]}>밝은 곳에서 흔들림 없이 촬영해 주세요.</Text></View>
    </Card>
    <Pressable accessibilityRole="button" onPress={() => state.result ? router.push('/result') : setNoResultNotice(true)} style={({ pressed }) => [h.resultButton, short && h.shortResultButton, pressed && h.pressed]}><Text style={h.resultText}>최근 검사 결과 살펴보기</Text></Pressable>
    {noResultNotice && !state.result && <Text accessibilityRole="alert" style={[s.eyebrow, h.noResultNotice]}>아직 점검 결과가 없어요. 사진을 촬영하거나 갤러리에서 골라 주세요.</Text>}
  </View></SafeAreaView>;
}

const h = StyleSheet.create({
  page: { flex: 1, flexGrow: 1, gap: 0, paddingBottom: 84 },
  compactPage: { paddingTop: 22, paddingBottom: 82 },
  shortPage: { paddingBottom: 82 },
  tinyPage: { paddingBottom: 22 },
  header: { marginBottom: 26 },
  compactHeader: { marginBottom: 28 },
  shortHeader: { marginBottom: 20 },
  intro: { gap: 12, marginBottom: 28 },
  compactIntro: { gap: 10, marginBottom: 24 },
  shortIntro: { gap: 8, marginBottom: 16 },
  compactTitle: { fontSize: 27, lineHeight: 36 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 22 },
  compactActions: { marginBottom: 24 },
  shortActions: { marginBottom: 16 },
  actionCard: { flex: 1, height: 166, padding: 20, gap: 14, justifyContent: 'center' },
  compactActionCard: { height: 151, padding: 16, gap: 10 },
  shortActionCard: { height: 132, padding: 12, gap: 8 },
  actionCopy: { gap: 4 },
  actionTitle: { fontSize: 18, lineHeight: 25 },
  compactActionTitle: { fontSize: 16, lineHeight: 23 },
  actionDetail: { color: c.muted, fontSize: 11, lineHeight: 16 },
  compactActionDetail: { fontSize: 10, lineHeight: 15 },
  tips: { minHeight: 212, marginBottom: 22, gap: 16, justifyContent: 'center' },
  compactTips: { minHeight: 181, padding: 18, gap: 14, marginBottom: 24 },
  shortTips: { minHeight: 166, padding: 16, gap: 12, marginBottom: 16 },
  tipRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  tipText: { flex: 1 },
  resultButton: { height: 56, marginTop: 20, borderWidth: 2, borderColor: '#7BE1B0', borderRadius: 14, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' },
  shortResultButton: { height: 52 },
  resultText: { color: c.ink, fontSize: 15, fontWeight: '700' },
  noResultNotice: { marginTop: 12 },
  error: { gap: 8, marginBottom: 14 },
  pressed: { opacity: 0.6 },
});
