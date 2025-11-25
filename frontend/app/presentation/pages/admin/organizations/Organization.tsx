import { Button, Card, Form, Input, message } from "antd";
import { useEffect } from "react";
import {
  useOrganization,
  useUpdateOrganization,
} from "../../../../features/admin/application/hooks/useAdmin";
import { AppLayout } from "../../../components/templates/AppLayout";

export default function AdminOrganizationPage() {
  const { data: organization, isLoading } = useOrganization();
  const updateOrg = useUpdateOrganization();
  const [form] = Form.useForm();

  useEffect(() => {
    if (organization) {
      form.setFieldsValue({
        name: organization.name,
        breakfastTime: organization.breakfastTime,
        lunchTime: organization.lunchTime,
        dinnerTime: organization.dinnerTime,
        sleepTime: organization.sleepTime,
      });
    }
  }, [organization, form]);

  return (
    <AppLayout>
      <div className="space-y-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">기관 설정</h1>
          <p className="text-gray-600 mt-1">기관 기본 정보를 수정합니다.</p>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              await updateOrg.mutateAsync({ id: 0, body: values });
              message.success("저장되었습니다");
            }}
          >
            <Form.Item label="기관명" name="name" rules={[{ required: true }]}>
              <Input disabled={isLoading} />
            </Form.Item>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Form.Item
                label="아침 시간"
                name="breakfastTime"
                rules={[{ required: true }]}
              >
                <Input placeholder="예: 080000" />
              </Form.Item>
              <Form.Item
                label="점심 시간"
                name="lunchTime"
                rules={[{ required: true }]}
              >
                <Input placeholder="예: 120000" />
              </Form.Item>
              <Form.Item
                label="저녁 시간"
                name="dinnerTime"
                rules={[{ required: true }]}
              >
                <Input placeholder="예: 180000" />
              </Form.Item>
              <Form.Item
                label="취침 시간"
                name="sleepTime"
                rules={[{ required: true }]}
              >
                <Input placeholder="예: 210000" />
              </Form.Item>
            </div>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateOrg.isPending}
            >
              저장
            </Button>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
}
