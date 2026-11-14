import { useRef, useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import * as Picker from 'expo-image-picker';
import * as Manipulator from 'expo-image-manipulator';
import { Button, Screen, s } from '../components/ui';
import { useInspection } from '../services/inspection-context';
import { createInspection } from '../services/api';
import { demoInspection } from '../constants/demo';
import type { InspectionStatus } from '../types/inspection';
export default function InspectionScreen() {
  const state = useInspection();
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const lock = useRef(false);
  usePreventRemove(busy, () => {});
  async function pick(camera: boolean) {
    if (lock.current) return;
    lock.current = true; setPicking(true); setError(''); setPermissionDenied(false);
    try {
      if (camera) {
        const permission = await Picker.requestCameraPermissionsAsync();
        if (!permission.granted) { setPermissionDenied(true); throw new Error('촬영하려면 카메라 접근을 허용해 주세요. 갤러리에서 사진을 선택할 수도 있습니다.'); }
      }
      const options: Picker.ImagePickerOptions = { mediaTypes: ['images'], allowsMultipleSelection: false, quality: 0.9, exif: false };
      const result = camera ? await Picker.launchCameraAsync(options) : await Picker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const image = result.assets[0];
      const converted = await Manipulator.manipulateAsync(image.uri, [], { compress: 0.9, format: Manipulator.SaveFormat.JPEG });
      state.setPhoto({ uri: converted.uri, name: `inspection-${Date.now()}.jpg`, mimeType: 'image/jpeg' });
      state.setResult(null); state.setDemo(false);
    } catch (e) { setError(e instanceof Error ? e.message : '사진을 불러오지 못했습니다.'); }
    finally { lock.current = false; setPicking(false); }
  }
  async function submit() {
    if (!state.photo || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { const result = await createInspection(state.photo); state.setResult(result); state.setDemo(false); setBusy(false); router.push('/result'); }
    catch (e) { setError(e instanceof Error ? e.message : '분석 요청에 실패했습니다.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function demo(status: InspectionStatus) { state.setResult(demoInspection(status)); state.setDemo(true); router.push('/result'); }
  return <Screen><Text style={s.eyebrow}>01 / 사진 등록</Text><Text style={s.title}>주변 길까지{ '\n' }함께 담아 주세요</Text><Text style={s.text}>한 번에 사진 한 장을 점검합니다. 선택한 사진은 분석 요청 시 서버로 전송됩니다.</Text>{state.photo ? <Image accessibilityLabel="선택한 점검 사진" source={{ uri: state.photo.uri }} style={s.image} resizeMode="contain" /> : <View style={[s.card, { minHeight: 190, justifyContent: 'center' }]}><Text style={s.heading}>아직 등록된 사진이 없습니다</Text><Text style={s.text}>점자블록의 연결부와 진행 방향이{ '\n' }잘 보이는 사진을 준비해 주세요.</Text></View>}<Button title="사진 촬영" onPress={() => void pick(true)} disabled={busy || picking} /><Button title={state.photo ? '다른 사진 선택' : '갤러리에서 선택'} secondary onPress={() => void pick(false)} disabled={busy || picking} />{error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}{permissionDenied && <Button title="권한 설정 열기" secondary onPress={() => { void Linking.openSettings().catch(() => setError('기기 설정에서 카메라 권한을 변경해 주세요.')); }} />}<Button title={busy ? '사진을 분석하고 있습니다…' : '이 사진으로 점검하기'} loading={busy} disabled={!state.photo || picking} onPress={() => void submit()} />{busy && <Text accessibilityLiveRegion="polite" style={s.text}>최대 60초 정도 기다려 주세요. 분석 중에는 이 화면을 유지해 주세요.</Text>}<View style={s.divider} /><Text style={s.heading}>결과 화면 미리보기</Text><Text style={s.text}>아래는 예시 데이터이며 사진을 전송하지 않습니다.</Text>{(['suspected', 'normal', 'hold'] as const).map((status, i) => <Button key={status} secondary disabled={busy || picking} title={['오류 의심 예시', '정상 추정 예시', '판정 보류 예시'][i]} onPress={() => demo(status)} />)}</Screen>;
}
