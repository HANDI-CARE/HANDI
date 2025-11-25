import { CheckCircleOutlined } from "@ant-design/icons";
import {
  Button,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { UserService } from "~/features/user/application/services/UserService";
import type { User } from "~/features/user/domain/User";
import { useUserStore } from "~/presentation/stores/userStore";

const { Text } = Typography;

interface AdditionalInfoForm {
  name: string;
  phoneNumber: string;
  address: string;
}

export default function AdditionalInfo() {
  const [form] = Form.useForm<AdditionalInfoForm>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 온보딩 저장값
  const onboarding = useUserStore((s) => s.onboarding);
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);

  const organizationId = onboarding?.organizationId;
  const organizationName = onboarding?.organizationName;
  const roleDto = onboarding?.role; // EMPLOYEE | GUARDIAN | ADMIN

  const savedUserRef = useRef<User>(null);

  useEffect(() => {
    if (!organizationId || !roleDto) {
      // 온보딩 정보가 없으면 1단계로 되돌림
      navigate("/onboarding/organization-code");
    }
  }, [organizationId, roleDto, navigate]);

  const roleLabel = useMemo(() => {
    if (!roleDto) return "";
    if (roleDto === "EMPLOYEE") return "근로자";
    if (roleDto === "GUARDIAN") return "보호자";
    if (roleDto === "ADMIN") return "관리자";
    return roleDto;
  }, [roleDto]);

  const handleSubmit = async (values: AdditionalInfoForm) => {
    setIsLoading(true);
    try {
      const userService = UserService.getInstance();
      const payload = {
        name: values.name,
        phoneNumber: values.phoneNumber,
        organizationId: organizationId!,
        role: roleDto!,
        profileImageUrl: user?.profileImageUrl || "",
        address: values.address,
      };
      savedUserRef.current = await userService.setUserInfo(payload);
      message.success("정보가 성공적으로 저장되었습니다!");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error saving additional info:", error);
      message.error("정보 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    setUser(savedUserRef.current!);
  };

  const handleLogoClick = () => navigate("/");

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-teal-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg mx-4">
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
            <p className="text-gray-600 text-sm">필수 정보를 입력해주세요.</p>
          </div>

          <Descriptions
            className="!mb-4"
            title="가입 정보"
            column={1}
            size="small"
            bordered
            styles={{
              label: { width: 128 },
            }}
          >
            <Descriptions.Item label="기관명">
              {organizationName || "로딩중"}
            </Descriptions.Item>
            <Descriptions.Item label="가입 역할">{roleLabel}</Descriptions.Item>
          </Descriptions>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            className="mb-8"
          >
            <Form.Item
              name="name"
              label={<span>이름</span>}
              rules={[{ required: true, message: "이름을 입력해주세요" }]}
            >
              <Input placeholder="홍길동" className="h-12 rounded-lg" />
            </Form.Item>

            <Form.Item
              name="phoneNumber"
              label={<span>전화번호</span>}
              rules={[
                { required: true, message: "전화번호를 입력해주세요" },
                {
                  pattern: /^[0-9-]+$/,
                  message: "올바른 전화번호를 입력해주세요",
                },
              ]}
            >
              <Input placeholder="01012345678" className="h-12 rounded-lg" />
            </Form.Item>

            <Form.Item
              name="address"
              label={<span>주소</span>}
              rules={[{ required: true, message: "주소를 입력해주세요" }]}
            >
              <Input placeholder="서울시 강남구" className="h-12 rounded-lg" />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
                className="h-12 rounded-lg bg-cyan-600 border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700"
              >
                저장
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center text-xs text-gray-500 space-y-1">
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

      <Modal
        open={showSuccessModal}
        footer={null}
        closable={false}
        maskClosable={false}
        width={400}
        centered
      >
        <div className="text-center py-8">
          <div className="mb-6">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#f0f8ff" }}
            >
              <CheckCircleOutlined
                className="text-4xl"
                style={{ color: "#1890ff" }}
              />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            회원가입이 완료되었습니다!
          </h2>
          <p className="text-gray-600 text-sm mb-8">
            Handi의 서비스를 편하게 이용해보세요.
          </p>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleSuccessConfirm}
            className="h-12 rounded-lg bg-cyan-600 border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700"
          >
            확인
          </Button>
        </div>
      </Modal>
    </>
  );
}
