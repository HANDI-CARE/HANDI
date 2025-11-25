import { Button, Space } from "antd";
import dayjs from "dayjs";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";
import { Link } from "react-router";
import { useUserStore } from "../../stores/userStore";


interface DetailItemProps {
  item: AllSchedules;
  renderAdditionalInfo?: (item: AllSchedules) => React.ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}

export default function DetailItem({
  item,
  renderAdditionalInfo,
  primaryButtonText,
  secondaryButtonText,
}: DetailItemProps) {
  const { user } = useUserStore();
  const isNurse = user?.role === "nurse";

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="flex flex-col h-full">
        {/* 상단: 이름과 시간 */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900">
              {item.senior.name}
            </span>
          </div>
          <div className="text-gray-600 text-base font-bold">
            {dayjs(item.meetingTime).format("HH:mm")}
          </div>
        </div>
        
        {/* 중간: 추가 정보 */}
        {renderAdditionalInfo && (
          <div className="space-y-1 flex-1 mb-3">
            {renderAdditionalInfo(item)}
          </div>
        )}
        
        {/* 하단: 버튼들을 양쪽 끝으로 배치 */}
        {isNurse && (
        <div className="flex justify-between items-center gap-2">
          <Link to={`/nurse/patients/${item.senior.id}`}>
            <Button type="primary" size="small" className="px-3 py-1 text-xs">
              {primaryButtonText}
            </Button>
          </Link>
        </div>
        )}
      </div>
    </div>
  );
}
