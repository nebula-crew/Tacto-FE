import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Screen } from '../components/ui';
import { useInspection } from '../services/inspection-context';
import { colors } from '../constants/theme';
export default function Index() {
  const { preferencesReady, introDone } = useInspection();
  if (!preferencesReady) return <Screen><ActivityIndicator color={colors.greenInk} accessibilityLabel="앱 준비 중" /></Screen>;
  return <Redirect href={introDone ? '/home' : '/onboarding'} />;
}
