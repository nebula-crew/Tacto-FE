import { Redirect } from 'expo-router';

// 이전 검토 링크는 관리자 화면의 그림 검토 탭으로 이어진다.
export default function GuidePreviewRedirect() {
  return <Redirect href="/admin?view=guides" />;
}
