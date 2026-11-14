import { StyleSheet, Text, View } from 'react-native';
import { colors as c } from '../constants/theme';

type Scene = 'path' | 'capture' | 'report';
const descriptions: Record<Scene, string> = {
  path: '주변 보도와 함께 이어진 노란 점자블록',
  capture: '점자블록과 주변 길을 프레임에 담는 카메라',
  report: '항목별 확인 내용과 알림 표시가 있는 점검 보고서',
};

function Tile({ dots = false }: { dots?: boolean }) {
  return <View style={a.tile}>{Array.from({ length: dots ? 9 : 3 }, (_, i) => <View key={i} style={dots ? a.dot : a.ridge} />)}</View>;
}

export function OnboardingIllustration({ scene, label }: { scene: Scene; label: string }) {
  return <View accessible accessibilityRole="image" accessibilityLabel={`${descriptions[scene]} · ${label}`} style={a.hero}>
    <View style={a.halo} />
    <View style={a.stage}>
      {scene === 'path' && <View style={a.path}>
        <View style={a.pavement}><View style={a.paver} /><Tile /><View style={a.paver} /><View style={a.paver} /><Tile dots /><View style={a.paver} /><View style={a.paver} /><Tile /><View style={a.paver} /></View>
        <View style={a.pathMarker}><View style={a.markerDot} /></View>
      </View>}
      {scene === 'capture' && <View style={a.cameraScene}>
        <View style={a.cameraTop} />
        <View style={a.camera}><View style={a.cameraLight} /><View style={a.viewfinder}>
          <View style={a.miniPath}><Tile /><Tile dots /></View>
          <View style={[a.corner, a.topLeft]} /><View style={[a.corner, a.topRight]} /><View style={[a.corner, a.bottomLeft]} /><View style={[a.corner, a.bottomRight]} />
        </View></View>
        <View style={a.gallery}><View style={a.sun} /><View style={a.mountain} /></View>
      </View>}
      {scene === 'report' && <View style={a.reportScene}>
        <View style={a.report}><View style={a.clip} /><View style={a.reportHeading} />
          {[0, 1, 2].map(i => <View key={i} style={a.reportRow}><View style={[a.status, i === 2 && a.statusAmber]}>{i === 2 ? <View style={a.alertStroke} /> : <View style={a.check} />}</View><View style={a.lines}><View style={a.line} /><View style={[a.line, a.shortLine]} /></View></View>)}
        </View>
        <View style={a.bubble}><View style={a.bubbleLine} /><View style={[a.bubbleLine, { width: 18 }]} /><View style={a.bubbleTail} /></View>
      </View>}
    </View>
    <View style={a.label}><Text style={a.labelText}>{label}</Text></View>
  </View>;
}

const a = StyleSheet.create({
  hero: { minHeight: 230, borderRadius: 19, backgroundColor: '#F3F8F5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', top: 14, width: 182, height: 182, borderRadius: 100, backgroundColor: c.paper },
  stage: { width: 230, height: 174, marginBottom: 30, alignItems: 'center', justifyContent: 'center' },
  path: { transform: [{ rotate: '-12deg' }] },
  pavement: { width: 142, flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  paver: { width: 44, height: 44, backgroundColor: '#E4E8E6', borderRadius: 4 },
  tile: { width: 44, height: 44, borderRadius: 4, backgroundColor: '#E4BF56', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 6, padding: 4 },
  ridge: { width: 5, height: 34, borderRadius: 3, backgroundColor: '#B28B30' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B28B30' },
  pathMarker: { position: 'absolute', left: 56, top: 56, width: 30, height: 30, borderRadius: 15, borderBottomRightRadius: 3, backgroundColor: c.greenInk, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  markerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.paper },
  cameraScene: { width: 190, height: 150, justifyContent: 'center' },
  cameraTop: { position: 'absolute', left: 24, top: 12, width: 52, height: 24, borderRadius: 9, backgroundColor: c.greenInk },
  camera: { width: 168, height: 112, borderRadius: 18, backgroundColor: c.greenInk, padding: 12 },
  cameraLight: { position: 'absolute', right: 12, top: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: '#B8ECD3' },
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
  label: { position: 'absolute', bottom: 16, right: 14, backgroundColor: c.paper, borderRadius: 11, padding: 11, borderWidth: 1, borderColor: '#E7EEE9' },
  labelText: { fontSize: 12, color: c.greenInk },
});
