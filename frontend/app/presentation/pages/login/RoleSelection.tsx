import {
  ArrowRightOutlined,
  HeartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
  message,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import { LoginSteps } from "../../components/atoms/LoginSteps";

const { Title, Text } = Typography;

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      // 선택된 역할을 로컬 스토리지에 저장
      localStorage.setItem("selectedRole", selectedRole);
      navigate("/organization-code");
    } else {
      message.warning("역할을 선택해주세요.");
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const roles = [
    {
      key: "nurse",
      title: "근로자",
      icon: <UserOutlined />,
      description: "시니어 케어 계획 및 태스크 관리",
      features: [
        "시니어 상태 모니터링",
        "케어 계획 수립",
        "의료 기록 관리",
        "상담 일정 관리",
      ],
      color: "bg-blue-500",
    },
    {
      key: "guardian",
      title: "보호자",
      icon: <HeartOutlined />,
      description: "시니어 상태 모니터링 및 케어 지원",
      features: [
        "시니어 상태 확인",
        "상담 일정 확인",
        "의료진과 소통",
        "케어 기록 확인",
      ],
      color: "bg-green-500",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(to bottom, #ffffff, #b5f5ec)" }}
    >
      <div className="max-w-4xl w-full px-8">
        {/* Header */}
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
          <Text type="secondary">스마트 돌봄 케어, Handi에 어서오세요!</Text>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <LoginSteps current={0} size="small" />
        </div>

        <Row gutter={[24, 24]} className="mb-12">
          {roles.map((role) => (
            <Col xs={24} md={12} key={role.key}>
              <Card
                hoverable
                style={{
                  borderColor:
                    selectedRole === role.key ? "#60a5fa" : undefined,
                  backgroundColor:
                    selectedRole === role.key ? "#eff6ff" : undefined,
                  boxShadow:
                    selectedRole === role.key
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                      : undefined,
                }}
                className="text-center cursor-pointer transition-all h-full"
                onClick={() => handleRoleSelect(role.key)}
              >
                <Avatar
                  size={80}
                  icon={role.icon}
                  className={`${role.color} mb-6`}
                />
                <Title level={3} className="mb-3">
                  {role.title}
                </Title>
                <Text type="secondary" className="block mb-6">
                  {role.description}
                </Text>

                <div className="space-y-2 text-sm text-gray-600">
                  {role.features.map((feature, index) => (
                    <div key={index}>• {feature}</div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center">
          <Space direction="vertical" size="large">
            <Button
              type={selectedRole ? "primary" : "default"}
              size="large"
              onClick={handleContinue}
              icon={selectedRole ? <ArrowRightOutlined /> : null}
              className={`px-8 py-2 h-12 text-lg ${
                selectedRole
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-white border-gray-300 hover:bg-gray-50 text-gray-500"
              }`}
              disabled={!selectedRole}
            >
              다음 단계로 진행
            </Button>
            <Button type="link" onClick={() => navigate("/")}>
              뒤로 가기
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
