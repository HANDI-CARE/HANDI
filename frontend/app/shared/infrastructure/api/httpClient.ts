import axios, { HttpStatusCode } from "axios";
import { UserService } from "~/features/user/application/services/UserService";
import { useUserStore } from "~/presentation/stores/userStore";
import { DEFAULT_API_URL } from "~/shared/constants/url";

// 공통 API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  result: T;
}

const baseUrl =
  import.meta.env.VITE_USE_PROXY !== "1" ? DEFAULT_API_URL : undefined;

// Vite Proxy를 사용하지 않을 경우에는 Base URL을 여기서 설정
// 사용할 경우 Vite config(`vite.config.ts`)에서 설정
export const httpClient = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // 쿠키 포함
});

// 요청 인터셉터
httpClient.interceptors.request.use(
  (config) => {
    config.headers["ngrok-skip-browser-warning"] = "true";

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 라우트 보호
    // 로그인 안 된 사용자들도 접근할 수 있는 라우트에 있으면,
    // 토큰 갱신에 실패해도 강제로 로그인 페이지로 이동하지 않음
    const nonLoginRoutes = [
      "/",
      "/login",
      "/onboarding/organization-code",
      "/onboarding/additional-info",
    ];

    const shouldUserRedirect = () => {
      return !nonLoginRoutes.some((route) =>
        window.location.pathname.startsWith(route)
      );
    };

    const redirectToLogin = () => {
      window.location.href = "/login";
    };

    // 401 에러이고, 재시도하지 않은 요청인 경우
    if (
      error.response?.status === HttpStatusCode.Unauthorized &&
      !originalRequest._retry
    ) {
      // refresh 요청 자체는 인터셉터에서 제외하여 무한 루프 방지
      // refresh 요청이 실패했으면 그냥 끝인 거임
      if (originalRequest.url?.includes("/auth/refresh")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const userStore = useUserStore.getState();

      try {
        if (userStore.user && userStore.isAuthenticated) {
          // UserService를 통해 토큰 갱신 시도
          const userService = UserService.getInstance();
          const refreshSuccess = await userService.refreshToken();

          if (refreshSuccess) {
            // 토큰 갱신 성공 시 원래 요청 재시도
            return httpClient(originalRequest);
          } else {
            // Refresh Token도 만료된 경우 사용자 정보 삭제하고,
            // 현재 페이지가 로그인 페이지가 아닐 경우 로그인 페이지로 이동
            userStore.removeUser();
            // 라우트 보호
            if (shouldUserRedirect()) {
              redirectToLogin();
            }
            return Promise.reject(new Error("Refresh token expired"));
          }
        } else {
          // 사용자 정보가 없고 현재 페이지가 로그인 페이지가 아닐 경우 로그인 페이지로 이동
          if (shouldUserRedirect()) {
            redirectToLogin();
          }
          return Promise.reject(new Error("User not authenticated"));
        }
      } catch (refreshError) {
        // 토큰 갱신 중 오류 발생 시 사용자 정보 삭제하고 로그인 페이지로 이동
        userStore.removeUser();
        if (shouldUserRedirect()) {
          redirectToLogin();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
