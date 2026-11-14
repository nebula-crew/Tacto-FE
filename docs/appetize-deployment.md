# Appetize 배포

Appetize는 웹 빌드가 아닌 네이티브 앱을 클라우드 기기에서 실행합니다.
`eas.json`의 `appetize` 프로필은 개발 서버 없이 실행되는 Android APK 또는
iOS 시뮬레이터 빌드를 만듭니다. Vercel 설정은 별도로 유지됩니다.

## 1. Expo 계정과 프로젝트 연결

프론트엔드 폴더에서 실행합니다. 전역 CLI 설치는 필요하지 않습니다.

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
```

처음 연결한다면 팀이 사용하는 Expo 계정/조직에 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
이 과정에서 `app.json`에 실제 EAS projectId가 추가됩니다. 임의의 projectId를 넣지 마세요.
앱 식별자는 `com.woowangthon.team47.tacto`로 설정했습니다.
화면과 설치 앱 이름은 `tacto`입니다. 기존 EAS 빌드 연결을 유지하기 위해
원격 프로젝트의 slug와 projectId는 그대로 사용합니다.

## 2. 백엔드 환경변수 (실제 분석 시)

Expo 프로젝트의 EAS Environment Variables에서 `preview` 환경을 선택하고
`EXPO_PUBLIC_API_URL`을 공개 HTTPS 백엔드 주소로 등록합니다.
이 값은 공개 클라이언트 설정이므로 비밀키를 넣지 마세요.

예: `https://api.example.com` (`/api` 제외).
Appetize의 기기는 클라우드에 있으므로 PC의 `localhost`, `192.168.x.x`,
Android 로컬 에뮬레이터용 `10.0.2.2` 주소로 PC 백엔드에 연결할 수 없습니다.
Vercel에 설정한 환경변수는 EAS에 자동 전달되지 않습니다.
환경변수를 바꾼 후에는 새 빌드가 필요합니다.

백엔드 없이도 이용안내, 홈, 사진 선택 화면은 확인할 수 있습니다.
홈의 예시 모드 진입 버튼은 제거되어 실제 분석과 결과 확인에는 백엔드가 필요합니다.
로컬 `.env`에 내부 IP가 있더라도 실제 분석용 배포는 EAS preview 환경에 올바른 주소를 등록하세요.

## 3. Android APK 빌드

```powershell
npx eas-cli@latest build --platform android --profile appetize
```

Android Keystore 생성 질문에는 새 앱이면 생성을 선택합니다.
클라우드 빌드에는 Expo 계정의 빌드 쿼터가 사용됩니다.
빌드 완료 후 표시되는 EAS 페이지에서 `.apk`를 다운로드합니다.
Appetize에는 `.aab` 대신 `.apk`를 업로드합니다.

## 4. Appetize 업로드와 실행

1. https://appetize.io/upload 에 로그인합니다.
2. 다운로드한 APK를 업로드합니다.
3. 생성된 앱 페이지에서 Android 기기를 선택하고 실행합니다.
4. 이용안내 → 홈 → 사진 선택 흐름을 확인합니다. 백엔드 연결 후 점검 결과와 신고 초안도 확인합니다.
5. 실제 사진 분석은 기기 도구 모음의 **Upload File**로 사진을 넣고 앱의 갤러리에서 선택합니다.
6. 앱 페이지의 공유 링크로 데모를 공유합니다. 접근 권한은 Appetize에서 확인합니다.

업로드된 빌드가 실제 실행되는지는 별도 확인이 필요합니다.
새 코드 적용 시 다시 빌드한 APK로 기존 Appetize 앱을 업데이트합니다.

## iOS가 필요한 경우

```powershell
npx eas-cli@latest build --platform ios --profile appetize
```

이 프로필은 `ios.simulator: true`이므로 기기용 IPA가 아닌 시뮬레이터용 `.app` 빌드를 만듭니다.
완료된 `.app`을 포함하는 `.tar.gz` 또는 `.zip` 아카이브를 Appetize에 업로드합니다.
Windows에서도 EAS 클라우드 빌드를 요청할 수 있습니다.

## 공식 문서

- [Expo APK 빌드](https://docs.expo.dev/build-reference/apk/)
- [EAS 빌드 프로필](https://docs.expo.dev/build/eas-json/)
- [Appetize Android 업로드](https://docs.appetize.io/platform/app-management/uploading-apps/android)
- [Appetize iOS 업로드](https://docs.appetize.io/platform/app-management/uploading-apps/ios)
- [Appetize 사진 업로드](https://docs.appetize.io/features/media)
