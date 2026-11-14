import { useRef, useState } from 'react';
import * as Picker from 'expo-image-picker';
import * as Manipulator from 'expo-image-manipulator';
import type { Photo } from '../types/inspection';

export function usePhotoPicker() {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const lock = useRef(false);
  async function pick(camera: boolean): Promise<Photo | null> {
    if (lock.current) return null;
    lock.current = true; setPicking(true); setError(''); setPermissionDenied(false);
    try {
      if (camera && !(await Picker.requestCameraPermissionsAsync()).granted) {
        setPermissionDenied(true); throw new Error('카메라 접근을 허용해 주세요. 갤러리에서 선택할 수도 있어요.');
      }
      const options: Picker.ImagePickerOptions = { mediaTypes: ['images'], allowsMultipleSelection: false, quality: 0.9, exif: false };
      const result = camera ? await Picker.launchCameraAsync(options) : await Picker.launchImageLibraryAsync(options);
      if (result.canceled) return null;
      const converted = await Manipulator.manipulateAsync(result.assets[0].uri, [], { compress: 0.9, format: Manipulator.SaveFormat.JPEG });
      return { uri: converted.uri, name: `inspection-${Date.now()}.jpg`, mimeType: 'image/jpeg' };
    } catch (e) { setError(e instanceof Error ? e.message : '사진을 불러오지 못했어요.'); return null; }
    finally { lock.current = false; setPicking(false); }
  }
  return { pick, picking, error, permissionDenied };
}
