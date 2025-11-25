import { PlusOutlined, ReloadOutlined, SendOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useRestoreAdminUser,
  useSendOrganizationCode,
  useUpdateAdminUser,
} from "../../../../features/admin/application/hooks/useAdmin";
import type { AdminUser } from "../../../../features/admin/domain/Admin";
import { AppLayout } from "../../../components/templates/AppLayout";

type SortDirection = "ASC" | "DESC";

export default function AdminUsersPage() {
  const navigate = useNavigate();

  // Filters & pagination state
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [keyword, setKeyword] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection | undefined>(
    "DESC"
  );
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [roleFilter, setRoleFilter] = useState<
    "EMPLOYEE" | "GUARDIAN" | "ADMIN" | undefined
  >(undefined);
  const sort = useMemo(
    () => [sortBy ?? "createdAt", sortDirection ?? "DESC"],
    [sortBy, sortDirection]
  );

  const { data, isLoading, refetch } = useAdminUsers({
    page,
    size,
    sort,
    keyword,
    sortBy,
    sortDirection,
    includeDeleted,
    role: roleFilter,
  });
  // 같은 id 중복 방지 (서버 중복 대응)
  const usersRaw = data?.users ?? [];
  const usersWithRowKey = useMemo(
    () =>
      usersRaw.map((u, idx) => ({
        ...u,
        __rowKey: `${u.id}-${u.oauthUserId}-${u.organizationId}-${idx}`,
      })),
    [usersRaw]
  );
  const pageInfo = data?.pageInfo;

  // Mutations
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();
  const restoreUser = useRestoreAdminUser();
  const createUser = useCreateAdminUser();
  const sendOrgCode = useSendOrganizationCode();

  // Create / Edit modal controls
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [inviteForm] = Form.useForm();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    if (editingUser && isEditOpen) {
      form.setFieldsValue({
        organizationId: editingUser.organizationId,
        role: editingUser.role,
        name: editingUser.name,
        email: editingUser.email,
        phoneNumber: editingUser.phoneNumber,
        profileImageUrl: editingUser.profileImageUrl,
        address: editingUser.address,
      });
    }
  }, [editingUser, isEditOpen, form]);

  const columns = [
    {
      title: "이름",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: AdminUser) => (
        <Space>
          <span className="font-medium">{text}</span>
          {record.isDeleted ? (
            <Tag color="red">삭제됨</Tag>
          ) : (
            <Tag color="green">정상</Tag>
          )}
        </Space>
      ),
    },
    { title: "이메일", dataIndex: "email", key: "email" },
    {
      title: "역할",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag
          color={
            role === "ADMIN"
              ? "volcano"
              : role === "EMPLOYEE"
              ? "blue"
              : "purple"
          }
        >
          {role}
        </Tag>
      ),
    },
    // { title: "기관ID", dataIndex: "organizationId", key: "organizationId" },
    { title: "연락처", dataIndex: "phoneNumber", key: "phoneNumber" },
    // {
    //   title: "생성일",
    //   dataIndex: "createdAt",
    //   key: "createdAt",
    //   render: (d: Date) => new Date(d).toLocaleString("ko-KR"),
    // },
    {
      title: "액션",
      key: "action",
      render: (_: any, record: AdminUser) => (
        <Space size="small" wrap>
          <Button
            size="small"
            onClick={() => navigate(`/admin/users/${record.id}`)}
          >
            상세
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setEditingUser(record);
              setIsEditOpen(true);
            }}
          >
            수정
          </Button>
          {!record.isDeleted ? (
            <Popconfirm
              title="사용자를 삭제하시겠습니까?"
              onConfirm={async () => {
                await deleteUser.mutateAsync(record.id);
                message.success("삭제되었습니다");
                refetch();
              }}
            >
              <Button size="small" danger>
                삭제
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              onClick={async () => {
                await restoreUser.mutateAsync(record.id);
                message.success("복구되었습니다");
                refetch();
              }}
            >
              복구
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
            <p className="text-gray-600 mt-1">
              관리자/직원/보호자 계정을 조회·생성·수정·삭제합니다.
            </p>
          </div>
          <Space>
            <Button
              icon={<SendOutlined />}
              onClick={() => setIsSendModalOpen(true)}
            >
              기관 코드 전송
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              새로고침
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
            >
              사용자 생성
            </Button>
          </Space>
        </div>

        <Card>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">키워드</span>
              <Input
                placeholder="이름/이메일 검색"
                allowClear
                value={keyword}
                onChange={(e) => setKeyword(e.target.value || undefined)}
                onPressEnter={() => setPage(1)}
                className="w-64"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">역할</span>
              <Select
                className="w-40"
                allowClear
                placeholder="전체"
                value={roleFilter}
                onChange={(v) => setRoleFilter(v)}
                options={[
                  { value: "EMPLOYEE", label: "EMPLOYEE" },
                  { value: "GUARDIAN", label: "GUARDIAN" },
                  { value: "ADMIN", label: "ADMIN" },
                ]}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">정렬 기준</span>
              <Select
                className="w-40"
                value={sortBy}
                onChange={(v) => setSortBy(v)}
                options={[
                  { value: "name", label: "이름" },
                  { value: "email", label: "이메일" },
                  { value: "createdAt", label: "생성일" },
                ]}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">정렬 방향</span>
              <Select
                className="w-32"
                value={sortDirection}
                onChange={(v) => setSortDirection(v)}
                options={[
                  { value: "ASC", label: "오름차순" },
                  { value: "DESC", label: "내림차순" },
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              <span className="text-sm">삭제 포함</span>
            </div>
            <Button type="primary" onClick={() => setPage(1)}>
              적용
            </Button>
          </div>
        </Card>

        <Card>
          <Table
            rowKey="__rowKey"
            loading={isLoading}
            columns={columns as any}
            dataSource={usersWithRowKey as any}
            pagination={{
              current: pageInfo?.page ?? page,
              pageSize: pageInfo?.size ?? size,
              total: pageInfo?.totalElements ?? usersWithRowKey.length,
              onChange: (p, s) => {
                setPage(p);
                setSize(s);
              },
            }}
          />
        </Card>

        <Modal
          open={isSendModalOpen}
          title="기관 코드 전송"
          footer={null}
          // maskClosable={true}
          onCancel={() => setIsSendModalOpen(false)}
        >
          <Form
            form={inviteForm}
            layout="inline"
            onFinish={async (values) => {
              await sendOrgCode.mutateAsync(values);
              message.success("초대 링크 전송 요청 완료");
              inviteForm.resetFields();
            }}
            style={{
              padding: "16px",
            }}
          >
            {/* 기관 ID는 서버가 토큰 기반으로 판별하므로 입력 제거 */}
            <Form.Item name="phoneNumber" rules={[{ required: true }]}>
              <Input placeholder="전화번호" className="w-44" />
            </Form.Item>
            <Form.Item
              className="w-28"
              name="role"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="역할"
                options={[
                  { value: "EMPLOYEE", label: "EMPLOYEE" },
                  { value: "ADMIN", label: "ADMIN" },
                  { value: "GUARDIAN", label: "GUARDIAN" },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                전송
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Create Modal */}
        <Modal
          title="사용자 생성"
          open={isCreateOpen}
          onCancel={() => setIsCreateOpen(false)}
          onOk={() => createForm.submit()}
          confirmLoading={createUser.isPending}
          okText="생성"
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={async (values) => {
              try {
                await createUser.mutateAsync(values);
                message.success("생성되었습니다");
                setIsCreateOpen(false);
                createForm.resetFields();
                setPage(1);
                refetch();
              } catch (e: any) {
                const msg =
                  e?.response?.data?.message ||
                  e?.message ||
                  "생성에 실패했습니다";
                message.error(msg);
              }
            }}
          >
            <Form.Item
              label="이메일"
              name="email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="이름" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              label="전화번호"
              name="phoneNumber"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="기관 ID"
              name="organizationId"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item label="역할" name="role" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "EMPLOYEE", label: "EMPLOYEE" },
                  { value: "ADMIN", label: "ADMIN" },
                  { value: "GUARDIAN", label: "GUARDIAN" },
                ]}
              />
            </Form.Item>
            <Form.Item label="프로필 이미지 URL" name="profileImageUrl">
              <Input />
            </Form.Item>
            <Form.Item label="주소" name="address">
              <Input />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="사용자 수정"
          open={isEditOpen}
          onCancel={() => setIsEditOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={updateUser.isPending}
          okText="저장"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              if (!editingUser) return;
              await updateUser.mutateAsync({
                id: editingUser.id,
                body: values,
              });
              message.success("수정되었습니다");
              setIsEditOpen(false);
              setEditingUser(null);
              refetch();
            }}
          >
            <Form.Item
              label="기관 ID"
              name="organizationId"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item label="역할" name="role" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "EMPLOYEE", label: "EMPLOYEE" },
                  { value: "ADMIN", label: "ADMIN" },
                  { value: "GUARDIAN", label: "GUARDIAN" },
                ]}
              />
            </Form.Item>
            <Form.Item label="이름" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              label="이메일"
              name="email"
              rules={[{ required: true, type: "email" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="전화번호"
              name="phoneNumber"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="프로필 이미지 URL" name="profileImageUrl">
              <Input />
            </Form.Item>
            <Form.Item label="주소" name="address">
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  );
}
