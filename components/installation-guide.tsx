import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { installationGuides, selectInstallationGuides, problemRegions, guideLayouts, issueLayouts, GUIDE_COLUMNS, GUIDE_ROWS, type InstallationGuide as GuideDefinition, type GuideScene, type GridPoint } from '../constants/installation-guides';
import { colors as c } from '../constants/theme';
import type { Inspection } from '../types/inspection';

function Path({ points, color }: { points: GridPoint[]; color: string }) {
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  if (!last || !previous) return null;
  const arrow = last[0] < previous[0] ? '↑' : last[0] > previous[0] ? '↓' : last[1] > previous[1] ? '→' : '←';
  return <>
    {points.slice(1).map((point, index) => {
      const from = points[index];
      const vertical = point[1] === from[1];
      return <View key={index} style={{
        position: 'absolute', left: `${(Math.min(from[1], point[1]) + 0.5) * 100 / GUIDE_COLUMNS}%`,
        top: `${(Math.min(from[0], point[0]) + 0.5) * 20}%`,
        width: vertical ? 0 : `${Math.abs(point[1] - from[1]) * 100 / GUIDE_COLUMNS}%`,
        height: vertical ? `${Math.abs(point[0] - from[0]) * 20}%` : 0,
        borderLeftWidth: vertical ? 2.5 : 0, borderTopWidth: vertical ? 0 : 2.5,
        borderColor: color, borderStyle: 'solid',
      }} />;
    })}
    <Text style={{ position: 'absolute', left: `${(last[1] + 0.5) * 100 / GUIDE_COLUMNS}%`, top: `${(last[0] + 0.5) * 20}%`, marginLeft: -12, marginTop: -16, width: 24, textAlign: 'center', color, fontSize: 27, fontWeight: '700', lineHeight: 30 }}>{arrow}</Text>
  </>;
}

function Diagram({ scene, capture, label, suspected = false, compact = false }: { scene: GuideScene; capture: boolean; label: string; suspected?: boolean; compact?: boolean }) {
  const drawing = (suspected && !capture ? issueLayouts[scene] : undefined) ?? guideLayouts[scene];
  const { rows, bad = [], danger, uncertain = [] } = drawing;
  const crossing = rows.some(row => row.includes('W'));
  return <View style={a.figure}>
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={[a.canvas, compact && a.compactCanvas]}>
      {rows.flatMap((row, r) => [...row].map((kind, col) => {
        const road = kind === 'R' || kind === 'W';
        const block = kind === 'D' || kind === 'L' || kind === 'H';
        return <View key={r + '-' + col} style={[a.cell, {
          left: `${col * 100 / GUIDE_COLUMNS}%`, top: `${r * 20}%`,
          backgroundColor: road ? '#555D59' : kind === 'O' ? '#7B817A' : '#E5E3DC',
          borderWidth: road ? 0 : 0.5, borderColor: '#D0D2C9',
        }]}>
          {kind === 'W' && <View style={a.stripe} />}
          {block && <View style={a.tile}>
            {Array.from({ length: kind === 'D' ? 9 : 3 }, (_, i) => <View key={i} style={kind === 'D'
              ? { position: 'absolute', left: `${20 + (i % 3) * 25}%`, top: `${20 + Math.floor(i / 3) * 25}%`, width: '12%', height: '12%', borderRadius: 10, backgroundColor: '#9B7625' }
              : { position: 'absolute', left: kind === 'L' ? `${20 + i * 25}%` : '14%', top: kind === 'L' ? '14%' : `${20 + i * 25}%`, width: kind === 'L' ? '12%' : '72%', height: kind === 'L' ? '72%' : '12%', borderRadius: 10, backgroundColor: '#9B7625' }} />)}
          </View>}
        </View>;
      }))}
      {crossing && <View style={a.curb} />}
      {danger && <Path points={danger} color="#C34F3B" />}
      {problemRegions(bad).map(region => <View key={region.row + '-' + region.column} style={[a.problem, {
        left: `${region.column * 100 / GUIDE_COLUMNS + 0.6}%`, top: `${region.row * 20 + 0.8}%`,
        width: `${region.columns * 100 / GUIDE_COLUMNS - 1.2}%`, height: `${region.rows * 20 - 1.6}%`,
      }]}><Text style={a.problemMark}>!</Text></View>)}
      {uncertain.map(([r, col]) => <View key={r + '-' + col} style={[a.uncertain, { left: `${col * 100 / GUIDE_COLUMNS}%`, top: `${r * 20}%` }]}><Text style={a.question}>?</Text></View>)}
    </View>
    {!compact && <View style={a.legend}>
      {bad.length > 0 ? <>
        <View style={a.legendItem}><View style={[a.swatch, a.problemSwatch]} /><Text style={a.legendText}>오류 의심 위치</Text></View>

      </> : capture ? <Text style={a.legendText}>? 확인하기 어려운 부분</Text> : <>
        <View style={a.legendItem}><View style={[a.swatch, { backgroundColor: '#E4BF56' }]} /><Text style={a.legendText}>점자블록</Text></View>
        {crossing && <View style={a.legendItem}><View style={[a.swatch, a.roadSwatch]}><View style={a.legendStripe} /></View><Text style={a.legendText}>횡단보도</Text></View>}

      </>}
    </View>}
  </View>;
}

export function GuideIllustration({ guide, status }: { guide: GuideDefinition; status: Inspection['status'] }) {
  return <View style={a.media}><Diagram scene={guide.scene} capture={!!guide.capture} label={guide.caption} suspected={status === 'suspected'} /></View>;
}
export function CorrectInstallationExample({ code }: { code: string }) {
  const guides = installationGuides[code]?.filter(guide => !guide.capture);
  if (!guides?.length) return null;
  return <View style={a.correctExample}>
    <Text style={a.correctHeading}>올바른 설치 예시</Text>
    <View style={a.correctFigures}>
      {guides.map(guide => <View key={guide.title} style={[a.correctItem, guides.length > 1 && { width: '45%', maxWidth: 120 }]}>
        <View style={a.correctMedia}><Diagram scene={guide.scene} capture={false} label={guide.caption} compact /></View>
        {guides.length > 1 && <Text style={a.legendText}>{guide.title}</Text>}
      </View>)}
    </View>
    <Text style={a.note}>설치 기준을 이해하기 위한 개념도예요.</Text>
  </View>;
}

export function InstallationGuide({ checks, status, photoUri }: { checks: Inspection['checks']; status: Inspection['status']; photoUri?: string }) {
  const [index, setIndex] = useState(0);
  const [media, setMedia] = useState<'guide' | 'photo'>('guide');
  const unique = selectInstallationGuides(checks.filter(check => check.status === status), status);
  if (status === 'normal' || !unique.length) return photoUri ? <View style={a.card}>
    <Text style={a.eyebrow}>촬영한 사진</Text>
    <View style={a.media}><Image source={{ uri: photoUri }} resizeMode="contain" accessibilityLabel="점검에 사용한 촬영 사진" style={a.photo} /></View>
  </View> : null;
  const selectedIndex = Math.min(index, unique.length - 1);
  const selected = unique[selectedIndex];
  const guideLabel = selected.capture ? '확인 어려운 부분' : status === 'suspected' ? '오류 예시' : '설치 예시';
  return <View style={a.card}>
    <Text style={a.eyebrow}>{selected.capture ? '사진에서 판단하기 어려운 부분이에요' : status === 'suspected' ? '어떤 부분이 잘못됐는지 살펴보세요' : '확인한 설치 모습을 참고해 주세요'}</Text>
    {unique.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={a.tabs}>
      {unique.map((guide, i) => <Pressable key={guide.title} accessibilityRole="button" accessibilityState={{ selected: i === selectedIndex }} onPress={() => setIndex(i)} style={[a.tab, i === selectedIndex && a.activeTab]}><Text style={{ color: i === selectedIndex ? c.greenInk : c.muted, fontSize: 12 }}>{guide.title}</Text></Pressable>)}
    </ScrollView>}
    <View style={a.media}>
      {media === 'photo' && photoUri
        ? <Image source={{ uri: photoUri }} resizeMode="contain" accessibilityLabel="점검에 사용한 촬영 사진" style={a.photo} />
        : <Diagram scene={selected.scene} capture={!!selected.capture} label={selected.caption} suspected={status === 'suspected'} />}
    </View>
    {photoUri && <View style={a.switcher}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: media === 'guide' }} onPress={() => setMedia('guide')} style={[a.switchButton, media === 'guide' && a.selectedButton]}>
        <Text style={[a.switchText, media === 'guide' && a.selectedText]}>{guideLabel}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: media === 'photo' }} onPress={() => setMedia('photo')} style={[a.switchButton, media === 'photo' && a.selectedButton]}>
        <Text style={[a.switchText, media === 'photo' && a.selectedText]}>촬영한 사진</Text>
      </Pressable>
    </View>}
    <View style={a.description}><Text style={a.title}>{selected.title}</Text><Text style={a.caption}>{selected.caption}</Text></View>
    <Text style={a.note}>{selected.capture ? '판정 보류는 설치 오류를 의미하지 않아요.' : status === 'suspected' ? '판정 항목을 설명하는 오류 예시예요. 촬영 사진을 그대로 재현한 그림은 아니에요.' : '설치 기준을 설명하는 개념도예요. 실제 치수와 간격은 표현하지 않았어요.'}</Text>
  </View>;
}

const a = StyleSheet.create({
  card: { backgroundColor: '#F3F8F5', borderRadius: 20, padding: 16, gap: 12 },
  eyebrow: { color: c.greenInk, fontSize: 12, fontWeight: '600' },
  tabs: { gap: 8 },
  tab: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: c.paper, minHeight: 44, justifyContent: 'center' },
  activeTab: { backgroundColor: '#D8EFE2' },
  media: { width: '100%', maxWidth: 390, aspectRatio: GUIDE_COLUMNS / (GUIDE_ROWS + 1), alignSelf: 'center', overflow: 'hidden', borderRadius: 10, backgroundColor: '#F3F8F5' },
  photo: { width: '100%', height: '100%' },
  switcher: { flexDirection: 'row', backgroundColor: '#E4EDE7', padding: 4, borderRadius: 12, gap: 4 },
  switchButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingHorizontal: 8 },
  selectedButton: { backgroundColor: c.paper },
  switchText: { color: c.muted, fontSize: 13, fontWeight: '500' },
  selectedText: { color: c.greenInk, fontWeight: '700' },
  figure: { width: '100%', height: '100%', gap: 10, alignItems: 'center', justifyContent: 'center' },
  canvas: { width: '100%', maxWidth: 390, aspectRatio: GUIDE_COLUMNS / GUIDE_ROWS, borderRadius: 8, overflow: 'hidden' },
  cell: { position: 'absolute', width: `${100 / GUIDE_COLUMNS}%`, height: '20%' },
  tile: { position: 'absolute', left: '3%', top: '3%', width: '94%', height: '94%', borderRadius: 2, backgroundColor: '#E4BF56', borderWidth: 0.5, borderColor: '#B28B30' },
  stripe: { position: 'absolute', left: 0, top: '33%', width: '100%', height: '34%', backgroundColor: '#FFFFFF' },
  curb: { position: 'absolute', top: '40%', left: 0, right: 0, height: 2, backgroundColor: '#ADB5AD' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { color: c.muted, fontSize: 11 },
  swatch: { width: 14, height: 14, borderRadius: 2 },
  roadSwatch: { backgroundColor: '#555D59', justifyContent: 'center' },
  legendStripe: { height: 4, backgroundColor: c.paper },
  description: { marginTop: 12, gap: 8 },
  compactCanvas: { width: '100%' },
  problem: { position: 'absolute', borderWidth: 4, borderColor: '#C34F3B', borderRadius: 4 },
  problemMark: { position: 'absolute', right: -5, top: -6, width: 16, height: 16, borderRadius: 8, overflow: 'hidden', color: '#FFFFFF', backgroundColor: '#C34F3B', fontSize: 11, lineHeight: 16, textAlign: 'center', fontWeight: '700' },
  problemSwatch: { borderWidth: 3, borderColor: '#C34F3B' },
  uncertain: { position: 'absolute', width: `${100 / GUIDE_COLUMNS}%`, height: '20%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#68716DD9' },
  question: { color: '#FFFFFF', fontSize: 25, fontWeight: '700' },
  correctExample: { padding: 12, borderRadius: 12, backgroundColor: '#F3F8F5', gap: 10 },
  correctHeading: { color: c.greenInk, fontSize: 12, fontWeight: '600' },
  correctFigures: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  correctItem: { width: 180, alignItems: 'center', gap: 6 },
  correctMedia: { width: '100%', aspectRatio: GUIDE_COLUMNS / GUIDE_ROWS },
  title: { color: c.ink, fontSize: 16, fontWeight: '600' },
  caption: { color: c.muted, fontSize: 13, lineHeight: 21 },
  note: { color: c.muted, fontSize: 11, lineHeight: 17 },
});
