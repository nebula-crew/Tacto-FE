import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors as c } from '../constants/theme';
import type { CheckStatus } from '../types/inspection';

export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView style={s.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>{children}</ScrollView></SafeAreaView>;
}
export function Header({ action, onAction }: { action?: string; onAction?: () => void }) {
  return <View style={s.header}><View style={s.brandRow}><View accessibilityElementsHidden importantForAccessibility="no" style={s.logo}>{Array.from({ length: 9 }, (_, i) => <View key={i} style={s.logoDot} />)}</View><Text style={s.brand}>Tacto</Text></View>{action && <Pressable accessibilityRole="button" hitSlop={10} onPress={onAction} style={s.link}><Text style={s.linkText}>{action}</Text></Pressable>}</View>;
}
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[s.card, style]}>{children}</View>; }
export function Button({ title, onPress, secondary, disabled, loading, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, style, (disabled || pressed || loading) && { opacity: 0.55 }]}>{loading && <ActivityIndicator color={c.onGreen} />}<Text style={[s.buttonText, secondary && { color: c.ink }]}>{title}</Text></Pressable>;
}
export const labels: Record<CheckStatus, string> = { suspected: '오류 의심', normal: '정상 추정', hold: '판정 보류', not_applicable: '미적용' };
export function Badge({ status }: { status: CheckStatus }) { return <View style={[s.badge, status === 'suspected' && { backgroundColor: c.amberBg }]}><Text style={{ color: status === 'suspected' ? c.amber : c.greenInk, fontSize: 12, fontWeight: '600' }}>{labels[status]}</Text></View>; }
export function ErrorMessage({ message }: { message: string }) { return message ? <Text accessibilityRole="alert" style={s.error}>{message}</Text> : null; }
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg }, page: { flexGrow: 1, padding: 22, gap: 22, width: '100%', maxWidth: 540, alignSelf: 'center', paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 2 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  brandRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 9 },
  brand: { color: c.ink, fontSize: 25, lineHeight: 32, fontWeight: '700', letterSpacing: -0.7, includeFontPadding: false, textAlignVertical: 'center' }, logo: { width: 24, height: 24, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', gap: 3 }, logoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.greenInk },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 3 }, linkText: { color: c.muted, fontSize: 13 },
  eyebrow: { color: c.muted, fontSize: 12, letterSpacing: 0.5 }, title: { color: c.ink, fontSize: 30, fontWeight: '700', lineHeight: 42, letterSpacing: -1.1 }, text: { color: c.muted, fontSize: 14, lineHeight: 24 },
  card: { padding: 22, backgroundColor: c.paper, borderRadius: 22, gap: 16, boxShadow: '0px 5px 22px rgba(28, 53, 36, 0.05)' },
  heading: { color: c.ink, fontSize: 18, fontWeight: '600', lineHeight: 27, letterSpacing: -0.3 }, button: { minHeight: 56, padding: 16, backgroundColor: c.green, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  secondary: { backgroundColor: c.paper, borderWidth: 1, borderColor: c.line }, buttonText: { color: c.onGreen, fontWeight: '600', fontSize: 15 }, badge: { alignSelf: 'flex-start', backgroundColor: c.soft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7 },
  image: { width: '100%', height: 285, borderRadius: 18, backgroundColor: c.paper }, error: { color: '#9E382C', fontSize: 14, lineHeight: 23 }, divider: { height: 1, backgroundColor: c.line }, footer: { marginTop: 'auto', gap: 12 },
});
