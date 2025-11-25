import { Button, message, Typography } from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { UserService } from "~/features/user/application/services/UserService";
import { useUserStore } from "~/presentation/stores/userStore";

const { Title, Text } = Typography;

const BASE_URL = import.meta.env.VITE_API_URL;

export default function SocialLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const userStore = useUserStore();

  const handleSocialLogin = async (
    provider: "google" | "naver" | "kakao" | "test"
  ) => {
    setIsLoading(provider);

    try {
      let popupCheckIntervalId: number | null = null;
      // OAuth 인증 URL로 리다이렉트
      const oauthUrls = {
        google: BASE_URL + "/oauth2/authorization/google",
        naver: BASE_URL + "/oauth2/authorization/naver",
        kakao: BASE_URL + "/oauth2/authorization/kakao",
        test: BASE_URL + "/mock-oauth-test?email=kykint@naver.com",
      };

      // 새 창에서 OAuth 인증 페이지 열기
      const authWindow = window.open(
        oauthUrls[provider],
        "oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );

      // 팝업이 차단되었거나 생성에 실패한 경우 처리
      if (!authWindow) {
        message.warning(
          "팝업이 차단되었어요. 팝업을 허용한 뒤 다시 시도해주세요."
        );
        setIsLoading(null);
        return;
      }

      // OAuth 창에서 `/oauth-callback.html` 페이지로 이동하면 인증 결과를 확인
      const onMessage = (event: MessageEvent) => {
        if (event.data.type === "oauth-callback") {
          window.removeEventListener("message", onMessage);
          // 콜백을 받았으므로 팝업 닫힘 감시 종료
          if (popupCheckIntervalId !== null)
            window.clearInterval(popupCheckIntervalId);
          checkAuthStatus();
        }
      };

      window.addEventListener("message", onMessage);

      // 팝업이 콜백 없이 닫혔는지 주기적으로 확인
      popupCheckIntervalId = window.setInterval(() => {
        if (authWindow.closed) {
          if (popupCheckIntervalId !== null)
            window.clearInterval(popupCheckIntervalId);
          window.removeEventListener("message", onMessage);
          setIsLoading(null);
        }
      }, 500);
    } catch (error) {
      message.error(`${provider} 로그인 중 오류가 발생했습니다.`);
      setIsLoading(null);
    }
  };

  const handleTestLoginClick = () => {
    handleSocialLogin("test");
  };
  const checkAuthStatus = async () => {
    try {
      const userService = UserService.getInstance();
      const user = await userService.getCurrentUser();
      userStore.setUser(user);

      if (user) {
        message.success("로그인이 성공했습니다!");

        // needsAdditionalInfo 확인
        if (user.needsAdditionalInfo) {
          navigate("/onboarding/organization-code", { replace: true });
        } else {
          // 이전에 있던 페이지로 이동
          const previousLocation = location.state?.previousLocation;
          if (previousLocation) {
            navigate(previousLocation, { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const socialButtons = [
    {
      provider: "naver" as const,
      icon: (
        <img src="/images/icons/naver.png" alt="Naver" className="w-5 h-5" />
      ),
      text: "네이버 계정으로 로그인",
      bgColor: "#ffffff",
      textColor: "#000000",
    },
    {
      provider: "kakao" as const,
      icon: (
        <img src="/images/icons/kakao.png" alt="Kakao" className="w-5 h-5" />
      ),
      text: "카카오 계정으로 로그인",
      bgColor: "#ffffff",
      textColor: "#000000",
    },
    {
      provider: "google" as const,
      icon: (
        <img src="/images/icons/google.png" alt="Google" className="w-5 h-5" />
      ),
      text: "구글 계정으로 로그인",
      bgColor: "#ffffff",
      textColor: "#000000",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(to bottom, #ffffff, #E4F2F2)" }}
    >
      {/* 중앙 흰색 카드 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm mx-4">
        {/* 로고와 제목 */}
        <div className="text-center mb-8">
          <div
            className="flex justify-center items-center mb-4 cursor-pointer"
            onClick={handleLogoClick}
          >
            <img
              src="/images/handi-logo.png"
              alt="Handi Logo"
              className="h-12 w-auto"
            />
          </div>
          <p className="text-gray-600 text-sm">계속하려면 로그인해주세요.</p>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div className="space-y-3 mb-8">
          {socialButtons.map((button) => (
            <Button
              key={button.provider}
              size="large"
              block
              className="h-12 flex items-center justify-center border-0 rounded-lg font-medium"
              style={{
                backgroundColor: button.bgColor,
                color: button.textColor,
                border: "1px solid #e5e7eb",
              }}
              onClick={() => handleSocialLogin(button.provider)}
              loading={isLoading === button.provider}
              disabled={isLoading !== null}
            >
              {/* 아이콘 */}
              <div className="mr-3">{button.icon}</div>

              {/* 텍스트 */}
              <span className="text-sm">{button.text}</span>
            </Button>
          ))}
        </div>

        {/* 하단 저작권 정보 */}
        <div
          className="text-center text-xs text-gray-500 space-y-1"
          onClick={handleTestLoginClick}
        >
          <p>© 2025 Handi, All Right reserved</p>
          <p>
            <a href="#" className="hover:text-gray-700">
              Terms of Use
            </a>
            {" · "}
            <a href="#" className="hover:text-gray-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
