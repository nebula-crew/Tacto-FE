import { StyleSheet, View } from 'react-native';
import { colors as c } from '../constants/theme';

export function TipIcon({ light = false }: { light?: boolean }) {
  return <View accessible={false} style={t.badge}>{light ? <View style={t.sun} /> : <View style={t.check} />}</View>;
}

const t = StyleSheet.create({
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
  check: { width: 10, height: 6, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: c.greenInk, transform: [{ rotate: '-45deg' }], marginTop: -3 },
  sun: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: c.greenInk },
});
