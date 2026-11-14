import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Card, ErrorMessage, Header, s } from '../components/ui';
import { OnboardingIllustration } from '../components/onboarding-illustration';
import { useInspection } from '../services/inspection-context';
import { colors as c } from '../constants/theme';
const slides = [
  { scene: 'path' as const, eyebrow: '길 위의 작은 불편을 발견하는 방법', title: '매일 걷는 길을\n조금 더 안전하게', body: '점자블록의 연결과 배치를 살펴보세요.\n사진 한 장으로 확인을 시작할 수 있어요.', label: '사진 한 장으로 시작' },
  { scene: 'capture' as const, eyebrow: '복잡한 준비 없이', title: '촬영하거나 고르면\n점검 준비 끝', body: '점자블록과 주변 길이 함께 보이도록 찍어 주세요. 갤러리 사진도 사용할 수 있어요.', label: '촬영 · 갤러리에서 선택' },
  { scene: 'report' as const, eyebrow: '확인에서 다음 행동까지', title: '결과를 이해하고\n필요한 곳에 알리기', body: '항목별 보고서로 확인할 곳을 살펴보세요. 오류가 의심되면 신고할 내용을 준비할 수 있어요.', label: '보고서와 신고 안내' },
];
export default function Onboarding() {
  const state = useInspection();
  const { height: screenHeight } = useWindowDimensions();
  const [index, setIndex] = useState(0), [width, setWidth] = useState(0), [height, setHeight] = useState(0), [saving, setSaving] = useState(false);
  const [artHeights, setArtHeights] = useState([180, 180, 180]);
  const list = useRef<ComponentRef<typeof ScrollView>>(null);
  const compact = height < 480 || width < 350;
  const illustrationHeight = Math.max(0, Math.min(236, ...artHeights.map(available => available - (compact ? 18 : 28))));
  useEffect(() => { if (width) list.current?.scrollTo({ x: index * width, animated: true }); }, [width, index]);
  async function complete() {
    if (saving) return;
    setSaving(true);
    try { await state.completeIntro(); router.replace('/home'); }
    catch { /* The provider exposes a recoverable storage error. */ }
    finally { setSaving(false); }
  }
  function go(value: number) { if (!saving) setIndex(Math.max(0, Math.min(slides.length - 1, value))); }
  const swipe = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !saving && Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => {
      // Ignore velocity: one deliberate swipe advances at most one card.
      if (Math.abs(g.dx) >= Math.max(72, width * 0.24)) go(index + (g.dx < 0 ? 1 : -1));
    },
  });
  return <SafeAreaView style={s.safe}>
    <View style={[s.page, o.page]}>
      <View style={o.header}><Header action="건너뛰기" onAction={() => void complete()} /></View>
      <View style={[o.pager, { height: Math.min(546, screenHeight * 0.65) }]} onLayout={e => {
        setWidth(e.nativeEvent.layout.width);
        setHeight(e.nativeEvent.layout.height);
      }} {...swipe.panHandlers}>
        {width > 0 && height > 0 && <ScrollView
          ref={list} style={StyleSheet.absoluteFill} horizontal scrollEnabled={false}
          showsHorizontalScrollIndicator={false} bounces={false} overScrollMode="never"
        >
          {slides.map((item, i) => <View key={item.scene} style={{ width, height, paddingHorizontal: 2, paddingTop: 2 }} accessibilityElementsHidden={i !== index} importantForAccessibility={i === index ? 'auto' : 'no-hide-descendants'}>
            <Card style={[o.card, compact && o.compactCard]}>
              <Text maxFontSizeMultiplier={1.3} style={[s.eyebrow, compact && o.compactEyebrow]}>{item.eyebrow}</Text>
              <Text maxFontSizeMultiplier={1.3} style={[s.title, o.title, compact && o.compactTitle]}>{item.title}</Text>
              <Text maxFontSizeMultiplier={1.3} style={[s.text, o.body, compact && o.compactBody]}>{item.body}</Text>
              <View style={[o.illustration, compact && o.compactIllustration]} onLayout={e => {
                const available = e.nativeEvent.layout.height;
                setArtHeights(previous => previous[i] === available ? previous : previous.map((value, position) => position === i ? available : value));
              }}>
                <OnboardingIllustration scene={item.scene} label={item.label} height={illustrationHeight} />
              </View>
            </Card>
          </View>)}
        </ScrollView>}
      </View>
      <View style={o.footer}>
        <View style={o.navigation}>
          <Pressable accessibilityRole="button" accessibilityLabel="이전 안내" accessibilityState={{ disabled: index === 0 || saving }} disabled={index === 0 || saving} hitSlop={4} onPress={() => go(index - 1)} style={[o.arrow, (index === 0 || saving) && o.disabled]}><View style={[o.chevron, o.left]} /></Pressable>
          <View style={o.dots}>{slides.map((item, i) => <Pressable
            accessibilityRole="button" accessibilityLabel={`설명 ${i + 1} / 3`}
            accessibilityState={{ selected: index === i }} key={item.scene}
            onPress={() => go(i)} disabled={saving} style={o.dotButton}
          ><View style={{ width: index === i ? 23 : 7, height: 7, borderRadius: 8, backgroundColor: index === i ? c.green : '#D9E2DD' }} /></Pressable>)}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={index === 2 ? 'tacto 시작하기' : '다음 안내'} accessibilityState={{ disabled: saving, busy: saving }} disabled={saving} hitSlop={4} onPress={() => index === 2 ? void complete() : go(index + 1)} style={[o.arrow, o.forward, saving && o.disabled]}><View style={o.chevron} /></Pressable>
        </View>
        {index === 2 && <View style={o.startButton}><Button title="시작하기" loading={saving} onPress={() => void complete()} /></View>}
        {index !== 2 && <Text maxFontSizeMultiplier={1.3} accessibilityLiveRegion="polite" style={[s.eyebrow, o.hint]}>{index + 1} / 3 · 좌우로 넘겨보세요</Text>}
      </View>
      {state.preferencesError && <View style={o.storageError}><ErrorMessage message={state.preferencesError} /><Button title="이번만 건너뛰기" secondary onPress={() => { state.continueWithoutSaving(); router.replace('/home'); }} /></View>}
    </View>
  </SafeAreaView>;
}

const o = StyleSheet.create({
  page: { flex: 1, minHeight: 0, gap: 0, paddingTop: 22, paddingBottom: 12 },
  header: { marginBottom: 37 },
  pager: { flexShrink: 1, minHeight: 0, marginBottom: 10 },
  card: { flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: 29, gap: 18 },
  compactCard: { padding: 16, gap: 10 },
  body: { marginTop: 25 },
  title: { fontSize: 28, lineHeight: 36 },
  compactTitle: { fontSize: 24, lineHeight: 31 },
  compactBody: { fontSize: 13, lineHeight: 21, marginTop: 8 },
  compactEyebrow: { fontSize: 11 },
  illustration: { flex: 1, minHeight: 0, justifyContent: 'flex-end', paddingBottom: 28, overflow: 'hidden' },
  compactIllustration: { paddingBottom: 18 },
  footer: { height: 108, flexShrink: 0, position: 'relative' },
  navigation: { position: 'absolute', top: 0, left: 0, right: 0, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  startButton: { position: 'absolute', top: 52, left: 0, right: 0 },
  storageError: { gap: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center' },
  dotButton: { minWidth: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' },
  forward: { backgroundColor: c.green },
  chevron: { width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: c.greenInk, transform: [{ rotate: '45deg' }], marginLeft: -3 },
  left: { transform: [{ rotate: '-135deg' }], marginLeft: 4 },
  disabled: { opacity: 0.3 },
  hint: { position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' },
});
