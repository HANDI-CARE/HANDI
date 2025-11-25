import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  useAddSeniorEmployeeRelations,
  useAddSeniorGuardianRelations,
  useCreateSenior,
  useDeleteSenior,
  useDeleteSeniorUserRelation,
  useOrganizationSeniors,
  useOrganizationUsers,
  useSearchSeniors,
  useUpdateSenior,
} from "../../../../features/admin/application/hooks/useAdmin";
import type { Senior } from "../../../../features/admin/domain/Senior";
import { AppLayout } from "../../../components/templates/AppLayout";

export default function AdminSeniorsPage() {
  const [organizationId, setOrganizationId] = useState<number>(1);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [keyword, setKeyword] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<string | undefined>("createdAt");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const sort = useMemo(
    () => [sortBy ?? "createdAt", sortDirection],
    [sortBy, sortDirection]
  );

  const listQuery = useOrganizationSeniors({
    page,
    size,
    sort,
    keyword,
    sortBy,
    sortDirection,
  });
  const searchQuery = useSearchSeniors({
    organizationId,
    name: keyword,
    isActive: undefined,
    page,
    size,
    sort,
  });
  const { data, isLoading, refetch } = isSearchMode ? searchQuery : listQuery;

  const seniors = data?.seniors ?? [];
  const pageInfo = data?.pageInfo;

  const updateSenior = useUpdateSenior();
  const deleteSenior = useDeleteSenior();
  const createSenior = useCreateSenior();
  const addGuardianRelations = useAddSeniorGuardianRelations();
  const addEmployeeRelations = useAddSeniorEmployeeRelations();
  const deleteSeniorUserRelation = useDeleteSeniorUserRelation();

  // 매칭 모달 사용자 목록 상태는 matchingSenior 선언 이후에 쿼리를 구성해야 함
  const [userKeyword, setUserKeyword] = useState<string | undefined>();
  const [userPage, setUserPage] = useState(1);
  const [userSize, setUserSize] = useState(10);
  // orgUsersQuery는 아래에서 선언됨. 관련 파생값은 선언 이후로 이동

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSenior, setEditingSenior] = useState<Senior | null>(null);
  const [isMatchOpen, setIsMatchOpen] = useState(false);
  const [matchingSenior, setMatchingSenior] = useState<Senior | null>(null);
  const [activeMatchTab, setActiveMatchTab] = useState<"GUARDIAN" | "EMPLOYEE">(
    "GUARDIAN"
  );
  // 사용자 검색/페이지네이션 상태 (상단 선언으로 훅 의존성 해결)
  // 주의: 동일 변수 재선언 방지
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const matchingOrgId = matchingSenior?.organizationId ?? organizationId;
  const orgUsersQuery = useOrganizationUsers({
    page: userPage,
    size: userSize,
    sort: ["name", "ASC"],
    keyword: userKeyword,
    sortBy: "name",
    sortDirection: "ASC",
  });

  const orgUsers = orgUsersQuery.data?.users ?? [];
  const orgUsersPageInfo = orgUsersQuery.data?.pageInfo;

  const columns = [
    { title: "이름", dataIndex: "name", key: "name" },
    {
      title: "성별",
      dataIndex: "gender",
      key: "gender",
      render: (g: string) => (
        <Tag color={g === "FEMALE" ? "pink" : "blue"}>{g}</Tag>
      ),
    },
    { title: "나이", dataIndex: "age", key: "age" },
    { title: "기관", dataIndex: "organizationName", key: "organizationName" },
    { title: "비고", dataIndex: "note", key: "note" },
    {
      title: "상태",
      dataIndex: "isActive",
      key: "isActive",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? "활성" : "비활성"}</Tag>
      ),
    },
    {
      title: "액션",
      key: "action",
      render: (_: any, record: Senior) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => {
              setEditingSenior(record);
              form.setFieldsValue({
                name: record.name,
                dischargeDate: record.dischargeDate
                  ? dayjs(record.dischargeDate)
                  : undefined,
                note: record.note,
                isActive: record.isActive,
              });
              setIsEditOpen(true);
            }}
          >
            수정
          </Button>
          <Button
            size="small"
            onClick={() => {
              setMatchingSenior(record);
              setIsMatchOpen(true);
              setActiveMatchTab("GUARDIAN");
              setSelectedUserIds([]);
              setUserKeyword(undefined);
              setUserPage(1);
              setUserSize(10);
            }}
          >
            매칭
          </Button>
          <Button
            size="small"
            danger
            onClick={async () => {
              await deleteSenior.mutateAsync(record.id);
              message.success("삭제되었습니다");
              refetch();
            }}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">시니어 관리</h1>
            <p className="text-gray-600 mt-1">
              기관 내 시니어(입소자) 정보를 관리합니다.
            </p>
          </div>
          <Space>
            <Button onClick={() => setIsCreateOpen(true)} type="primary">
              시니어 생성
            </Button>
          </Space>
        </div>

        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">기관 ID</span>
              <InputNumber
                value={organizationId}
                onChange={(v) => setOrganizationId(Number(v))}
                className="w-32"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">키워드</span>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value || undefined)}
                placeholder="이름 검색"
                className="w-64"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">정렬 기준</span>
              <Select
                className="w-40"
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: "name", label: "이름" },
                  { value: "createdAt", label: "생성일" },
                ]}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">정렬 방향</span>
              <Select
                className="w-32"
                value={sortDirection}
                onChange={setSortDirection}
                options={[
                  { value: "ASC", label: "오름차순" },
                  { value: "DESC", label: "내림차순" },
                ]}
              />
            </div>
            <Button type="primary" onClick={() => setPage(1)}>
              적용
            </Button>
            <Button onClick={() => setIsSearchMode((v) => !v)}>
              {isSearchMode ? "목록 모드" : "검색 모드"}
            </Button>
          </div>
        </Card>

        <Card>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={seniors}
            columns={columns as any}
            pagination={{
              current: pageInfo?.page ?? page,
              pageSize: pageInfo?.size ?? size,
              total: pageInfo?.totalElements,
              onChange: (p, s) => {
                setPage(p);
                setSize(s);
              },
            }}
          />
        </Card>

        {/* Create Modal */}
        <Modal
          title="시니어 생성"
          open={isCreateOpen}
          onCancel={() => setIsCreateOpen(false)}
          onOk={() => createForm.submit()}
          okText="생성"
          confirmLoading={createSenior.isPending}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={async (values) => {
              await createSenior.mutateAsync({
                birthDate: values.birthDate.format("YYYY-MM-DD"),
                gender: values.gender,
                name: values.name,
                organizationId: values.organizationId,
                admissionDate: values.admissionDate.format("YYYY-MM-DD"),
                note: values.note,
              });
              message.success("생성되었습니다");
              setIsCreateOpen(false);
              createForm.resetFields();
              refetch();
            }}
          >
            <Form.Item label="이름" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="성별" name="gender" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "FEMALE", label: "여성" },
                  { value: "MALE", label: "남성" },
                ]}
              />
            </Form.Item>
            <Form.Item
              label="기관 ID"
              name="organizationId"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" />
            </Form.Item>
            <Form.Item
              label="입소일"
              name="admissionDate"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              label="생년월일"
              name="birthDate"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="비고" name="note">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="시니어 수정"
          open={isEditOpen}
          onCancel={() => setIsEditOpen(false)}
          onOk={() => form.submit()}
          okText="저장"
          confirmLoading={updateSenior.isPending}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              if (!editingSenior) return;
              await updateSenior.mutateAsync({
                seniorId: editingSenior.id,
                body: {
                  name: values.name,
                  dischargeDate: values.dischargeDate?.format("YYYY-MM-DD"),
                  note: values.note,
                  isActive: values.isActive,
                },
              });
              message.success("수정되었습니다");
              setIsEditOpen(false);
              setEditingSenior(null);
              refetch();
            }}
          >
            <Form.Item label="이름" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="퇴소일" name="dischargeDate">
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item label="비고" name="note">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item label="활성" name="isActive">
              <Select
                options={[
                  { value: true, label: "활성" },
                  { value: false, label: "비활성" },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Match Modal */}
        <Modal
          title={
            matchingSenior
              ? `시니어 매칭: ${matchingSenior.name}`
              : "시니어 매칭"
          }
          open={isMatchOpen}
          onCancel={() => setIsMatchOpen(false)}
          footer={null}
          width={900}
        >
          <div className="mb-3 flex items-end gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">사용자 검색</span>
              <Input
                placeholder="이름/이메일"
                allowClear
                value={userKeyword}
                onChange={(e) => setUserKeyword(e.target.value || undefined)}
                className="w-64"
              />
            </div>
            <Button
              type="primary"
              onClick={() => {
                setUserPage(1);
                orgUsersQuery.refetch();
              }}
            >
              검색
            </Button>
          </div>
          <Tabs
            activeKey={activeMatchTab}
            onChange={(k) => {
              setActiveMatchTab(k as any);
              setSelectedUserIds([]);
              setUserPage(1);
              setUserKeyword(undefined);
            }}
            items={[
              { key: "GUARDIAN", label: "보호자" },
              { key: "EMPLOYEE", label: "근로자" },
            ]}
          />
          <Table
            rowKey="id"
            loading={orgUsersQuery.isLoading}
            dataSource={orgUsers.filter(
              (u) =>
                u.role ===
                (activeMatchTab === "GUARDIAN" ? "GUARDIAN" : "EMPLOYEE")
            )}
            pagination={{
              current: orgUsersPageInfo?.page ?? userPage,
              pageSize: orgUsersPageInfo?.size ?? userSize,
              total: orgUsersPageInfo?.totalElements,
              onChange: (p, s) => {
                setUserPage(p);
                setUserSize(s);
              },
            }}
            rowSelection={{
              selectedRowKeys: selectedUserIds,
              onChange: (keys) => setSelectedUserIds(keys as number[]),
            }}
            columns={
              [
                { title: "이름", dataIndex: "name" },
                { title: "이메일", dataIndex: "email" },
                { title: "역할", dataIndex: "role" },
                {
                  title: "액션",
                  key: "action",
                  render: (_: any, user: any) => (
                    <Button
                      size="small"
                      onClick={async () => {
                        if (!matchingSenior) return;
                        await deleteSeniorUserRelation.mutateAsync({
                          seniorId: matchingSenior.id,
                          userId: user.id,
                        });
                        message.success("관계 해제 완료");
                      }}
                    >
                      연결 해제
                    </Button>
                  ),
                },
              ] as any
            }
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button onClick={() => setIsMatchOpen(false)}>닫기</Button>
            <Button
              type="primary"
              disabled={!matchingSenior || selectedUserIds.length === 0}
              loading={
                addGuardianRelations.isPending || addEmployeeRelations.isPending
              }
              onClick={async () => {
                if (!matchingSenior) return;
                try {
                  if (activeMatchTab === "GUARDIAN") {
                    await addGuardianRelations.mutateAsync({
                      seniorId: matchingSenior.id,
                      guardianIds: selectedUserIds,
                    });
                  } else {
                    await addEmployeeRelations.mutateAsync({
                      seniorId: matchingSenior.id,
                      employeeIds: selectedUserIds,
                    });
                  }
                  message.success("매칭 완료");
                  setSelectedUserIds([]);
                } catch (e) {
                  message.error("매칭에 실패했습니다");
                }
              }}
            >
              선택한 사용자 매칭
            </Button>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
