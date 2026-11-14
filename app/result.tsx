import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Button, Screen, s } from '../components/ui';
import { useInspection } from '../services/inspection-context';
export default function ResultScreen() {
  const { result, photo, demo } = useInspection();
  if (!result) return <Screen><Text style={s.title}>표시할 결과가 없습니다</Text><Text style={s.text}>사진 등록 후 점검을 요청해 주세요. 앱을 다시 열면 이전 결과는 보관되지 않습니다.</Text><Button title="사진 등록하기" onPress={() => router.replace('/inspection')} /></Screen>;
  return <Screen><Text style={s.eyebrow}>02 / 점검 결과</Text>{demo && <View style={s.card}><Text style={s.heading}>화면 확인용 예시</Text><Text style={s.text}>선택한 사진의 분석 결과가 아닙니다.</Text></View>}<Badge status={result.status} /><Text style={s.title}>{result.status === 'suspected' ? '다시 살펴볼 곳이 있어요' : result.status === 'normal' ? '뚜렷한 오류가 보이지 않아요' : '추가 확인이 필요해요'}</Text><Text style={s.text}>{result.summary}</Text>{photo && !demo && <Image source={{ uri: photo.uri }} style={s.image} resizeMode="contain" accessibilityLabel="점검에 사용한 사진" />}<Text style={s.heading}>항목별 확인 내용</Text>{result.checks.length === 0 && <Text style={s.text}>서버에서 전달된 세부 항목이 없습니다.</Text>}{result.checks.map((check, index) => <View key={`${check.code}-${index}`} style={s.card}><Text style={s.eyebrow}>{check.code}</Text><Text style={s.heading}>{check.title}</Text><Badge status={check.status} /><Text style={s.text}>{check.detail}</Text></View>)}<Text style={s.text}>한 장의 사진으로 확인할 수 있는 범위에는 한계가 있습니다. 정상 추정도 설치 기준 충족이나 보행 안전을 보장하지 않습니다.</Text><Button title="다른 사진 점검하기" onPress={() => router.replace('/inspection')} /><Button title="홈으로" secondary onPress={() => router.dismissTo('/')} /></Screen>;
}
