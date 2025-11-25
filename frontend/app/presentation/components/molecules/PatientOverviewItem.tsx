import { InfoCircleOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Tag } from "antd";
import { Link, useNavigate } from "react-router";
import { useUserStore } from "../../stores/userStore";

interface PatientOverviewItemProps {
  patientId: string;
  name: string;
  age: number;
  diagnosis: string | null;
  lastVisit: string | null;
  status: "HIGH" | "MEDIUM" | "LOW";
  onStatusClick: () => void;
}

export default function PatientOverviewItem({
  patientId,
  name,
  age,
  diagnosis,
  lastVisit,
  status,
  onStatusClick,
}: PatientOverviewItemProps) {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HIGH":
        return "red";
      case "MEDIUM":
        return "orange";
      case "LOW":
        return "green";
      default:
        return "green";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "HIGH":
        return "🔴";
      case "MEDIUM":
        return "🟡";
      case "LOW":
        return "🟢";
      default:
        return "🟢";
    }
  };
  
  const handleCardClick = () => {
    if (user?.role === "nurse") {
    navigate(`/nurse/patients/${patientId}/`);
  }};

  return (
    <Card
      className={`hover:shadow-lg hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-200 relative border border-gray-200 ${
        user?.role === "nurse" ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={handleCardClick}
      styles={{ body: { padding: "16px", height: "120px" } }}
    >
      {/* 상세보기 링크 - 더 우측 상단으로 */}
      {user?.role === "nurse" && (
      <Link
        to={`/nurse/patients/${patientId}/`}
        className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors z-10 bg-white px-2 py-1 rounded"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        상세보기
      </Link>
      )}
      {/* 환자 정보와 상태를 포함하는 영역 - 세로 중앙 정렬 */}
      <div className="h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* 환자 정보 - 왼쪽 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserOutlined className="text-blue-600 text-lg" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-base mb-1">
                {name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">{age}세</p>
              <p className="text-xs text-gray-500">최근 진료: {lastVisit ? lastVisit : "최근 병원 방문일정이 없습니다."}</p>
            </div>
          </div>

          {/* 상태 정보 - 우측 가운데 */}
          <div className="flex items-center flex-shrink-0">
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined className="text-gray-500" />}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onStatusClick();
              }}
            >
              <Tag
                color={getStatusColor(status)}
                className="font-medium text-sm px-3 py-1"
              >
                {getStatusIcon(status)}{" "}
                {status === "HIGH"
                  ? "위험"
                  : status === "MEDIUM"
                  ? "주의"
                  : "양호"}
              </Tag>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
  }
