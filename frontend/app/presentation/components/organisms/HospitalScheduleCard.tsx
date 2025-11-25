import { Empty, Spin, Card } from "antd";
import { Link } from "react-router";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";
import GuardianHospitalScheduleItem from "../molecules/GuardianHospitalScheduleItem";
import HospitalScheduleItem from "../molecules/HospitalScheduleItem";

interface HospitalScheduleCardProps {
  schedules: AllSchedules[];
  isLoading?: boolean;
  linkTo?: string;
  useGuardianItem?: boolean;
}

export default function HospitalScheduleCard({
  schedules,
  isLoading,
  linkTo,
  useGuardianItem,
}: HospitalScheduleCardProps) {
  const ScheduleItem = useGuardianItem
    ? GuardianHospitalScheduleItem
    : HospitalScheduleItem;

  return (
    <Card
      title={<span className="text-xl font-semibold">병원 일정</span>}
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
            <Empty description="병원 일정이 없습니다." />
          ) : (
            schedules.map((schedule) => (
              <ScheduleItem key={schedule.id} hospital={schedule} />
            ))
          )}
        </div>
      )}
    </Card>
  );
}
