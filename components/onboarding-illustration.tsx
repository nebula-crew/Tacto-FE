import { StyleSheet, View } from 'react-native';
import { colors as c } from '../constants/theme';

type Scene = 'path' | 'capture' | 'report';
const descriptions: Record<Scene, string> = {
  path: '주변 보도와 함께 이어진 노란 점자블록',
  capture: '점자블록과 주변 길을 촬영하는 스마트폰',
  report: '항목별 확인 내용과 알림 표시가 있는 점검 보고서',
};

function Tile({ dots = false }: { dots?: boolean }) {
  return <View style={a.tile}>{Array.from({ length: dots ? 9 : 3 }, (_, i) => <View key={i} style={dots ? a.dot : a.ridge} />)}</View>;
}

export function OnboardingIllustration({ scene, label, height = 230 }: { scene: Scene; label: string; height?: number }) {
  const scale = Math.max(0, Math.min(1, (height - 12) / 190));
  return <View accessible accessibilityRole="image" accessibilityLabel={`${descriptions[scene]} · ${label}`} style={[a.hero, { height }]}>
    <View style={a.halo} />
    <View style={[a.stage, { transform: [{ scale }] }]}>
      {scene === 'path' && <View style={a.path}>
        <View style={a.pavement}><View style={a.paver} /><Tile /><View style={a.paver} /><View style={a.paver} /><Tile dots /><View style={a.paver} /><View style={a.paver} /><Tile /><View style={a.paver} /></View>
        <View style={a.markerShadow} />
        <View style={a.pathMarker}><View style={a.markerBody}><View style={a.markerDot} /></View><View style={a.markerTip} /></View>
      </View>}
      {scene === 'capture' && <View style={a.phoneScene}>
        <View style={a.phone}><View style={a.speaker} /><View style={a.viewfinder}>
          <View style={a.miniPath}><Tile /><Tile dots /></View>
          <View style={[a.corner, a.topLeft]} /><View style={[a.corner, a.topRight]} /><View style={[a.corner, a.bottomLeft]} /><View style={[a.corner, a.bottomRight]} />
        </View><View style={a.shutter}><View style={a.shutterInner} /></View></View>
        <View style={a.gallery}><View style={a.sun} /><View style={a.mountain} /></View>
      </View>}
      {scene === 'report' && <View style={a.reportScene}>
        <View style={a.report}><View style={a.clip} /><View style={a.reportHeading} />
          {[0, 1, 2].map(i => <View key={i} style={a.reportRow}><View style={[a.status, i === 2 && a.statusAmber]}>{i === 2 ? <View style={a.alertStroke} /> : <View style={a.check} />}</View><View style={a.lines}><View style={a.line} /><View style={[a.line, a.shortLine]} /></View></View>)}
        </View>
        <View style={a.bubble}><View style={a.bubbleLine} /><View style={[a.bubbleLine, { width: 18 }]} /><View style={a.bubbleTail} /></View>
      </View>}
    </View>
  </View>;
}

const a = StyleSheet.create({
  hero: { borderRadius: 19, backgroundColor: '#F3F8F5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 182, height: 182, borderRadius: 100, backgroundColor: c.paper },
  stage: { width: 230, height: 174, alignItems: 'center', justifyContent: 'center' },
  path: { width: 142, height: 142 },
  pavement: { width: 142, flexDirection: 'row', flexWrap: 'wrap', gap: 5, transform: [{ rotate: '-12deg' }] },
  paver: { width: 44, height: 44, backgroundColor: '#E4E8E6', borderRadius: 4 },
  tile: { width: 44, height: 44, borderRadius: 4, backgroundColor: '#E4BF56', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 6, padding: 4 },
  ridge: { width: 5, height: 34, borderRadius: 3, backgroundColor: '#B28B30' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B28B30' },
  // Float eight pixels above the center while the shadow marks the exact target.
  markerShadow: { position: 'absolute', left: 61, top: 68, width: 20, height: 6, borderRadius: 10, backgroundColor: 'rgba(25, 135, 91, 0.18)' },
  pathMarker: { position: 'absolute', left: 56, top: 25, width: 30, height: 38, alignItems: 'center' },
  markerBody: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.greenInk, alignItems: 'center', justifyContent: 'center' },
  markerTip: { position: 'absolute', bottom: 0, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 15, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: c.greenInk },
  markerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.paper },
  phoneScene: { width: 166, height: 174, alignItems: 'center' },
  phone: { width: 98, height: 172, borderRadius: 19, backgroundColor: c.greenInk, padding: 7, paddingTop: 17, paddingBottom: 28 },
  speaker: { position: 'absolute', top: 7, left: 37, width: 24, height: 3, borderRadius: 2, backgroundColor: '#B8ECD3' },
  shutter: { position: 'absolute', bottom: 6, left: 39, width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#B8ECD3', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.paper },
  viewfinder: { flex: 1, borderRadius: 9, backgroundColor: '#EAF1ED', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  miniPath: { gap: 3, transform: [{ rotate: '-12deg' }, { scale: 0.7 }] },
  corner: { position: 'absolute', width: 16, height: 16, borderColor: c.greenInk },
  topLeft: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2 },
  gallery: { position: 'absolute', bottom: 0, right: 0, width: 59, height: 51, borderRadius: 10, borderWidth: 4, borderColor: c.paper, backgroundColor: '#D8EFE2', overflow: 'hidden', transform: [{ rotate: '9deg' }] },
  sun: { position: 'absolute', width: 9, height: 9, borderRadius: 5, top: 7, right: 8, backgroundColor: '#D8AF43' },
  mountain: { position: 'absolute', width: 38, height: 38, borderRadius: 5, bottom: -19, left: 2, backgroundColor: c.greenInk, transform: [{ rotate: '45deg' }] },
  reportScene: { width: 175, height: 160 },
  report: { width: 124, height: 151, left: 13, top: 5, borderRadius: 13, borderWidth: 2, borderColor: '#CDDFD4', backgroundColor: c.paper, padding: 16, paddingTop: 25, transform: [{ rotate: '-7deg' }] },
  clip: { position: 'absolute', width: 46, height: 15, borderRadius: 5, backgroundColor: c.greenInk, top: -7, left: 37 },
  reportHeading: { width: 51, height: 6, borderRadius: 3, backgroundColor: c.greenInk, marginBottom: 16 },
  reportRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 13 },
  status: { width: 20, height: 20, borderRadius: 6, backgroundColor: '#E1F5EA', alignItems: 'center', justifyContent: 'center' },
  statusAmber: { backgroundColor: '#FFF1DC' },
  check: { width: 9, height: 5, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: c.greenInk, transform: [{ rotate: '-45deg' }], marginTop: -3 },
  alertStroke: { width: 3, height: 9, borderRadius: 2, backgroundColor: c.amber },
  lines: { flex: 1, gap: 5 },
  line: { height: 4, borderRadius: 2, backgroundColor: '#CDDFD4', width: '100%' },
  shortLine: { width: '65%', backgroundColor: '#E6EEE9' },
  bubble: { position: 'absolute', right: 0, bottom: 12, width: 60, height: 48, borderRadius: 13, backgroundColor: c.greenInk, justifyContent: 'center', paddingLeft: 13, gap: 6 },
  bubbleLine: { height: 4, width: 32, borderRadius: 2, backgroundColor: '#D8F5E6' },
  bubbleTail: { position: 'absolute', bottom: -5, left: 12, width: 13, height: 13, borderRadius: 2, backgroundColor: c.greenInk, transform: [{ rotate: '45deg' }] },
});
