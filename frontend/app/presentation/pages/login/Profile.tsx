import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useState } from "react";
import { useNavigate } from "react-router";
import { LoginSteps } from "../../components/atoms/LoginSteps";

const { Title, Text } = Typography;
const { Option } = Select;

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  role: string;
  department?: string;
  licenseNumber?: string;
  profileImage?: UploadFile[];
}

export default function Profile() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (values: ProfileForm) => {
    setIsLoading(true);

    try {
      // 백엔드 API 호출
      // TODO: 프로필 업데이트 기능 추후 구현 예정
      /*
      const { AuthService } = await import(
        "../../../features/auth/application/services/AuthService"
      );
      await AuthService.updateProfile({
        name: values.name,
        email: values.email,
        phone: values.phone,
        birthDate: values.birthDate,
        gender: values.gender,
        department: values.department,
        licenseNumber: values.licenseNumber,
      });

      // 프로필 정보를 로컬 스토리지에 저장
      localStorage.setItem(
        "userProfile",
        JSON.stringify({
          ...values,
          completedAt: new Date().toISOString(),
        })
      );
      */

      message.success("프로필이 성공적으로 저장되었습니다!");
      setCurrentStep(1);
    } catch (error) {
      message.error("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    navigate("/login");
  };

  const roleOptions = [
    { value: "nurse", label: "간호사" },
    { value: "caregiver", label: "간병인" },
    { value: "family", label: "가족" },
  ];

  const departmentOptions = [
    { value: "internal", label: "내과" },
    { value: "surgery", label: "외과" },
    { value: "pediatrics", label: "소아과" },
    { value: "emergency", label: "응급실" },
    { value: "icu", label: "중환자실" },
    { value: "general", label: "일반" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(to bottom, #ffffff, #b5f5ec)" }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
              <UserOutlined className="text-white text-xl" />
            </div>
            <Title level={2} className="ml-3 mb-0">
              Handi
            </Title>
          </div>
          <Text type="secondary">
            프로필 정보를 입력하여 서비스를 완전히 설정하세요
          </Text>
        </div>

        {/* Steps */}
        <div className="mb-8">
          <LoginSteps current={currentStep} size="small" />
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          {currentStep === 0 ? (
            <div>
              <div className="text-center mb-6">
                <Title level={4}>프로필 정보 입력</Title>
                <Text type="secondary">
                  서비스 이용을 위한 기본 정보를 입력해주세요
                </Text>
              </div>

              <Form
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                size="large"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="name"
                    label="이름"
                    rules={[{ required: true, message: "이름을 입력해주세요" }]}
                  >
                    <Input placeholder="홍길동" prefix={<UserOutlined />} />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="이메일"
                    rules={[
                      { required: true, message: "이메일을 입력해주세요" },
                      {
                        type: "email",
                        message: "올바른 이메일 형식을 입력해주세요",
                      },
                    ]}
                  >
                    <Input
                      placeholder="example@email.com"
                      prefix={<MailOutlined />}
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="전화번호"
                    rules={[
                      { required: true, message: "전화번호를 입력해주세요" },
                    ]}
                  >
                    <Input
                      placeholder="010-1234-5678"
                      prefix={<PhoneOutlined />}
                    />
                  </Form.Item>

                  <Form.Item
                    name="birthDate"
                    label="생년월일"
                    rules={[
                      { required: true, message: "생년월일을 선택해주세요" },
                    ]}
                  >
                    <DatePicker
                      placeholder="생년월일 선택"
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>

                  <Form.Item
                    name="gender"
                    label="성별"
                    rules={[{ required: true, message: "성별을 선택해주세요" }]}
                  >
                    <Radio.Group>
                      <Radio value="MALE">남성</Radio>
                      <Radio value="FEMALE">여성</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    name="role"
                    label="역할"
                    rules={[{ required: true, message: "역할을 선택해주세요" }]}
                  >
                    <Select placeholder="역할 선택">
                      {roleOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) =>
                    prevValues.role !== currentValues.role
                  }
                >
                  {({ getFieldValue }) => {
                    const role = getFieldValue("role");

                    if (role === "nurse") {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Form.Item
                            name="department"
                            label="소속 부서"
                            rules={[
                              {
                                required: true,
                                message: "소속 부서를 선택해주세요",
                              },
                            ]}
                          >
                            <Select placeholder="부서 선택">
                              {departmentOptions.map((option) => (
                                <Option key={option.value} value={option.value}>
                                  {option.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item
                            name="licenseNumber"
                            label="면허번호"
                            rules={[
                              {
                                required: true,
                                message: "면허번호를 입력해주세요",
                              },
                            ]}
                          >
                            <Input placeholder="면허번호 입력" />
                          </Form.Item>
                        </div>
                      );
                    }
                    return null;
                  }}
                </Form.Item>

                <Form.Item name="profileImage" label="프로필 이미지">
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={() => false}
                  >
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>업로드</div>
                    </div>
                  </Upload>
                </Form.Item>

                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                    icon={<ArrowRightOutlined />}
                  >
                    프로필 저장
                  </Button>
                </Form.Item>
              </Form>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
                <Title level={4} className="text-green-600">
                  프로필 설정 완료!
                </Title>
                <Text type="secondary">
                  모든 설정이 완료되었습니다. 이제 Handi 서비스를 이용하실 수
                  있습니다.
                </Text>
              </div>

              <Space direction="vertical" className="w-full">
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleComplete}
                  icon={<ArrowRightOutlined />}
                >
                  로그인으로 이동
                </Button>
                <Button
                  size="large"
                  block
                  onClick={() => {
                    setCurrentStep(0);
                    form.resetFields();
                  }}
                >
                  프로필 다시 설정
                </Button>
              </Space>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <Text type="secondary" className="text-sm">
            © 2024 Handi. 모든 권리 보유.
          </Text>
        </div>
      </div>
    </div>
  );
}
