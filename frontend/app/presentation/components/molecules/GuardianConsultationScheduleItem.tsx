import dayjs from "dayjs";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";

interface GuardianConsultationScheduleItemProps {
  consultation: AllSchedules;
}

export default function GuardianConsultationScheduleItem({
  consultation,
}: GuardianConsultationScheduleItemProps) {
  const formattedDate = dayjs(consultation.meetingTime).format("YYYY-MM-DD");
  const formattedTime = dayjs(consultation.meetingTime).format("HH:mm");

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            {consultation.senior.name}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          담당 의사: {consultation.doctorName}
        </p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-700">{formattedDate}</div>
        <div className="text-sm text-gray-500">{formattedTime}</div>
      </div>
    </div>
  );
}
