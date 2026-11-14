import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ErrorMessage, Header, Screen, s } from '../components/ui';
import { OnboardingIllustration } from '../components/onboarding-illustration';
import { useInspection } from '../services/inspection-context';
import { colors as c } from '../constants/theme';
const slides = [
  { scene: 'path' as const, eyebrow: '길 위의 작은 불편을 발견하는 방법', title: '매일 걷는 길을\n조금 더 안전하게', body: '점자블록의 연결과 배치를 살펴보세요.\n사진 한 장으로 확인을 시작할 수 있어요.', label: '사진 한 장으로 시작' },
  { scene: 'capture' as const, eyebrow: '복잡한 준비 없이', title: '촬영하거나 고르면\n점검 준비 끝', body: '점자블록과 주변 길이 함께 보이도록 찍어 주세요. 갤러리 사진도 사용할 수 있어요.', label: '촬영 · 갤러리에서 선택' },
  { scene: 'report' as const, eyebrow: '확인에서 다음 행동까지', title: '결과를 이해하고\n필요한 곳에 알리기', body: '항목별 보고서로 확인할 곳을 살펴보세요. 오류가 의심되면 신고할 내용을 준비할 수 있어요.', label: '보고서와 신고 안내' },
];
export default function Onboarding() {
  const state = useInspection(); const [index, setIndex] = useState(0), [width, setWidth] = useState(0), [saving, setSaving] = useState(false);
  const list = useRef<FlatList<(typeof slides)[number]>>(null);
  useEffect(() => { if (width) list.current?.scrollToOffset({ offset: index * width, animated: false }); }, [width, index]);
  async function complete() {
    if (saving) return; setSaving(true);
    try { await state.completeIntro(); router.replace('/home'); } catch { /* The provider exposes a recoverable storage error. */ } finally { setSaving(false); }
  }
  function next(value: number) { setIndex(value); list.current?.scrollToOffset({ offset: value * width, animated: true }); }
  return <Screen><Header action="건너뛰기" onAction={() => void complete()} /><View onLayout={e => setWidth(e.nativeEvent.layout.width)}>{width > 0 && <FlatList ref={list} horizontal pagingEnabled showsHorizontalScrollIndicator={false} data={slides} keyExtractor={item => item.label} scrollEnabled={!saving} onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))} renderItem={({ item }) => <View style={{ width, padding: 2 }}><Card><Text style={s.eyebrow}>{item.eyebrow}</Text><Text style={s.title}>{item.title}</Text><Text style={s.text}>{item.body}</Text><OnboardingIllustration scene={item.scene} label={item.label} /></Card></View>} />}</View><View style={[s.footer, { alignItems: 'stretch' }]}><View style={{ flexDirection: 'row', justifyContent: 'center' }}>{slides.map((item, i) => <Pressable accessibilityRole="button" accessibilityLabel={`설명 ${i + 1} / 3`} accessibilityState={{ selected: index === i }} key={item.label} onPress={() => next(i)} disabled={saving} style={{ minWidth: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: index === i ? 23 : 7, height: 7, borderRadius: 8, backgroundColor: index === i ? c.green : '#D9E2DD' }} /></Pressable>)}</View><ErrorMessage message={state.preferencesError} /><Button title={index === 2 ? 'TactileCheck 시작하기' : '다음'} loading={saving} onPress={() => index === 2 ? void complete() : next(index + 1)} />{state.preferencesError && <Button title="이번만 건너뛰기" secondary onPress={() => { state.continueWithoutSaving(); router.replace('/home'); }} />}<Text style={[s.eyebrow, { textAlign: 'center' }]}>{index + 1} / 3 · 좌우로 넘겨보세요</Text></View></Screen>;
}
