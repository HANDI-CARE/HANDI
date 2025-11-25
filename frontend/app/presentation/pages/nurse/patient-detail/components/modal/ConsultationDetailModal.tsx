import { CalendarOutlined } from "@ant-design/icons";
import { Modal, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import ReactMarkdown from "react-markdown";
import type { AllSchedules } from "~/features/hospital/domain/Hospital";

const { Text, Title } = Typography;

interface ConsultationDetailModalProps {
  consultation: AllSchedules | null;
  open: boolean;
  onCancel: () => void;
  title?: string;
}

type DetailRow = {
  key: string;
  label: string;
  value: React.ReactNode;
};

function formatDateTime(
  input: Date | string | number | null | undefined
): string {
  if (!input) return "-";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR");
}

export default function ConsultationDetailModal({
  consultation,
  open,
  onCancel,
  title = "진료 내용 요약",
}: ConsultationDetailModalProps) {
  if (!consultation) return null;

  const statusText =
    consultation.content && consultation.content !== ""
      ? "완료"
      : consultation.status === "CONDUCTED"
      ? "예약 확정"
      : consultation.status === "PENDING"
      ? "대기 중"
      : "취소";
  const statusColor =
    consultation.content && consultation.content !== ""
      ? "green"
      : consultation.status === "CONDUCTED"
      ? "blue"
      : consultation.status === "PENDING"
      ? "orange"
      : "red";

  const detailRows: DetailRow[] = [
    {
      key: "title",
      label: "제목",
      value: <Text strong>{consultation.title}</Text>,
    },
    {
      key: "classification",
      label: "분류",
      value: <Text>{consultation.classification || "기타"}</Text>,
    },
    {
      key: "status",
      label: "상태",
      value: <Tag color={statusColor}>{statusText}</Tag>,
    },
    ...(consultation.hospitalName
      ? [
          {
            key: "hospitalName",
            label: "병원명",
            value: <Text>{consultation.hospitalName}</Text>,
          } as DetailRow,
        ]
      : []),
    ...(consultation.doctorName
      ? [
          {
            key: "doctorName",
            label: "담당 의사",
            value: <Text>{consultation.doctorName}</Text>,
          } as DetailRow,
        ]
      : []),
    {
      key: "startedAt",
      label: "진료 시작",
      value: <Text>{formatDateTime(consultation.startedAt)}</Text>,
    },
    {
      key: "endedAt",
      label: "진료 종료",
      value: <Text>{formatDateTime(consultation.endedAt)}</Text>,
    },
  ];

  const columns: ColumnsType<DetailRow> = [
    {
      title: "항목",
      dataIndex: "label",
      key: "label",
      width: 140,
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: "내용",
      dataIndex: "value",
      key: "value",
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-blue-500" />
          <span>{title}</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <div className="p-2 md:p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Title level={5} style={{ margin: 0 }}>
            {consultation.title}
          </Title>
        </div>

        <Table<DetailRow>
          size="small"
          bordered
          showHeader={false}
          pagination={false}
          columns={columns}
          dataSource={detailRows}
          rowKey={(row) => row.key}
        />

        <div>
          <Text type="secondary">진료 내용</Text>
          <div
            className="mt-2 p-3 rounded-md"
            style={{ background: "#fafafa" }}
          >
            {consultation.content ? (
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-xl font-semibold mb-2" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 className="text-lg font-semibold mb-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-base font-semibold mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-2 leading-7" {...props} />
                  ),
                  code: ({ node, ...props }) => (
                    <code
                      className="px-1 py-0.5 bg-gray-100 rounded"
                      {...props}
                    />
                  ),
                  a: ({ node, ...props }) => (
                    <a target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-5" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-5" {...props} />
                  ),
                }}
              >
                {consultation.content}
              </ReactMarkdown>
            ) : (
              <Text type="secondary">내용이 비어 있습니다.</Text>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
