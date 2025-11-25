import { LogoutOutlined, MenuOutlined, UserOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Layout } from "antd";
import { useNavigate } from "react-router";
import type { User } from "~/features/user/domain/User";
import { useMediaQuery } from "~/features/video-call/application/hooks/useMediaQuery";
import { useLayoutStore } from "../../../stores/layoutStore";
import { useUserStore } from "../../../stores/userStore";
import { Button } from "../../atoms";

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useUserStore();
  const navigate = useNavigate();
  const toggleMobileSidebar = useLayoutStore((s) => s.toggleMobileSidebar);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLogout = () => {
    logout();
  };

  const handleSettings = () => {
    navigate("/admin/users");
  };

  const handleLogoClick = () => {
    // 사용자별 메인 페이지로 이동
    if (user?.role === "nurse") {
      navigate("/nurse/dashboard");
    } else if (user?.role === "guardian") {
      navigate("/guardian/dashboard");
    } else if (user?.role === "admin") {
      navigate("/admin/users");
    } else {
      navigate("/");
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "로그아웃",
      onClick: handleLogout,
    },
  ];

  const getUserDisplayName = (user: User) => {
    if (user.role === "nurse") {
      return "간호사";
    } else if (user.role === "guardian") {
      return "보호자";
    } else if (user.role === "admin") {
      return "관리자";
    }
    return "게스트";
  };

  return (
    <AntHeader
      className="bg-white shadow-sm border-b border-gray-200 !px-4 md:!px-8 flex items-center justify-between"
      style={{ backgroundColor: "white", color: "black" }}
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            aria-label="사이드바 열기"
            onClick={toggleMobileSidebar}
            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 active:bg-gray-200"
          >
            <MenuOutlined className="text-xl" />
          </button>
        )}
        <div
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        >
          <img
            src="/images/handi-logo.png"
            alt="Handi Logo"
            className="h-8 w-auto mr-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated && user ? (
          <>
            {/* 사용자 프로필 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-lg">
                <Avatar icon={<UserOutlined />} size="small" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-200">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getUserDisplayName(user)}
                  </span>
                </div>
              </div>
            </Dropdown>
          </>
        ) : (
          <Button
            type="link"
            onClick={() =>
              navigate("/login", {
                state: { previousLocation: location.pathname },
              })
            }
            className="font-bold text-[#006d75] hover:text-[#00838f]"
            style={{
              fontFamily: "Pretendard",
              color: "#006d75 !important",
              fontWeight: "bold",
            }}
          >
            로그인
          </Button>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;
