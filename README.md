# tacto 모바일

Expo SDK 58 + React Native + TypeScript + Expo Router. 기존 `app/`, `components/`, `services/`, `types/`, `constants/`, `assets/` 구조를 유지한 모바일 프론트엔드입니다.

## 실행

Node.js 22 LTS 이상을 사용하세요.

```powershell
npm ci
Copy-Item .env.example .env  # .env가 없을 때만 실행
npm start
```

`.env`가 이미 있다면 그대로 유지하세요. 웹 확인은 `npm run web`, Android 에뮬레이터는 `npm run android`입니다. 실제 휴대폰에서는 프로젝트 SDK와 호환되는 Expo Go 또는 개발 빌드를 사용하세요: https://expo.dev/go

## 화면 구성

Appetize 네이티브 앱 데모 배포는 [배포 안내](docs/appetize-deployment.md)를 참고하세요.
`eas.json`의 `appetize` 프로필로 Android APK와 iOS 시뮬레이터 빌드를 생성할 수 있습니다.

- `app/index.tsx`: 기기 저장소를 읽은 뒤 첫 실행 안내 또는 홈으로 이동. 저장소 확인 전에는 홈 화면이 깜빡이지 않도록 대기합니다.
- `app/onboarding.tsx`: 한 화면에 맞춘 설명 카드 3장. 일정 거리 이상 스와이프하면 한 장씩 이동하며, 점 양옆 버튼으로도 이동합니다. 마지막 카드에서는 이동 표시 아래에 시작하기 버튼을 표시합니다.
- `app/home.tsx`: 두 가지 주 기능(촬영·갤러리), 아이콘이 있는 촬영 팁, 이번 실행의 최근 결과 확인 버튼. 결과가 없으면 안내 문구를 표시합니다.
- `app/inspection.tsx`: 한 장 미리보기와 실제/예시 점검 시작. 사진 선택 취소 시 현재 사진을 유지합니다.
- `app/loading.tsx`: 실제 요청 준비/서버 응답 대기/응답 정리 상태. 취소 시 fetch를 중단합니다. 동기 API가 모델 단계별 진행률을 제공하지 않으므로 임의의 진행률이나 YOLO 작업 완료를 표시하지 않습니다. 예시 모드만 시간에 따라 이동합니다.
- `app/result.tsx`: 전체 상태·항목별 상태, 펼쳐보는 상세 보고서. 전체 또는 항목에 오류 의심이 있을 때만 신고 버튼을 표시합니다.
- `app/report.tsx`: 위치·내용 검증과 신고 초안 텍스트 공유. **기관 신고 접수 API는 연결하지 않았습니다.** 실제 접수 완료를 표시하지 않습니다. 사진은 공유 텍스트에 첨부되지 않습니다.

Supabase 민트 `#3ECF8E`, 연회색 배경 `#F2F4F5`, 흰 카드와 옅은 그림자를 적용했습니다. 화면 콘텐츠는 넓은 화면에서도 최대 폭을 제한하고 작은 화면과 글자 크기에 맞춰 줄바꿈합니다. 기본 앱 아이콘은 기존 자산을 유지했습니다.

## 첫 실행 저장

Android/iOS는 `expo-file-system`의 앱 document에 안내 완료 여부만 저장하고 웹은 localStorage를 사용합니다. 앱 종료 후에도 완료 상태를 유지합니다. 앱 삭제/데이터 초기화 또는 웹 사이트 저장소 삭제 시 안내가 다시 나타납니다. 홈의 이용 안내에서 언제든 다시 볼 수 있습니다. 저장이 거부되면 오류와 다시 시도/이번만 건너뛰기를 제공합니다. 사진과 보고서는 이번 실행의 메모리에만 남습니다.

## 서버 연결

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.0.10:8000
```

`/api`를 제외한 백엔드 주소입니다. 환경변수를 바꾸면 개발 서버를 재시작하세요. 실제 휴대폰은 PC의 LAN IP를 사용하며 localhost는 휴대폰 자신입니다. Android 기본 에뮬레이터는 `http://10.0.2.2:8000`을 사용할 수 있습니다. 서버는 외부 접근 가능한 인터페이스로 실행하고 방화벽을 확인하세요. 웹 테스트에서는 FastAPI CORS에 개발 웹 주소를 허용해야 합니다. 운영 시 HTTPS를 사용하고 공개 환경변수에 비밀키를 넣지 마세요.

`services/api.ts`에서 `POST /api/inspections`로 multipart `photo` 필드에 사진 한 장을 보냅니다. 서버 응답(`InspectionResult`)은 `services/inspection-schema.ts`가 화면용 형식으로 바꿉니다. 필드 대응과 배포 서버 주소는 `docs/api-contract.md`를 보세요. 타임아웃 60초, 서버 오류, 잘못된 응답, 네트워크 오류를 처리합니다. 취소는 클라이언트 요청을 중단하지만 이미 시작된 서버 작업까지 취소한다고 보장하지 않습니다.

모델 통합·신고 기관 접수·결과 PDF·오류 위치 오버레이·영구 점검 기록은 포함하지 않습니다. 예시 결과는 실제 사진 분석 결과와 명확히 구분합니다.

## 검증

```powershell
npm run typecheck
npm run lint
npm test
npx expo export --platform all --output-dir dist
```

자동 검사는 API 응답 계약, multipart 요청, 오류/취소 처리, 첫 실행 저장의 웹/네이티브 어댑터를 검증합니다. 실기기에서 권한 허용/거부, 사진 선택 취소/교체, 종료 후 재실행, 스와이프, 서버 연결, 큰 글자 크기, 공유 창을 별도로 확인하세요. 네이티브 저장 검사는 실제 기기 파일 시스템 대신 동일 인터페이스의 테스트 어댑터를 사용합니다.
