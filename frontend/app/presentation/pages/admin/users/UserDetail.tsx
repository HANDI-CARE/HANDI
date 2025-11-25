import {
  Card as AntCard,
  Button,
  Descriptions,
  Popconfirm,
  Space,
  Tag,
  message,
} from "antd";
import { useNavigate, useParams } from "react-router";
import {
  useAdminUser,
  useDeleteAdminUser,
  useRestoreAdminUser,
} from "../../../../features/admin/application/hooks/useAdmin";
import { Card } from "../../../components/atoms";
import { AppLayout } from "../../../components/templates/AppLayout";

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const navigate = useNavigate();

  const { data: user, isLoading, refetch } = useAdminUser(id);
  const deleteUser = useDeleteAdminUser();
  const restoreUser = useRestoreAdminUser();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">사용자 상세</h1>
          <Space>
            <Button onClick={() => navigate(-1)}>목록으로</Button>
            {user && !user.isDeleted ? (
              <Popconfirm
                title="사용자를 삭제하시겠습니까?"
                onConfirm={async () => {
                  await deleteUser.mutateAsync(user.id);
                  message.success("삭제되었습니다");
                  navigate("/admin/users");
                }}
              >
                <Button danger>삭제</Button>
              </Popconfirm>
            ) : (
              <Button
                onClick={async () => {
                  if (!user) return;
                  await restoreUser.mutateAsync(user.id);
                  message.success("복구되었습니다");
                  refetch();
                }}
              >
                복구
              </Button>
            )}
          </Space>
        </div>

        <Card>
          <AntCard loading={isLoading}>
            {user && (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="이름">{user.name}</Descriptions.Item>
                <Descriptions.Item label="이메일">
                  {user.email}
                </Descriptions.Item>
                <Descriptions.Item label="역할">
                  <Tag
                    color={
                      user.role === "ADMIN"
                        ? "volcano"
                        : user.role === "EMPLOYEE"
                        ? "blue"
                        : "purple"
                    }
                  >
                    {user.role}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="기관 ID">
                  {user.organizationId}
                </Descriptions.Item>
                <Descriptions.Item label="연락처">
                  {user.phoneNumber || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="주소">
                  {user.address || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="상태">
                  {user.isDeleted ? (
                    <Tag color="red">삭제됨</Tag>
                  ) : (
                    <Tag color="green">정상</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="생성일">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleString("ko-KR")
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="수정일">
                  {user.updatedAt
                    ? new Date(user.updatedAt).toLocaleString("ko-KR")
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            )}
          </AntCard>
        </Card>
      </div>
    </AppLayout>
  );
}
