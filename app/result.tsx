import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Button, Card, Header, Screen, s } from '../components/ui';
import { PavingIllustration } from '../components/paving-illustration';
import { useInspection } from '../services/inspection-context';
import { colors as c } from '../constants/theme';

export default function ResultScreen() {
  const { result, photo, demo } = useInspection();
  const [expanded, setExpanded] = useState(false);
  if (!result) return <Screen><Header /><Text style={s.title}>표시할 결과가 없어요</Text><Text style={s.text}>앱을 다시 열면 이전 결과는 보관되지 않아요.</Text><Button title="홈으로" onPress={() => router.replace('/home')} /></Screen>;

  const reportable = result.status === 'suspected';
  const checks = result.checks.filter(check => check.status === result.status);
  const title = reportable ? '설치 상태를 확인해 주세요' : result.status === 'normal' ? '뚜렷한 오류가 보이지 않아요' : '사진을 다시 찍어주세요';

  return <Screen>
    <Header action="홈으로" onAction={() => router.dismissTo('/home')} />
    <View style={s.row}><Text style={s.eyebrow}>점검 보고서{demo ? ' · 예시' : ''}</Text><Badge status={result.status} /></View>
    <Text style={s.title}>{title}</Text>
    {result.status === 'hold' ? <Text style={s.text}>블록만 확대하지 말고 주변 동선과 연결부까지 함께 담아 주세요. 밝은 곳에서 흔들림 없이 촬영해 주세요.</Text> : <Text style={s.text}>{result.summary}</Text>}
    {demo && <Card><Text style={s.heading}>화면 확인용 예시</Text><Text style={s.text}>선택한 사진의 실제 분석 결과가 아니에요.</Text></Card>}
    {photo && !demo ? <Image source={{ uri: photo.uri }} style={s.image} resizeMode="contain" accessibilityLabel="점검에 사용한 사진" /> : <PavingIllustration label="점검 보고서 예시" />}
    <Card>
      <Text style={s.heading}>확인 내용</Text>
      {checks.length === 0 && <Text style={s.text}>{result.summary}</Text>}
      {checks.map((check, i) => {
        const lines = check.detail.split('\n').filter(Boolean);
        const description = lines.filter(line => !line.startsWith('개선 방향:') && !line.startsWith('근거:'));
        const suggestion = lines.find(line => line.startsWith('개선 방향:'))?.replace(/^개선 방향:\s*/, '');
        const evidence = lines.find(line => line.startsWith('근거:'))?.replace(/^근거:\s*/, '');
        const name = check.title.replace(/^판정 보류\s*·\s*/, '').replace(/\s*\((판정 보류|정상|보조)\)/g, '').trim();
        const displayName = /^[A-Z]\d+$/.test(name) ? lines[0] : name;
        return <View key={check.code + i} style={{ gap: 10, paddingVertical: 8 }}>
          <View style={s.row}><Badge status={check.status} /><Text style={{ color: c.ink, fontSize: 15, fontWeight: '600', flexShrink: 1 }}>{displayName}</Text></View>
          {expanded && <View style={{ gap: 16, paddingTop: 6 }}>
            {description.length > 0 && <View style={{ gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.line }}>
              <Text style={s.eyebrow}>자세한 설명</Text>
              {description.map((line, index) => {
                const labeled = line.startsWith('확인 기준:') || line.startsWith('사진에서 확인한 내용:');
                const label = line.startsWith('확인 기준:') ? '확인 기준' : '사진에서 확인한 내용';
                const content = labeled ? line.slice(line.indexOf(':') + 1).trim() : line;
                return <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.greenInk, marginTop: 9 }} />
                  <View style={{ flex: 1, gap: 3 }}>
                    {labeled && <Text style={{ color: c.greenInk, fontSize: 12, fontWeight: '600' }}>{label}</Text>}
                    <Text style={[s.text, { color: c.ink }]}>{content}</Text>
                  </View>
                </View>;
              })}
            </View>}
            {!!suggestion && <View style={{ gap: 5, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: c.line }}><Text style={s.eyebrow}>개선 방향</Text><Text style={[s.text, { color: c.ink }]}>{suggestion}</Text></View>}
            {!!evidence && <View style={{ backgroundColor: c.soft, borderRadius: 12, padding: 16, gap: 8 }}>
              <Text style={{ color: c.greenInk, fontWeight: '700', fontSize: 13 }}>근거</Text>
              <Text style={[s.text, { color: c.ink }]}>{evidence}</Text>
            </View>}
          </View>}
        </View>;
      })}
      {checks.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={s.link}><Text style={{ color: c.greenInk, fontWeight: '600' }}>{expanded ? '상세 보고서 접기 −' : '상세 보고서 보기 ＋'}</Text></Pressable>}
    </Card>
    {reportable && <View style={{ gap: 12 }}><Text style={s.heading}>확인이 필요한 곳을 알려주세요</Text><Text style={s.text}>잘못된 배치가 의심된다면 사진과 위치를 정리해 신고를 준비할 수 있어요.</Text></View>}
    <View style={[s.footer, { marginTop: 0 }]}>{reportable && <Button title="시설물 신고하기" onPress={() => router.push('/report')} />}<Button title="다른 사진 점검하기" secondary={reportable} onPress={() => router.dismissTo('/home')} /><Text style={[s.text, { fontSize: 12 }]}>사진 기반 참고 결과예요. 정상 추정도 설치 기준 충족이나 보행 안전을 보장하지 않아요.</Text></View>
  </Screen>;
}
