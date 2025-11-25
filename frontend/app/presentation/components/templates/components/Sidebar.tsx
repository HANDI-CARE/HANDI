import {
  AppstoreOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DashboardOutlined,
  MenuOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { useMediaQuery } from "~/features/video-call/application/hooks/useMediaQuery";
import { UserRole } from "../../../../features/user/domain/User";
import { useLayoutStore } from "../../../stores/layoutStore";
import { useUserStore } from "../../../stores/userStore";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated } = useUserStore();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isMobileSidebarOpen, closeMobileSidebar } = useLayoutStore();

  const nurseMenuItems: MenuItem[] = [
    {
      key: "dashboard",
      icon: <ClockCircleOutlined />,
      label: <Link to="/nurse/dashboard">대시보드</Link>,
    },
    {
      key: "patients",
      icon: <UserOutlined />,
      label: <Link to="/nurse/patients">시니어 목록</Link>,
    },
    {
      key: "consultation",
      icon: <AppstoreOutlined />,
      label: "상담 일정",
      children: [
        {
          key: "consultation-dashboard",
          label: <Link to="/nurse/consultation">상담 일정 조회</Link>,
        },
        {
          key: "consultation-reservation",
          label: <Link to="/nurse/consultation-schedules">상담 일정 관리</Link>,
        },
      ],
    },
    {
      key: "hospital",
      icon: <AppstoreOutlined />,
      label: "진료 일정",
      children: [
        {
          key: "hospital-schedules",
          label: <Link to="/nurse/hospital-schedules">진료 일정 조회</Link>,
        },
        {
          key: "hospital-schedules-management",
          label: (
            <Link to="/nurse/hospital-schedules-management">
              진료 일정 관리
            </Link>
          ),
        },
      ],
    },
  ];

  const guardianMenuItems: MenuItem[] = [
    {
      key: "dashboard",
      icon: <ClockCircleOutlined />,
      label: <Link to="/guardian/dashboard">대시보드</Link>,
    },
    {
      key: "consultation",
      icon: <AppstoreOutlined />,
      label: "원격 상담",
      children: [
        {
          key: "consultation-dashboard",
          label: <Link to="/guardian/consultation">상담 일정 조회</Link>,
        },
        {
          key: "consultation-reservation",
          label: (
            <Link to="/guardian/consultation-schedules">상담 일정 관리</Link>
          ),
        },
      ],
    },
    {
      key: "hospital",
      icon: <AppstoreOutlined />,
      label: "진료 일정",
      children: [
        {
          key: "hospital-schedules",
          label: <Link to="/guardian/hospital-schedules">진료 일정 조회</Link>,
        },
      ],
    },
  ];

  const adminMenuItems: MenuItem[] = [
    {
      key: "management",
      icon: <TeamOutlined />,
      label: "기관 관리",
      children: [
        {
          key: "admin-users",
          label: <Link to="/admin/users">사용자 관리</Link>,
        },
        {
          key: "admin-seniors",
          label: <Link to="/admin/seniors">시니어 관리</Link>,
        },
        {
          key: "admin-organization",
          label: <Link to="/admin/organization">기관 설정</Link>,
        },
      ],
    },
  ];

  const guestMenuItems: MenuItem[] = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: <Link to="/">홈</Link>,
    },
    {
      key: "/login",
      icon: <UserOutlined />,
      label: (
        <Link to="/login" state={{ previousLocation: location.pathname }}>
          로그인
        </Link>
      ),
    },
  ];

  const menuItems = !isAuthenticated
    ? guestMenuItems
    : user?.role === UserRole.NURSE
    ? nurseMenuItems
    : user?.role === UserRole.GUARDIAN
    ? guardianMenuItems
    : user?.role === UserRole.ADMIN
    ? adminMenuItems
    : guestMenuItems;

  // 현재 경로에 따라 선택된 메뉴 키를 결정
  const getSelectedKeys = () => {
    const path = location.pathname;

    // Nurse routes
    if (path.includes("/nurse/dashboard")) return ["dashboard"];
    if (path.includes("/nurse/patients")) return ["patients"];
    if (
      path.includes("/nurse/consultation") &&
      !path.includes("/consultation-schedules")
    ) {
      return ["consultation-dashboard"];
    }
    if (path.includes("/nurse/consultation-schedules"))
      return ["consultation-reservation"];
    if (path.includes("/nurse/hospital-schedules-management"))
      return ["hospital-schedules-management"];
    if (path.includes("/nurse/hospital-schedules"))
      return ["hospital-schedules"];

    // Guardian routes
    if (path.includes("/guardian/dashboard")) return ["dashboard"];
    if (path.includes("/guardian/patients")) return ["patients"];
    if (
      path.includes("/guardian/consultation") &&
      !path.includes("/consultation-schedules")
    ) {
      return ["consultation-dashboard"];
    }
    if (path.includes("/guardian/consultation-schedules"))
      return ["consultation-reservation"];
    if (path.includes("/guardian/hospital-schedules"))
      return ["hospital-schedules"];

    // Admin routes
    if (path.includes("/admin/users")) return ["admin-users"];
    if (path.includes("/admin/seniors")) return ["admin-seniors"];
    if (path.includes("/admin/organization")) return ["admin-organization"];

    return [path];
  };

  // 현재 경로에 따라 열린 서브메뉴를 결정
  const getOpenKeys = () => {
    const path = location.pathname;

    // Nurse routes
    if (path.includes("/nurse/dashboard")) return ["dashboard"];
    if (path.includes("/nurse/patients")) return ["patients"];
    if (
      path.includes("/nurse/consultation") ||
      path.includes("/nurse/consultation-schedules")
    ) {
      return ["consultation"];
    }
    if (
      path.includes("/nurse/hospital-schedules") ||
      path.includes("/nurse/hospital-schedules-management")
    ) {
      return ["hospital"];
    }

    // Guardian routes
    if (path.includes("/guardian/dashboard")) return ["dashboard"];
    if (path.includes("/guardian/patients")) return ["patients"];
    if (
      path.includes("/guardian/consultation") ||
      path.includes("/guardian/consultation-schedules")
    ) {
      return ["consultation"];
    }
    if (path.includes("/guardian/hospital-schedules")) return ["hospital"];

    // Admin routes
    if (
      path.includes("/admin/users") ||
      path.includes("/admin/seniors") ||
      path.includes("/admin/organization")
    ) {
      return ["management"];
    }

    return [];
  };

  if (isMobile) {
    if (!isMobileSidebarOpen) return null;
    return (
      <div className="fixed inset-0 z-[10000]">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeMobileSidebar}
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-white shadow-2xl border border-gray-200">
            <button
              aria-label="사이드바 닫기"
              onClick={closeMobileSidebar}
              className="absolute right-3 top-3 inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
            >
              <CloseOutlined />
            </button>
            <div className="p-4" />
            <Menu
              mode="inline"
              selectedKeys={getSelectedKeys()}
              defaultOpenKeys={getOpenKeys()}
              items={menuItems}
              onClick={closeMobileSidebar}
              className="border-r-0 custom-sidebar-menu px-2 pb-4"
              style={
                {
                  "--ant-primary-color": "#08979c",
                  "--ant-primary-color-hover": "#08979c",
                  "--ant-primary-color-active": "#08979c",
                  "--ant-menu-item-selected-bg": "#08979c",
                  "--ant-menu-item-selected-color": "#ffffff",
                  "--ant-menu-submenu-title-color": "#000000",
                  "--ant-menu-submenu-title-hover-color": "#000000",
                  "--ant-menu-submenu-title-selected-color": "#ffffff",
                  "--ant-menu-submenu-title-selected-bg": "#08979c",
                  "--ant-menu-item-active-bg": "#08979c",
                  "--ant-menu-item-hover-bg": "#e6fffb",
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      theme="light"
      className="border-r border-gray-200"
      width={256}
    >
      <div className="p-4" />

      <Menu
        mode="inline"
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        className="border-r-0 custom-sidebar-menu"
        style={
          {
            "--ant-primary-color": "#08979c",
            "--ant-primary-color-hover": "#08979c",
            "--ant-primary-color-active": "#08979c",
            "--ant-menu-item-selected-bg": "#08979c",
            "--ant-menu-item-selected-color": "#ffffff",
            "--ant-menu-submenu-title-color": "#000000",
            "--ant-menu-submenu-title-hover-color": "#000000",
            "--ant-menu-submenu-title-selected-color": "#ffffff",
            "--ant-menu-submenu-title-selected-bg": "#08979c",
            "--ant-menu-item-active-bg": "#08979c",
            "--ant-menu-item-hover-bg": "#e6fffb",
          } as React.CSSProperties
        }
      />

      {/* 하단 메뉴 토글 아이콘 */}
      <div className="absolute bottom-4 left-4">
        <MenuOutlined className="text-gray-500 cursor-pointer" />
      </div>
    </Sider>
  );
};

export default Sidebar;
