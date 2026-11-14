import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { InspectionProvider } from '../services/inspection-context';
import { colors } from '../constants/theme';
export default function Layout() { return <InspectionProvider><StatusBar style="dark" /><Stack screenOptions={{ headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.bg }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.bg } }}><Stack.Screen name="index" options={{ title: 'TactileCheck' }} /><Stack.Screen name="inspection" options={{ title: '사진 등록' }} /><Stack.Screen name="result" options={{ title: '점검 결과' }} /></Stack></InspectionProvider>; }
