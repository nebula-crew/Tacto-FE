export type GuideScene = 'turn' | 'branch' | 'continuous' | 'entrance' | 'safe-direction' | 'crossing-turn' | 'entrance-dots' | 'approach' | 'parallel' | 'path-direction' | 'clear-photo' | 'wide-photo' | 'close-photo';
export type InstallationGuide = { title: string; caption: string; scene: GuideScene; capture?: boolean };
export type GridPoint = [row: number, column: number];
export type GuideDrawing = { rows: string[]; bad?: GridPoint[]; danger?: GridPoint[]; uncertain?: GridPoint[] };

export const installationGuides: Record<string, InstallationGuide[]> = {
  M3: [
    { title: '꺾이는 곳', caption: '꺾이는 지점에 점형 블록을 두고, 선형 블록을 다음 보행 방향으로 연결한 예시예요.', scene: 'turn' },
    { title: '갈라지는 곳', caption: '갈라지는 지점에 점형 블록을 두고, 각 보행 방향으로 선형 블록을 연결한 예시예요.', scene: 'branch' },
  ],
  M4: [{ title: '끊김 없는 연결', caption: '선형 블록이 같은 보행 경로를 따라 끊기지 않고 이어진 예시예요.', scene: 'continuous' }],
  C1: [{ title: '횡단보도 입구 연결', caption: '선형 안내가 횡단보도 입구 앞 점형 블록까지 이어진 예시예요.', scene: 'entrance' }],
  C2: [{ title: '안전한 유도 방향', caption: '횡단보도 입구의 점형 블록 띠에 중앙의 선형 블록이 T자로 이어져, 건너는 방향을 안내하는 예시예요.', scene: 'safe-direction' }],
  C3: [{ title: '입구로 방향 바꾸기', caption: '입구로 갈라지는 곳에서 점형 블록으로 방향 변화를 알리고 안내를 이어가는 예시예요.', scene: 'crossing-turn' }],
  C4: [{ title: '입구의 점형·방향', caption: '입구 앞에 점형 블록을 두고, 선형 블록의 돌출선을 건너는 방향과 나란히 놓은 예시예요.', scene: 'entrance-dots' }],
  C5: [{ title: '입구까지 선형 안내', caption: '횡단보도 앞 점형 블록까지 선형 안내가 이어진 예시예요.', scene: 'approach' }],
  C6: [{ title: '건너는 방향으로 이어지는 경로', caption: '선형 블록으로 이루어진 경로가 횡단보도를 건너는 방향으로 이어진 예시예요.', scene: 'path-direction' }],
  H1: [{ title: '가려져서 확인하기 어려워요', caption: '회색으로 가려진 부분처럼 블록이 잘 보이지 않으면 설치 상태를 판단하기 어려워요. 밝고 가림 없는 곳에서 다시 찍어 주세요.', scene: 'clear-photo', capture: true }],
  H2: [{ title: '방향을 비교하기 어려워요', caption: '사진 각도로 방향을 판단하기 어려운 경우예요. 횡단보도와 블록이 함께 보이도록 다시 찍어 주세요.', scene: 'wide-photo', capture: true }],
  H3: [{ title: '주변 길이 보이지 않아요', caption: '횡단보도가 사진에 담기지 않으면 입구와 연결되는지 확인하기 어려워요. 주변 길까지 함께 찍어 주세요.', scene: 'close-photo', capture: true }],
  H4: [{ title: '블록 모양을 확인하기 어려워요', caption: '블록의 점과 돌출선을 알아볼 수 있도록 조금 가까이서 선명하게 찍어 주세요.', scene: 'clear-photo', capture: true }],
};

export const suspectedGuides: Record<string, InstallationGuide[]> = {
  M3: [
    { title: '꺾이는 곳에 점형 블록 없음', caption: '빨간 테두리 안은 길이 꺾이는데 점형 블록 없이 선형 블록만 놓인 오류 예시예요.', scene: 'turn' },
    { title: '갈라지는 곳에 점형 블록 없음', caption: '빨간 테두리 안은 길이 갈라지는데 점형 블록이 없어 방향 변화를 알리지 못하는 오류 예시예요.', scene: 'branch' },
  ],
  M4: [{ title: '선형 블록 중간 끊김', caption: '빨간 테두리 안에 블록이 없어 안내가 끊긴 예시예요.', scene: 'continuous' }],
  C1: [{ title: '횡단보도 입구까지 연결 안 됨', caption: '점형·선형 블록은 서로 이어져 있지만 횡단보도 입구와 떨어진 예시예요. 빨간 테두리는 횡단보도까지 연결이 빠진 구간이에요.', scene: 'entrance' }],
  C2: [{ title: '횡단보도 밖 차도로 안내', caption: '점형·선형 블록은 이어져 있지만 횡단보도와 옆으로 떨어진 예시예요. 빨간 화살표는 횡단보도가 없는 차도로 향하는 잘못된 안내 방향이에요.', scene: 'safe-direction' }],
  C3: [{ title: '입구를 지나치는 안내', caption: '가로 안내가 횡단보도 입구를 그대로 지나치는 오류 예시예요. 빨간 테두리 지점에서 입구 쪽으로 안내가 이어져야 해요.', scene: 'crossing-turn' }],
  C4: [
    { title: '입구의 점형 블록 없음', caption: '입구에 멈춤과 주의를 알리는 점형 블록이 없는 오류 예시예요. 빨간 테두리가 점형 블록을 살펴볼 위치예요.', scene: 'entrance-dots' },
    { title: '입구의 선형 블록 방향 어긋남', caption: '선형 블록의 돌출선이 건너는 방향과 다르게 놓인 오류 예시예요. 빨간 테두리 안의 줄 방향을 살펴보세요.', scene: 'parallel' },
  ],
  C5: [{ title: '입구로 이어지는 선형 안내 없음', caption: '입구 앞 점형 블록은 있지만 다가가는 길에 선형 안내가 없는 오류 예시예요. 빨간 테두리 구간에 선형 안내가 이어져야 해요.', scene: 'approach' }],
  C6: [{ title: '건너는 방향과 다른 안내 경로', caption: '선형 블록으로 이루어진 길이 횡단보도를 건너는 방향과 다르게 이어진 오류 예시예요. 블록 내부 돌출선이 아닌 경로의 진행 방향을 뜻해요.', scene: 'path-direction' }],
};

export const captureGuide: InstallationGuide = { title: '주변 길까지 함께 촬영', caption: '블록의 모양과 주변 연결부가 함께 선명하게 보이도록 다시 찍어 주세요.', scene: 'wide-photo', capture: true };

// 횡단보도 두 줄 + 보도 세 줄을 유지하고, 좌우 공간을 더해 7×5로 표시한다.
// . 보도 / R 차도 / W 횡단보도 / D 점형 / L 세로 선형 / H 가로 선형 / O 가림
const crossing = ['RWWWR', 'RWWWR'];
const straight = [...crossing, '.DDD.', '..L..', '..L..'];
const safe = straight;
const baseGuideLayouts: Record<GuideScene, GuideDrawing> = {
  turn: { rows: ['.....', '.....', '..DHH', '..L..', '..L..'] },
  branch: { rows: ['.....', '.....', 'HHDHH', '..L..', '..L..'] },
  continuous: { rows: ['.....', '..L..', '..L..', '..L..', '.....'] },
  entrance: { rows: straight },
  'safe-direction': { rows: safe },
  'crossing-turn': { rows: [...crossing, '.DDD.', '..L..', 'HHDHH'] },
  'entrance-dots': { rows: straight },
  approach: { rows: straight },
  parallel: { rows: straight },
  'path-direction': { rows: straight },
  'clear-photo': { rows: ['.....', '..L..', '..O..', '..L..', '.....'], uncertain: [[2, 2]] },
  'wide-photo': { rows: [...crossing, '.DDD.', '..L..', '..L..'], uncertain: [[0, 2]] },
  'close-photo': { rows: ['.....', '.....', '..L..', '..L..', '..L..'], uncertain: [[0, 2]] },
};

const baseIssueLayouts: Partial<Record<GuideScene, GuideDrawing>> = {
  turn: { rows: ['.....', '.....', '..LHH', '..L..', '..L..'], bad: [[2, 2]] },
  branch: { rows: ['.....', '.....', 'HHLHH', '..L..', '..L..'], bad: [[2, 2]] },
  continuous: { rows: ['.....', '..L..', '.....', '..L..', '.....'], bad: [[2, 2]] },
  entrance: { rows: [...crossing, '.DDD.', '.....', '..L..'], bad: [[3, 2]] },
  'safe-direction': { rows: [...crossing, 'LDDD.', 'L....', 'L....'], bad: [[2, 0]], danger: [[2, 0], [0, 0]] },
  'crossing-turn': { rows: [...crossing, '.DDD.', '.....', 'HHHHH'], bad: [[4, 2]] },
  'entrance-dots': { rows: [...crossing, '..L..', '..L..', '..L..'], bad: [[2, 1], [2, 2], [2, 3]] },
  approach: { rows: [...crossing, '.DDD.', '.....', '.....'], bad: [[3, 2], [4, 2]] },
  parallel: { rows: [...crossing, '.DDD.', '..H..', '..H..'], bad: [[3, 2], [4, 2]] },
  'path-direction': { rows: [...crossing, '.DDD.', 'HHHHH', '.....'], bad: [[3, 1], [3, 2], [3, 3]] },
};

export const GUIDE_COLUMNS = 7;
export const GUIDE_ROWS = 5;

function widenDrawing(drawing: GuideDrawing): GuideDrawing {
  const shift = (points?: GridPoint[]) => points?.map(([row, column]): GridPoint => [row, column + 1]);
  return {
    ...drawing,
    rows: drawing.rows.map(row => row.includes('R') || row.includes('W') ? 'R' + row + 'R' : '.' + row + '.'),
    bad: shift(drawing.bad), danger: shift(drawing.danger), uncertain: shift(drawing.uncertain),
  };
}

export const guideLayouts = Object.fromEntries(Object.entries(baseGuideLayouts).map(([scene, drawing]) => [scene, widenDrawing(drawing)])) as Record<GuideScene, GuideDrawing>;
export const issueLayouts = Object.fromEntries(Object.entries(baseIssueLayouts).map(([scene, drawing]) => [scene, widenDrawing(drawing)])) as Partial<Record<GuideScene, GuideDrawing>>;

// 블록끼리는 이어져 있지만, 횡단보도에서 떨어진 두 사례를 구분한다.
issueLayouts.entrance = {
  rows: ['RRWWWRR', 'RRWWWRR', '.......', '..DDD..', '...L...'],
  bad: [[2, 2], [2, 3], [2, 4]],
};
issueLayouts['safe-direction'] = {
  rows: ['RRRRWWW', 'RRRRWWW', 'DDD....', '.L.....', '.L.....'],
  bad: [[2, 0], [2, 1], [2, 2]], danger: [[2, 1], [0, 1]],
};

export type GuideCheck = { code: string; sourceMessages?: string[] };

export function selectInstallationGuides(checks: (string | GuideCheck)[], status: 'suspected' | 'normal' | 'hold'): InstallationGuide[] {
  const catalog = status === 'suspected' ? suspectedGuides : installationGuides;
  const guides = checks.flatMap(check => {
    const code = typeof check === 'string' ? check : check.code;
    if (status === 'hold' && !code.startsWith('H')) return [captureGuide];
    if (status === 'suspected' && code === 'C4') {
      // 같은 C4라도 점형 누락과 돌출선 방향은 별개다. 서버가 의심 판정한 유형만 그린다.
      const messages = typeof check === 'string' ? [] : check.sourceMessages ?? [];
      return (catalog.C4 ?? []).filter(guide => messages.some(message => guide.scene === 'entrance-dots'
        ? /점형/.test(message) && /확인하지 못|없|누락/.test(message)
        : /돌출선/.test(message) && /다르|다른|어긋|불일치/.test(message)));
    }
    return catalog[code] ?? [];
  });
  const unique = guides.filter((guide, i) => guides.findIndex(item => item.title === guide.title) === i);
  return unique.length || status !== 'hold' ? unique : [captureGuide];
}

export type ProblemRegion = { row: number; column: number; rows: number; columns: number };

// 붙어 있는 칸이 직사각형을 채울 때만 하나로 묶어 정상 칸이 함께 강조되지 않게 한다.
export function problemRegions(cells: GridPoint[]): ProblemRegion[] {
  const remaining = new Map(cells.map(([r, col]) => [r + ',' + col, [r, col] as GridPoint]));
  const regions: ProblemRegion[] = [];
  while (remaining.size) {
    const first = remaining.values().next().value!;
    const pending = [first], group: GridPoint[] = [];
    remaining.delete(first.join(','));
    while (pending.length) {
      const point = pending.pop()!;
      group.push(point);
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const key = [point[0] + dr, point[1] + dc].join(',');
        const next = remaining.get(key);
        if (next) { remaining.delete(key); pending.push(next); }
      }
    }
    const row = Math.min(...group.map(point => point[0]));
    const column = Math.min(...group.map(point => point[1]));
    const rows = Math.max(...group.map(point => point[0])) - row + 1;
    const columns = Math.max(...group.map(point => point[1])) - column + 1;
    if (rows * columns === group.length) regions.push({ row, column, rows, columns });
    else regions.push(...group.map(([r, col]) => ({ row: r, column: col, rows: 1, columns: 1 })));
  }
  return regions;
}
