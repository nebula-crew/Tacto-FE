import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import { View } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { InspectionProvider } from '../services/inspection-context';
import { colors } from '../constants/theme';
import '../global.css';
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg } };
export default function Layout() {
  return <View style={{ flex: 1, backgroundColor: colors.bg }}><ThemeProvider value={theme}><InspectionProvider><Head><title>tacto</title><meta name="theme-color" content={colors.bg} /></Head><StatusBar style="dark" /><NavigationBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}><Stack.Screen name="index" /><Stack.Screen name="onboarding" /><Stack.Screen name="home" /><Stack.Screen name="inspection" /><Stack.Screen name="loading" options={{ gestureEnabled: false }} /><Stack.Screen name="result" /><Stack.Screen name="report" /><Stack.Screen name="admin" /></Stack></InspectionProvider></ThemeProvider></View>;
}
