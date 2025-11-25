import { App as CapacitorApp } from "@capacitor/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import koKR from "antd/locale/ko_KR";
import {
  isRouteErrorResponse,
  Links,
  matchPath,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";

import type { PluginListenerHandle } from "@capacitor/core";
import { LiveKitRoom, RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import type { Route } from "./+types/root";
import "./app.css";
import { useDeepLinkStore } from "./features/mobile-push/stores/deepLinkStore";
import { UserRole } from "./features/user/domain/User";
import DevSettings from "./presentation/components/organisms/DevSettings";
import MiniVideoCall from "./presentation/pages/video-call/MiniVideoCall";
import { useDevSettingsStore } from "./presentation/stores/devSettingsStore";
import { useUserStore } from "./presentation/stores/userStore";
import { useVideoCallStore } from "./presentation/stores/videoCallStore";
import { guardianRoutes, nurseRoutes, onboardingRoutes } from "./routes";
import { DEFAULT_LIVEKIT_URL } from "./shared/constants/url";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL ?? DEFAULT_LIVEKIT_URL;

// QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 화상 통화 관련
  const [room] = useState(() => new Room());
  const miniVideoCallRef = useRef<HTMLDivElement>(null);
  const { token } = useVideoCallStore();

  // Capacitor 관련 설정
  // 안드로이드에서 뒤로가기 누르면 React에서 뒤로가기 처리
  useEffect(() => {
    let listener: PluginListenerHandle | null = null;

    const addListener = async () => {
      listener = await CapacitorApp.addListener(
        "backButton",
        ({ canGoBack }) => {
          if (location.pathname !== "/" && canGoBack) {
            navigate(-1);
          } else {
            CapacitorApp.exitApp();
          }
        }
      );
    };
    addListener();

    return () => {
      listener?.remove();
    };
  }, [navigate, location.pathname]);

  // 딥링크 처리
  const { currentDeepLink } = useDeepLinkStore();
  useEffect(() => {
    if (!currentDeepLink) {
      return;
    }

    const { path } = currentDeepLink;
    navigate(path);
  }, [navigate, currentDeepLink]);

  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=0.9" />
        <meta name="description" content="Handi" />
        <Links />
        <title>Handi | 스마트 돌봄 솔루션</title>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider
            locale={koKR}
            theme={{
              token: {
                colorPrimary: "#006d75", // cyan 색상을 primary로 설정
                colorLink: "#006d75", // Typography.Link 색상
                colorLinkHover: "#08979c", // Link 호버 색상 (조금 더 진한 cyan)
                colorLinkActive: "#045759", // Link 활성 색상 (더 진한 cyan)
              },
              components: {
                Calendar: {
                  itemActiveBg: "#e6fffb", // 선택된 날짜 배경을 매우 밝은 cyan으로
                  colorPrimary: "#36cfc9", // Calendar 내부 요소들에 더 밝은 cyan 적용
                },
              },
            }}
          >
            <RoomContext.Provider value={room}>
              <LiveKitRoom
                token={token ?? undefined}
                serverUrl={LIVEKIT_URL}
                audio={true}
                video={true}
              >
                {children}
                <Draggable nodeRef={miniVideoCallRef}>
                  <div
                    ref={miniVideoCallRef}
                    className="fixed left-24 bottom-24 z-9999"
                  >
                    <MiniVideoCall />
                  </div>
                </Draggable>
                <DevSettings />
              </LiveKitRoom>
            </RoomContext.Provider>
          </ConfigProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const authStore = useUserStore();
  const { routeGuardEnabled } = useDevSettingsStore();
  const navigate = useNavigate();

  // 최초 앱 실행 시 사용자 정보 로드
  useEffect(() => {
    authStore.loadUser();
  }, []);

  // 역할 기반 라우트 보호
  useLayoutEffect(() => {
    // 개발자 도구에서 라우트 보호가 비활성화된 경우 리다이렉트하지 않음
    if (!routeGuardEnabled) {
      return;
    }

    const currentPath = location.pathname;
    const isOnboardingRoute = onboardingRoutes.some(
      (route) => route.path && matchPath(route.path, currentPath)
    );
    const isNurseRoute = nurseRoutes.some(
      (route) => route.path && matchPath(route.path, currentPath)
    );
    const isGuardianRoute = guardianRoutes.some(
      (route) => route.path && matchPath(route.path, currentPath)
    );
    // TODO: 추후 관리자 계정 정상 생성되면 복구시키기
    const isAdminRoute = false;
    // const isAdminRoute = adminRoutes.some(
    //   (route) => route.path && matchPath(route.path, currentPath)
    // );

    // 로그인되어 있고 초기 정보 입력까지 전부 끝나서 사용할 준비가 된 경우
    const isLoggedInAndRegistered =
      authStore.isAuthenticated && !authStore.user?.needsAdditionalInfo;

    if (
      !isLoggedInAndRegistered &&
      (isNurseRoute || isGuardianRoute || isAdminRoute)
    ) {
      // 로그인 안 되어 있고 로그인이 필요한(역할이 있어야 하는) 페이지에 들어 있을 경우
      // 로그인 페이지로 이동
      window.location.href = "/login";
    } else if (location.pathname === "/" && isLoggedInAndRegistered) {
      // 로그인 되어 있고 정보 입력도 다 되어 있는데 온보딩 페이지로 올 경우 대시보드로 이동
      const role = authStore.user?.role;
      if (role === UserRole.NURSE) {
        window.location.href = "/nurse/dashboard";
      } else if (role === UserRole.GUARDIAN) {
        window.location.href = "/guardian/dashboard";
      } else if (role === UserRole.ADMIN) {
        window.location.href = "/admin/users";
      }
    } else if (isLoggedInAndRegistered) {
      // 로그인 되어 있고 정보 입력도 다 되어 있는데 다른 역할의 페이지나 로그인, 온보딩 관련 페이지에 접근하려 한 경우
      const role = authStore.user?.role;
      if (isOnboardingRoute) {
        window.location.href = "/";
      }

      if (role === UserRole.NURSE) {
        // 간호사는 보호자나 관리자 페이지에 접근 불가
        if (isGuardianRoute || isAdminRoute) {
          window.location.href = "/nurse/dashboard";
        }
      } else if (role === UserRole.GUARDIAN) {
        // 보호자는 간호사나 관리자 페이지에 접근 불가
        if (isNurseRoute || isAdminRoute) {
          window.location.href = "/guardian/dashboard";
        }
      } else if (role === UserRole.ADMIN) {
        // 관리자는 간호사나 보호자 페이지에 접근 불가
        if (isNurseRoute || isGuardianRoute) {
          window.location.href = "/admin/users";
        }
      }
    }
    // 백에서 사용자 정보는 추가정보(초기정보) 입력까지 완료되어야 생기므로,
    // 그 전에 사용자 정보를 조회함으로써 기관코드나 추가정보 입력이 완료되었는지
    // 여부를 확인할 수는 없음.
    // 그리고 생각해보면 굳이 가입을 진행하다가 그만 둔 경우에 다시 가입 절차를 밟도록
    // 강제로 이동시킬 필요도 없으므로 굳이 강제 이동 로직을 넣지 않기로 결정함.
    /* else if (authStore.isAuthenticated && !authStore.user?.isApproved) {
      // 로그인 되어 있는데 승인이 아직 안 돼서 코드를 입력해야 할 경우
      if (location.pathname !== "/onboarding/organization-code") {
        window.location.href = "/onboarding/organization-code";
      }
    } else if (
      authStore.isAuthenticated &&
      authStore.user?.isApproved &&
      authStore.user?.needsAdditionalInfo
    ) {
      // 로그인 되어 있고 승인도 됐는데 추가정보 입력이 안 됐을 경우
      if (location.pathname !== "/onboarding/additional-info") {
        window.location.href = "/onboarding/additional-info";
      }
    } */
  }, [
    location.pathname,
    authStore.isAuthenticated,
    authStore.user?.needsAdditionalInfo,
    authStore.user?.role,
    routeGuardEnabled,
    navigate,
  ]);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "오류 발생!";
  let details = "예상치 못한 오류가 발생했습니다.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "오류";
    details =
      error.status === 404
        ? "요청하신 페이지를 찾을 수 없습니다."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold text-red-600 mb-4">{message}</h1>
      <p className="text-gray-700 mb-4">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-gray-100 rounded">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
