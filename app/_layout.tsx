import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { InspectionProvider } from '../services/inspection-context';
import { colors } from '../constants/theme';
export default function Layout() {
  return <InspectionProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}><Stack.Screen name="index" /><Stack.Screen name="onboarding" /><Stack.Screen name="home" /><Stack.Screen name="inspection" /><Stack.Screen name="loading" options={{ gestureEnabled: false }} /><Stack.Screen name="result" /><Stack.Screen name="report" /></Stack></InspectionProvider>;
}
