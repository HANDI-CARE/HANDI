import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ObservationRecords } from "../../../features/patient/domain/Patient";

interface RegisteredPatientItemProps extends ObservationRecords {}

export default function RegisteredPatientItem({
  senior,
  level,
}: RegisteredPatientItemProps) {
  const getStatusColor = () => {
    switch (level) {
      case "HIGH":
        return "red";
      case "MEDIUM":
        return "yellow";
      case "LOW":
        return "green";
      default:
        return "gray";
    }
  };

  const getStatusIcon = () => {
    switch (level) {
      case "HIGH":
        return <ExclamationCircleOutlined className="text-red-500 text-lg" />;
      case "MEDIUM":
        return <WarningOutlined className="text-yellow-500 text-lg" />;
      case "LOW":
        return <CheckCircleOutlined className="text-green-500 text-lg" />;
      default:
        return <WarningOutlined className="text-yellow-500 text-lg" />;
    }
  };

  const getStatusText = () => {
    switch (level) {
      case "HIGH":
        return "위험";
      case "MEDIUM":
        return "주의요망";
      case "양호":
        return "양호";
      default:
        return "정보 없음";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">{senior.name}</span>
        </div>
        <p className="text-sm text-gray-600">
          {senior.note || "주의 사항 요약"}
        </p>
      </div>
      <div className="flex items-center gap-2" style={{ color: getStatusColor() }}>
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      </div>
    </div>
  );
}
