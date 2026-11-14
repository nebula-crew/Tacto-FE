import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import { Button, Card, Header, Screen, s } from '../components/ui';
import { useInspection } from '../services/inspection-context';
import { colors as c } from '../constants/theme';
const stages = [{ key: 'preparing', title: '사진을 준비하고 있어요', detail: '선택한 사진을 전송할 준비를 하고 있어요' }, { key: 'waiting', title: '서버의 분석 결과를 기다리고 있어요', detail: '점자블록과 주변 환경을 확인하는 데 시간이 걸릴 수 있어요' }, { key: 'report', title: '보고서를 정리하고 있어요', detail: '서버에서 받은 결과를 확인하고 있어요' }];
export default function Loading() {
  const state = useInspection();
  usePreventRemove(state.pending, () => {});
  useEffect(() => { if (!state.pending) router.replace(state.result ? '/result' : '/inspection'); }, [state.pending, state.result]);
  const current = stages.findIndex(item => item.key === state.stage);
  return <Screen><Header /><Text style={s.eyebrow}>점검 진행 중{state.demo ? ' · 예시 모드' : ''}</Text><Text style={s.title}>길 위의 단서를{ '\n' }살펴보고 있어요</Text><Card style={{ paddingVertical: 40, alignItems: 'center' }}><ActivityIndicator size="large" color={c.greenInk} /><Text accessibilityLiveRegion="polite" style={s.heading}>{stages[current].title}</Text><Text style={s.text}>{state.demo ? '실제 서버를 호출하지 않는 화면 체험이에요.' : '이 화면에서 잠시 기다려 주세요.'}</Text></Card><Card>{stages.map((item, i) => <View key={item.key} style={{ flexDirection: 'row', gap: 12 }}><Text style={{ color: i <= current ? c.greenInk : c.muted }}>{i < current ? '✓' : String(i + 1).padStart(2, '0')}</Text><View style={{ flex: 1, gap: 4 }}><Text style={{ color: i === current ? c.ink : c.muted, fontWeight: i === current ? '600' : '400', fontSize: 14 }}>{item.title}</Text>{i === current && <Text style={[s.text, { fontSize: 12 }]}>{item.detail}</Text>}</View></View>)}</Card><View style={s.footer}><Text style={[s.text, { fontSize: 12 }]}>{state.demo ? '예시 단계는 순서대로 진행돼요.' : '실제 서버 내부 진행률은 제공되지 않아요. 응답은 최대 60초 동안 기다려요.'}</Text><Button title="점검 취소" secondary onPress={state.cancel} /></View></Screen>;
}
