import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen, Button, s } from '../components/ui';
import { useInspection } from '../services/inspection-context';
export default function Home() {
  const state = useInspection();
  return <Screen><Text style={s.eyebrow}>보행 환경 점검</Text><Text style={s.title}>안전한 길을 위한{ '\n' }작은 확인</Text><Text style={s.text}>점자블록과 주변 환경을 한 장에 담아 주세요.{ '\n' }설치 상태를 확인하고, 살펴볼 지점을 정리합니다.</Text><View style={s.card}><Text style={s.heading}>사진 한 장으로 시작하기</Text><Text style={s.text}>01  점자블록과 주변 동선 함께 담기{ '\n' }02  흔들림 없이 밝은 곳에서 촬영하기{ '\n' }03  결과 확인 후 현장에서 다시 살피기</Text><Button title="점검 시작" onPress={() => { state.setPhoto(null); state.setResult(null); state.setDemo(false); router.push('/inspection'); }} /></View><View style={s.divider} /><Text style={s.heading}>촬영 전에 확인해 주세요</Text><Text style={s.text}>블록을 너무 가까이 찍으면 연결 방향을 확인하기 어렵습니다. 횡단보도나 차도 등 주변 맥락이 보이도록 촬영해 주세요.</Text><Text style={s.text}>사진 기반 결과는 현장 확인을 돕는 참고 정보입니다. 최종 안전 판정은 현장 점검이 필요합니다.</Text></Screen>;
}
