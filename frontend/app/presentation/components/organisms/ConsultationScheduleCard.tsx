import { Empty, Spin, Card } from "antd";
import { Link } from "react-router";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";
import ConsultationScheduleItem from "../molecules/ConsultationScheduleItem";
import GuardianConsultationScheduleItem from "../molecules/GuardianConsultationScheduleItem";

interface ConsultationScheduleCardProps {
  schedules: AllSchedules[];
  isLoading?: boolean;
  linkTo?: string;
  useGuardianItem?: boolean;
}

export default function ConsultationScheduleCard({
  schedules,
  isLoading,
  linkTo,
  useGuardianItem,
}: ConsultationScheduleCardProps) {
  const ScheduleItem = useGuardianItem
    ? GuardianConsultationScheduleItem
    : ConsultationScheduleItem;

  return (
    <Card
      title={<span className="text-xl font-semibold">상담 일정</span>}
      extra={
        <Link
          to={linkTo || ""}
          className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
        >
          전체보기 →
        </Link>
      }
      className="h-full"
      styles={{ body: { padding: "24px" } }}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-h-[392px] overflow-y-auto">
          {schedules.length === 0 && !isLoading ? (
            <Empty description="상담 일정이 없습니다." />
          ) : (
            schedules.map((schedule) => (
              <ScheduleItem key={schedule.id} consultation={schedule} />
            ))
          )}
        </div>
      )}
    </Card>
  );
}
