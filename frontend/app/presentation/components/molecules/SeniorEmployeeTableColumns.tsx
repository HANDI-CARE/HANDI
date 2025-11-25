import type { ColumnsType } from "antd/es/table";
import type { ObservationRecords } from "../../../features/patient/domain/Patient";
import dayjs from "dayjs";

export const getSeniorEmployeeTableColumns = (): ColumnsType<ObservationRecords> => {
  return [
    {
      title: "이름",
      dataIndex: "senior.name",
      key: "senior.name",
      width: 100,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{record.senior.name}</span>
          <span className="text-xs text-gray-500">({record.senior.age}세)</span>
        </div>
      ),
    },
    {
      title: "성별",
      dataIndex: "senior.gender",
      key: "senior.gender",
      width: 80,
      render: (_, record) => (
        <span className={`px-2 py-1 rounded text-xs ${
          record.senior.gender === "MALE" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
        }`}>
          {record.senior.gender === "MALE" ? "남성" : "여성"}
        </span>
      ),
    },
    {
      title: "최근 진료일",
      dataIndex: "lastHospitalVisit",
      key: "lastHospitalVisit",
      width: 120,
      render: (date: Date) => date && dayjs(date).isValid() ? dayjs(date).format("YYYY-MM-DD") : "최근 방문 없음",
    },
    {
      title: "상태",
      key: "status",
      width: 100,
      render: (_, record) => {
        const level = record.level;
        if (!level) {
          return (
            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
              정보 없음
            </span>
          );
        }
        
        const statusConfig = {
          HIGH: { text: "위험", className: "bg-red-100 text-red-800" },
          MEDIUM: { text: "주의", className: "bg-yellow-100 text-yellow-800" },
          LOW: { text: "양호", className: "bg-green-100 text-green-800" },
        };
        
        const config = statusConfig[level as keyof typeof statusConfig] || statusConfig.MEDIUM;
        
        return (
          <span className={`px-2 py-1 rounded text-xs ${config.className}`}>
            {config.text}
          </span>
        );
      },
    },
    {
      title: "최근 관찰일지",
      key: "observationRecord",
      width: 200,
      render: (_, record) => {
        if (!record.content) {
          return <span className="text-gray-400 text-sm">관찰일지 없음</span>;
        }
        
        return (
          <div className="space-y-1">
            <div className="text-xs text-gray-600">
              {dayjs(record.createdAt).format("YYYY-MM-DD")}
            </div>
            <div className="text-xs text-gray-800 line-clamp-2" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {record.content}
            </div>
          </div>
        );
      },
    },
    {
      title: "참고사항",
      dataIndex: "senior.note",
      key: "senior.note",
      width: 150,
      render: (_, record) => (
        <span className="text-sm text-gray-600 line-clamp-2" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {record.senior.note}
        </span>
      ),
    },
  ];
};
