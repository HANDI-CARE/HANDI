import { Spin } from "antd";
import type { ObservationRecords } from "../../../features/patient/domain/Patient";
import { Card } from "../atoms/Card";
import RegisteredPatientItem from "../molecules/RegisteredPatientItem";

export default function RegisteredPatientsCard({
  patients,
  isLoading = false,
}: {
  patients: ObservationRecords[];
  isLoading?: boolean;
}) {
  return (
    <Card
      title={<span className="text-xl font-semibold">등록된 시니어</span>}
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
          {patients.map((patient) => (
            <RegisteredPatientItem key={patient.senior.id} {...patient} />
          ))}
        </div>
      )}
    </Card>
  );
}
