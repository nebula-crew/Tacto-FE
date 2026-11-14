# TactileCheck 모바일

한 장의 사진으로 점자블록 설치 상태를 점검하는 React Native + Expo 앱입니다. FastAPI/YOLO 백엔드와 독립적으로 실행합니다. 홈 → 사진 촬영/갤러리 → 점검 결과 흐름이며, 녹색과 아이보리 중심의 차분한 화면입니다.

## 실행

Node.js 22 LTS 이상과 npm을 사용하세요. Windows에서는 Android 기기/에뮬레이터 또는 웹으로 확인할 수 있습니다. iOS 네이티브 빌드는 macOS 또는 EAS Build가 필요합니다.

```powershell
cd "C:\Users\yangs\Desktop\수업\우왕톤\WOOWANGTHON_TEAM_47_FE"
code .
npm ci
Copy-Item .env.example .env
npm start
```

설치된 Expo Go와 프로젝트 SDK가 일치해야 합니다. 이 프로젝트는 SDK 58입니다. 기기에 맞는 클라이언트는 https://expo.dev/go 에서 확인하세요. Expo Go가 해당 SDK를 지원하지 않으면 호환 클라이언트 또는 development build가 필요합니다. 터미널의 QR을 스캔하거나 Android 에뮬레이터에서 `a`를 누르세요. 웹 확인은 `npm run web`입니다. 웹 카메라는 HTTPS 또는 localhost와 브라우저 권한이 필요합니다.

VS Code의 `code` 명령이 없으면 파일 → 폴더 열기로 위 폴더를 선택하세요. 루트 폴더 자체가 앱이므로 별도 front_end 하위 폴더는 없습니다.

## 서버 설정

`.env`의 `EXPO_PUBLIC_API_URL`에 `/api`를 제외한 서버 주소를 입력하세요.

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000
```

실제 휴대폰의 localhost는 휴대폰 자신입니다. PC의 LAN IP를 사용하고 같은 Wi-Fi에 연결하세요. Android 기본 에뮬레이터는 `http://10.0.2.2:8000`을 사용할 수 있습니다. FastAPI는 별도 백엔드 폴더에서 `uvicorn main:app --host 0.0.0.0 --port 8000`처럼 실행하되 실제 모듈명에 맞게 수정하세요. 방화벽과 포트 접근도 확인하세요. 웹에서는 FastAPI CORS에 개발 웹 주소를 허용해야 합니다. 환경변수 변경 후 개발 서버를 재시작하세요. 배포 시에는 HTTPS 서버를 사용하세요. `EXPO_PUBLIC_` 변수는 앱에 공개되므로 비밀키를 넣지 마세요.

## 구조

```text
app/                 # Expo Router
  _layout.tsx        # 화면 스택 및 상태 공급
  index.tsx          # 홈
  inspection.tsx     # 한 장 촬영/선택 및 요청
  result.tsx         # 결과 및 항목별 상태
components/ui.tsx    # 공통 화면·버튼·상태 표시
services/api.ts      # HTTP 요청, 응답 검증, 연결 오류·시간 제한
services/inspection-context.tsx # 메모리 내 사진/결과
types/inspection.ts  # API와 화면 타입
constants/           # 색상, 명확히 구분된 예시 데이터
assets/              # Expo 기본 앱 아이콘 등 교체 가능한 자산
docs/api-contract.md # 백엔드 연결 계약
```

사진은 한 장만 유지하고 JPEG로 변환해 전송합니다. 카메라 권한 거부, 선택 취소, 네트워크 오류, HTTP 오류, 잘못된 응답, 60초 시간 초과를 처리합니다. 선택 취소 시 기존 사진을 유지합니다. 사진과 결과는 저장하지 않으며 앱 재시작 시 사라집니다. 사진은 실제 분석 버튼을 눌렀을 때만 서버로 전송됩니다. 서버의 사진 저장·삭제 정책은 백엔드에서 별도 구현해야 합니다.

## 백엔드 통합 범위

`POST /api/inspections`에 multipart의 `file` 필드로 JPEG 한 장을 보냅니다. 현재 서버 스키마를 직접 확인한 상태가 아니므로 `docs/api-contract.md`의 프론트 계약에 맞춰 백엔드를 조정하거나 `services/api.ts`에서 매핑하세요. 모델 실행·학습·YOLO 결과 해석은 포함하지 않습니다. 실제 API 실패를 정상 결과로 바꾸지 않습니다.

서버 없이 사진 등록 화면 하단의 세 가지 예시 버튼으로 오류 의심/정상 추정/판정 보류 화면을 볼 수 있습니다. 예시는 분석이 아니라는 안내를 표시합니다. H3 등 대상이 없는 항목은 `not_applicable`(미적용)으로 표시할 수 있습니다. M3/C5/C6/H3 예시는 화면 개발용이며 규칙 전체 구현이 아닙니다. 오류 위치 오버레이와 결과 저장은 아직 구현하지 않았습니다.

## 검증 명령

```powershell
npm run typecheck
npx expo install --check
npx expo export --platform all --output-dir dist
```

실기기에서 카메라 권한 허용/거부, 사진 선택 취소와 교체, 가로/세로 사진, 서버 연결 성공/실패를 확인하세요. 자동 빌드 검증은 카메라 하드웨어와 실제 모델 서버의 동작을 보장하지 않습니다.
