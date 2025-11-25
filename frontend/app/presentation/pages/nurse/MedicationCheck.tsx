import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MedicineBoxOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import AppLayout from "~/presentation/components/templates/AppLayout";
import { useUserStore } from "~/presentation/stores/userStore";

const { Title, Text } = Typography;

// 목업 복약 데이터
const mockMedications = [
  {
    id: "1",
    patientName: "김영희",
    patientId: "P001",
    medicationName: "혈압약",
    dosage: "1정",
    frequency: "하루 2회",
    time: "아침, 저녁",
    status: "완료",
    checkedAt: "2025-01-15 08:30",
    nextDose: "2025-01-15 20:00",
  },
  {
    id: "2",
    patientName: "박철수",
    patientId: "P002",
    medicationName: "당뇨약",
    dosage: "1정",
    frequency: "하루 1회",
    time: "아침",
    status: "대기",
    checkedAt: null,
    nextDose: "2025-01-15 08:00",
  },
  {
    id: "3",
    patientName: "이순자",
    patientId: "P003",
    medicationName: "심장약",
    dosage: "1정",
    frequency: "하루 3회",
    time: "아침, 점심, 저녁",
    status: "지연",
    checkedAt: "2025-01-15 07:15",
    nextDose: "2025-01-15 12:00",
  },
  {
    id: "4",
    patientName: "최민수",
    patientId: "P004",
    medicationName: "항생제",
    dosage: "1정",
    frequency: "하루 2회",
    time: "아침, 저녁",
    status: "완료",
    checkedAt: "2025-01-15 08:00",
    nextDose: "2025-01-15 20:00",
  },
];

export default function MedicationCheck() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "완료":
        return "success";
      case "대기":
        return "processing";
      case "지연":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "완료":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "대기":
        return <ClockCircleOutlined style={{ color: "#1890ff" }} />;
      case "지연":
        return <ExclamationCircleOutlined style={{ color: "#faad14" }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const handleCheckMedication = (medicationId: string) => {
    setLoading(true);
    // 실제로는 API 호출
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <AppLayout>
      <div
        style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        {/* 헤더 섹션 */}
        <div
          style={{
            marginBottom: "24px",
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar
                size={48}
                style={{ backgroundColor: "#1890ff" }}
                icon={<MedicineBoxOutlined />}
              />
              <div>
                <Title level={3} style={{ margin: 0, color: "#262626" }}>
                  복약 체크
                </Title>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  시니어들의 복약 상태를 확인하고 관리하세요.
                </Text>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                {dayjs().format("YYYY년 M월 D일 dddd")}
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* 통계 카드 */}
          <Col xs={24} lg={6}>
            <Card
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Title
                  level={2}
                  style={{ margin: "0 0 8px 0", color: "#52c41a" }}
                >
                  {mockMedications.filter((m) => m.status === "완료").length}
                </Title>
                <Text type="secondary">완료</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Title
                  level={2}
                  style={{ margin: "0 0 8px 0", color: "#1890ff" }}
                >
                  {mockMedications.filter((m) => m.status === "대기").length}
                </Title>
                <Text type="secondary">대기</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Title
                  level={2}
                  style={{ margin: "0 0 8px 0", color: "#faad14" }}
                >
                  {mockMedications.filter((m) => m.status === "지연").length}
                </Title>
                <Text type="secondary">지연</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={6}>
            <Card
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Title
                  level={2}
                  style={{ margin: "0 0 8px 0", color: "#262626" }}
                >
                  {mockMedications.length}
                </Title>
                <Text type="secondary">전체</Text>
              </div>
            </Card>
          </Col>

          {/* 복약 목록 */}
          <Col xs={24}>
            <Card
              title={
                <span>
                  <MedicineBoxOutlined style={{ marginRight: "8px" }} />
                  오늘의 복약 목록
                </span>
              }
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <List
                dataSource={mockMedications}
                renderItem={(medication) => (
                  <List.Item
                    actions={[
                      medication.status === "대기" && (
                        <Button
                          type="primary"
                          size="small"
                          loading={loading}
                          onClick={() => handleCheckMedication(medication.id)}
                        >
                          복약 확인
                        </Button>
                      ),
                      medication.status === "완료" && (
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {medication.checkedAt}
                        </Text>
                      ),
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<UserOutlined />}
                          style={{ backgroundColor: "#1890ff" }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{medication.patientName}</Text>
                          <Tag color="blue">{medication.patientId}</Tag>
                          <Badge
                            status={getStatusColor(medication.status) as any}
                            text={
                              <Space>
                                {getStatusIcon(medication.status)}
                                {medication.status}
                              </Space>
                            }
                          />
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small">
                          <div>
                            <Text strong>{medication.medicationName}</Text>
                            <Text type="secondary"> - {medication.dosage}</Text>
                          </div>
                          <div>
                            <Text type="secondary">
                              {medication.frequency} ({medication.time})
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary">
                              다음 복약: {medication.nextDose}
                            </Text>
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}
