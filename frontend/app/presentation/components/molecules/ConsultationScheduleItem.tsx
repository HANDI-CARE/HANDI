import { MessageOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Card } from "../atoms";
import type { AllSchedules } from "~/features/hospital/domain/Hospital";

interface ConsultationScheduleItemProps {
  consultation: AllSchedules;
}

export default function ConsultationScheduleItem({
  consultation,
}: ConsultationScheduleItemProps) {
  const formattedDate = dayjs(consultation.meetingTime).format("M월 D일");

  return (
    <Card
      className="mb-2 transition-colors"
      styles={{ body: { backgroundColor: "#f9fafb", padding: "12px" } }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-start gap-2 flex-1">
          <MessageOutlined style={{ fontSize: "18px", marginTop: 2 }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">{consultation.senior.name}</div>
            {/* <div className="text-gray-500 text-sm truncate">{consultation.title}</div> */}
            <div className="text-gray-400 text-xs">
              보호자: {consultation.guardian.name}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <div className="font-semibold text-sm text-gray-700">{formattedDate}</div>
        </div>
      </div>
    </Card>
  );
}
