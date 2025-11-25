import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import {
  Alert,
  Input as AntInput,
  Col,
  Row,
  Spin,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useRecentObservationRecord } from "../../../features/patient/application/hooks/usePatients";
import type { ObservationRecords } from "../../../features/patient/domain/Patient";
import { Card } from "../../components/atoms";
import { getSeniorEmployeeTableColumns } from "../../components/molecules/SeniorEmployeeTableColumns";
import { AppLayout } from "../../components/templates/AppLayout";
import { useUserStore } from "../../stores/userStore";
import BackToDashboardButton from "./components/BackToDashboardButton";

export default function Patients() {
  const [searchText, setSearchText] = useState("");
  // 무조건 테이블 뷰로 보여야 함. 안 씀!!!!
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useUserStore();

  // 간호사의 모든 환자와 관찰일지를 조회
  const { data: patientsData, isLoading, error } = useRecentObservationRecord();

  const patients = patientsData || [];

  const tableColumns = getSeniorEmployeeTableColumns();

  // 검색어가 변경되면 페이지를 1로 리셋
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  // 뷰 모드가 변경되면 페이지를 1로 리셋
  // 안 씀!!!!
  const handleViewModeChange = (mode: "card" | "table") => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  // 필터링된 환자 데이터
  const filteredPatients = patients.filter((patient: ObservationRecords) => {
    const matchesSearch =
      patient.senior.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (patient.senior.note ?? "")
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      (patient.content || "").toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const navigate = useNavigate();

  // 카드 뷰용 환자 카드 컴포넌트 (SeniorEmployeeWithObservationRecord 타입용)
  const DashboardPatientCard = ({
    patient,
  }: {
    patient: ObservationRecords;
  }) => {
    // 관찰일지 레벨에 따른 상태 표시
    const getStatusDisplay = (level?: string) => {
      if (!level)
        return { text: "정보 없음", className: "bg-gray-100 text-gray-800" };

      switch (level) {
        case "HIGH":
          return { text: "위험", className: "bg-red-100 text-red-800" };
        case "MEDIUM":
          return { text: "주의", className: "bg-yellow-100 text-yellow-800" };
        case "LOW":
          return { text: "양호", className: "bg-green-100 text-green-800" };
        default:
          return { text: "정보 없음", className: "bg-gray-100 text-gray-800" };
      }
    };

    const status = getStatusDisplay(patient.level as "HIGH" | "MEDIUM" | "LOW");

    return (
      <Card
        hoverable
        onClick={() => navigate(`/nurse/patients/${patient.senior.id}`)}
        className="cursor-pointer"
        title={
          <div className="flex items-center gap-2">
            <UserOutlined />
            <span className="font-semibold">{patient.senior.name}</span>
            <span className="text-sm text-gray-500">
              ({patient.senior.age}세)
            </span>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">성별:</span>
            <span>{patient.senior.gender === "MALE" ? "남성" : "여성"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {/* 입원일 수정필요 */}
            <span className="font-medium">최근 진료일:</span>
            <span>
              {patient.lastHospitalVisit
                ? dayjs(patient.lastHospitalVisit).format("YYYY-MM-DD")
                : "최근 방문 없음"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">상태:</span>
            <span className={`px-2 py-1 rounded text-xs ${status.className}`}>
              {status.text}
            </span>
          </div>
          {patient.content && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">최근 관찰:</span>
                <span className="text-xs text-gray-600">
                  {dayjs(patient.createdAt).format("YYYY-MM-DD")}
                </span>
              </div>
              <div
                className="text-xs text-gray-600 mt-2"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {patient.content}
              </div>
            </>
          )}
          <div className="text-xs text-gray-400 mt-2">
            참고사항: {patient.senior.note}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Typography.Title level={3}>시니어 관리</Typography.Title>
              <p className="text-gray-600 mt-1">
                담당 시니어들의 정보를 관리하고 건강 상태를 확인하세요
              </p>
            </div>
            <BackToDashboardButton />
          </div>
        </div>

        {/* 검색 및 필터 */}
        <Card className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AntInput
                placeholder="시니어 이름, 진단명으로 검색"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                style={{ width: "250px" }}
                size="large"
              />
              <div className="text-sm text-gray-500 whitespace-nowrap">
                총 {filteredPatients.length}명
              </div>
            </div>
            {/* <div className="flex gap-2">
              <button
                onClick={() => handleViewModeChange("card")}
                className={`px-3 py-1 rounded ${
                  viewMode === "card"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                카드뷰
              </button>
              <button
                onClick={() => handleViewModeChange("table")}
                className={`px-3 py-1 rounded ${
                  viewMode === "table"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                테이블뷰
              </button>
            </div> */}
          </div>
        </Card>
        {/* 로딩 상태 */}
        {isLoading && (
          <Card className="mb-8">
            <div className="text-center py-8">
              <Spin size="large" />
              <p className="mt-4 text-gray-500">시니어 정보를 불러오는 중...</p>
            </div>
          </Card>
        )}

        {/* 에러 상태 */}
        {error && (
          <Alert
            message="데이터 로딩 실패"
            description="시니어 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요."
            type="error"
            showIcon
            className="mb-8"
          />
        )}

        {/* 환자 목록 */}
        {!isLoading && !error && (
          <div className="mt-8">
            {viewMode === "card" ? (
              // 카드뷰 (안 씀!!!!!)
              <Card className="shadow-lg">
                <Row gutter={[24, 24]}>
                  {filteredPatients.map((patient: ObservationRecords) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={patient.id}>
                      <DashboardPatientCard patient={patient} />
                    </Col>
                  ))}
                </Row>
              </Card>
            ) : (
              // 테이블뷰
              <Card className="shadow-lg">
                <Table
                  columns={tableColumns as ColumnsType<ObservationRecords>}
                  dataSource={filteredPatients}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    style: {
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                    },
                  }}
                  scroll={{ x: 800 }}
                  onRow={(record) => ({
                    onClick: () => {
                      navigate(`/nurse/patients/${record.senior.id}`);
                    },
                    style: { cursor: "pointer" },
                  })}
                />
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
