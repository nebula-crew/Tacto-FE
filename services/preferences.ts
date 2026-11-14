import { Platform } from 'react-native';
const KEY = 'tactilecheck.onboarding.v1';
async function nativeFile() {
  const { File, Paths } = await import('expo-file-system');
  return new File(Paths.document, 'tactilecheck-onboarding-v1.json');
}
export async function readIntroDone(): Promise<boolean> {
  if (Platform.OS === 'web') return globalThis.localStorage.getItem(KEY) === 'true';
  const file = await nativeFile();
  return file.exists && (await file.text()).trim() === 'true';
}
export async function writeIntroDone(): Promise<void> {
  if (Platform.OS === 'web') { globalThis.localStorage.setItem(KEY, 'true'); return; }
  const file = await nativeFile();
  if (!file.exists) file.create();
  file.write('true');
}
