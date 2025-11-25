import {
  ArrowRightOutlined,
  BuildOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import { UserService } from "~/features/user/application/services/UserService";
import { useUserStore } from "~/presentation/stores/userStore";

const { Title, Text } = Typography;

interface OrganizationCodeForm {
  organizationCode: string;
}

export default function OrganizationCode() {
  const [form] = Form.useForm<OrganizationCodeForm>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setOrganizationId = useUserStore((s) => s.setOnboardingOrganizationId);
  const setOrganizationName = useUserStore(
    (s) => s.setOnboardingOrganizationName
  );
  const setRoleDto = useUserStore((s) => s.setOnboardingRoleDto);
  const setUser = useUserStore((s) => s.setUser);

  const handleSubmit = async (values: OrganizationCodeForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const userService = UserService.getInstance();
      // 1) 기관코드 검증 API 호출
      const verify = await userService.verifyOrganizationCode(
        values.organizationCode
      );
      // 2) 온보딩 임시 값 저장(기관/역할)
      setOrganizationId(verify.organizationId);
      setOrganizationName(verify.organizationName);
      setRoleDto(verify.role);
      // 3) 리다이렉트
      navigate("/onboarding/additional-info");
    } catch (e: any) {
      console.error(e);
      setError("기관코드 검증에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoClick = () => navigate("/");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-cyan-100">
      <div className="w-full max-w-md">
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
          <Text type="secondary">소속 기관을 확인하여 서비스를 시작하세요</Text>
        </div>

        <Card className="shadow-lg">
          <div className="text-center mb-6">
            <Title level={4}>기관코드를 입력해주세요.</Title>
            <Text type="secondary">
              소속 기관에서 발급받은 고유 코드를 입력해주세요
            </Text>
          </div>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="organizationCode"
              label="기관코드"
              rules={[
                { required: true, message: "기관코드를 입력해주세요" },
                { min: 3, message: "기관코드는 3자리 이상이어야 합니다" },
              ]}
            >
              <Input
                placeholder="기관코드 입력"
                prefix={<BuildOutlined />}
                maxLength={20}
              />
            </Form.Item>

            {error && (
              <Alert
                message="기관코드 검증 실패"
                description={error}
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
                className="mb-4"
              />
            )}

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
                icon={<ArrowRightOutlined />}
                className="h-12 rounded-lg bg-cyan-600 border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700"
              >
                기관코드 확인
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <div className="text-center mt-8">
          <Text type="secondary" className="text-sm">
            © 2025 Handi. 모든 권리 보유.
          </Text>
        </div>
      </div>
    </div>
  );
}
