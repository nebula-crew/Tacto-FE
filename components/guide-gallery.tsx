import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Badge, Card, s } from './ui';
import { GuideIllustration } from './installation-guide';
import { installationGuides, suspectedGuides } from '../constants/installation-guides';
import { colors as c } from '../constants/theme';

const groups = [
  { status: 'suspected' as const, title: '오류 의심 예시', entries: Object.entries(suspectedGuides).flatMap(([code, guides]) => guides.map(guide => ({ code, guide }))) },
  { status: 'normal' as const, title: '올바른 설치 예시', entries: Object.entries(installationGuides).filter(([code]) => !code.startsWith('H')).flatMap(([code, guides]) => guides.map(guide => ({ code, guide }))) },
  { status: 'hold' as const, title: '판정 보류 예시', entries: Object.entries(installationGuides).filter(([code]) => code.startsWith('H')).flatMap(([code, guides]) => guides.map(guide => ({ code, guide }))) },
];
export function GuideGallery() {
  const [filter, setFilter] = useState('all');
  const total = groups.reduce((sum, group) => sum + group.entries.length, 0);
  return <View style={{ gap: 22 }}>

    <Text style={s.eyebrow}>그림 모아보기 · {total}개</Text>
    <Text style={s.title}>케이스별 그림 확인</Text>
    <Text style={s.text}>결과 화면과 같은 그림이에요. 오류 예시, 개선 방향에 들어가는 올바른 설치 예시, 판정 보류 예시를 모두 확인할 수 있어요.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {[{ value: 'all', title: '전체', count: total }, ...groups.map(group => ({ value: group.status, title: group.title, count: group.entries.length }))].map(item => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: filter === item.value }} onPress={() => setFilter(item.value)} style={{ paddingHorizontal: 14, minHeight: 44, justifyContent: 'center', borderRadius: 16, backgroundColor: filter === item.value ? c.greenInk : c.paper }}>
        <Text style={{ color: filter === item.value ? c.paper : c.muted, fontSize: 13 }}>{item.title} {item.count}</Text>
      </Pressable>)}
    </View>
    {groups.filter(group => filter === 'all' || group.status === filter).map(group => <View key={group.status} style={{ gap: 16 }}>
      <Text style={s.heading}>{group.title} · {group.entries.length}개</Text>
      {group.entries.map(({ code, guide }) => <Card key={code + guide.title} style={{ padding: 16, gap: 12 }}>
        <View style={s.row}><Text style={{ color: c.greenInk, fontWeight: '600', fontSize: 13 }}>{code}</Text><Badge status={group.status} /></View>
        <Text style={s.heading}>{guide.title}</Text>
        <GuideIllustration guide={guide} status={group.status} />
        <Text style={s.text}>{guide.caption}</Text>
      </Card>)}
    </View>)}
    <Text style={[s.text, { fontSize: 12 }]}>올바른 설치 그림은 개선 방향의 참고 예시예요. 정상 추정 결과 화면에는 촬영한 사진만 표시돼요.</Text>
  </View>;
}
