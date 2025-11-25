import { BuildOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";
import { Card } from "../atoms";

interface HospitalScheduleItemProps {
  hospital: AllSchedules;
}

export default function HospitalScheduleItem({
  hospital,
}: HospitalScheduleItemProps) {
  return (
    <Card
      className="mb-2 transition-colors"
      styles={{ body: { backgroundColor: "#f9fafb", padding: "12px" } }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-start gap-2 flex-1">
          <BuildOutlined style={{ fontSize: "18px", marginTop: 2 }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">{hospital.senior.name}</div>
            <div className="text-gray-500 text-sm truncate">
              {hospital.hospitalName} {hospital.classification}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <div className="font-semibold text-sm text-gray-700">
            {dayjs(hospital.meetingTime).format("M월 D일")}
          </div>
        </div>
      </div>
    </Card>
  );
}
