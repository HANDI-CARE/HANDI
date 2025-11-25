import dayjs from "dayjs";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";

interface GuardianHospitalScheduleItemProps {
  hospital: AllSchedules;
}

export default function GuardianHospitalScheduleItem({
  hospital,
}: GuardianHospitalScheduleItemProps) {
  const formattedDate = dayjs(hospital.meetingTime).format("YYYY-MM-DD");
  const formattedTime = dayjs(hospital.meetingTime).format("HH:mm");

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900">
            {hospital.senior.name}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {hospital.hospitalName} {hospital.classification}
        </p>    
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-700">{formattedDate}</div>
        <div className="text-sm text-gray-500">{formattedTime}</div>
      </div>
    </div>
  );
}
