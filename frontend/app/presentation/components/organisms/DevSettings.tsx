import {
  BranchesOutlined,
  DeleteOutlined,
  SaveOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  notification,
  Select,
  Switch,
  Tabs,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import type { User } from "../../../features/user/domain/User";
import { UserRole } from "../../../features/user/domain/User";
import { useDevSettingsStore } from "../../stores/devSettingsStore";
import { useUserStore } from "../../stores/userStore";

export default function DevSettings() {
  const { user, setUser, removeUser } = useUserStore();
  const { routeGuardEnabled, setRouteGuardEnabled } = useDevSettingsStore();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<User>();

  const roleOptions = useMemo(
    () => [
      { label: "nurse", value: UserRole.NURSE },
      { label: "guardian", value: UserRole.GUARDIAN },
      { label: "admin", value: UserRole.ADMIN },
    ],
    []
  );

  useEffect(() => {
    if (open) {
      form.setFieldsValue(user ?? ({} as User));
    }
  }, [open, user, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const updatedUser: User = {
        id: values.id ?? 0,
        oauthUserId: values.oauthUserId ?? 0,
        organizationId: values.organizationId ?? 0,
        role: values.role ?? UserRole.GUARDIAN,
        name: values.name ?? "",
        email: values.email ?? "",
        phoneNumber: values.phoneNumber ?? "",
        profileImageUrl: values.profileImageUrl ?? "",
        address: values.address ?? "",
        fcmToken: values.fcmToken ?? "",
        needsAdditionalInfo: Boolean(values.needsAdditionalInfo),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUser(updatedUser);
      message.success("유저 정보가 저장되었습니다.");
      setOpen(false);
    } catch (err) {
      // validation error is handled by antd form
    }
  };

  const handleRemove = async () => {
    await removeUser();
    message.success("유저 정보가 삭제되었습니다.");
    setOpen(false);
  };

  const handleRouteGuardToggle = (enabled: boolean) => {
    setRouteGuardEnabled(enabled);

    if (!enabled) {
      notification.info({
        message: "라우트 보호 비활성화",
        description:
          "라우트 보호가 비활성화되었습니다. 이제 권한이 없는 페이지에 접근할 수 있습니다.",
        placement: "topRight",
        duration: 4,
      });
    } else {
      notification.success({
        message: "라우트 보호 활성화",
        description:
          "라우트 보호가 활성화되었습니다. 권한이 없는 페이지 접근 시 리다이렉트됩니다.",
        placement: "topRight",
        duration: 4,
      });
    }
  };

  const items = [
    {
      key: "user",
      label: (
        <span>
          <UserOutlined />
          사용자 정보
        </span>
      ),
      children: (
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            좌측 하단 버튼은 언제나 표시됩니다. 아래 폼에서 `user` 정보를 직접
            수정하거나 삭제할 수 있습니다.
          </Typography.Paragraph>
          <Divider style={{ margin: "8px 0 16px" }} />

          <Form<User> form={form} layout="vertical" initialValues={user ?? {}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item<User> label="ID" name="id">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item<User> label="OAuth User ID" name="oauthUserId">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item<User> label="Organization ID" name="organizationId">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item<User> label="Role" name="role">
                <Select options={roleOptions} allowClear />
              </Form.Item>

              <Form.Item<User> label="Name" name="name">
                <Input />
              </Form.Item>
              <Form.Item<User> label="Email" name="email">
                <Input />
              </Form.Item>
              <Form.Item<User> label="Phone Number" name="phoneNumber">
                <Input />
              </Form.Item>
              <Form.Item<User> label="Profile Image URL" name="profileImageUrl">
                <Input />
              </Form.Item>
              <Form.Item<User> label="Address" name="address">
                <Input />
              </Form.Item>
              <Form.Item<User> label="FCM Token" name="fcmToken">
                <Input />
              </Form.Item>
              <Form.Item<User>
                label="추가정보 필요 (needsAdditionalInfo)"
                name="needsAdditionalInfo"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </div>
          </Form>
        </>
      ),
    },
    {
      key: "routing",
      label: (
        <span>
          <BranchesOutlined />
          라우팅
        </span>
      ),
      children: (
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            라우팅 관련 설정을 관리할 수 있습니다. 라우트 보호를 비활성화하면
            권한이 없는 페이지에 접근할 수 있습니다.
          </Typography.Paragraph>
          <Divider style={{ margin: "8px 0 16px" }} />

          <div className="space-y-4">
            <Card
              styles={{
                body: {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            >
              <div className="flex-1">
                <Typography.Title level={5} style={{ margin: 0 }}>
                  라우트 보호
                </Typography.Title>
                <Typography.Text type="secondary">
                  권한이 없는 페이지 접근 시 자동 리다이렉트를
                  활성화/비활성화합니다.
                </Typography.Text>
              </div>
              <Switch
                checked={routeGuardEnabled}
                onChange={handleRouteGuardToggle}
              />
            </Card>

            <div className="p-4 bg-gray-50 rounded-lg">
              <Typography.Title level={5} style={{ margin: "0 0 8px 0" }}>
                현재 상태
              </Typography.Title>
              <Typography.Text>
                라우트 보호:{" "}
                <strong>{routeGuardEnabled ? "활성화" : "비활성화"}</strong>
              </Typography.Text>
              {!routeGuardEnabled && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                  <Typography.Text>
                    ⚠️ 라우트 보호가 비활성화되어 있습니다. 권한이 없는 페이지에
                    접근할 수 있습니다.
                  </Typography.Text>
                </div>
              )}
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <div className="opacity-0 fixed right-6 bottom-6 z-9999">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<SettingOutlined />}
          onClick={() => setOpen(true)}
          aria-label="개발자 설정"
        />
      </div>

      <Modal
        title="개발자 설정"
        open={open}
        onCancel={() => setOpen(false)}
        footer={[
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            onClick={handleRemove}
          >
            유저 삭제
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            저장
          </Button>,
        ]}
        width={800}
        destroyOnHidden
      >
        <Tabs items={items} />
      </Modal>
    </>
  );
}
