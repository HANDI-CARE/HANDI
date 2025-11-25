import { Card, Descriptions, Empty, Spin, Tag } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router";
import type { ObservationRecords } from "../../../features/patient/domain/Patient";
import { useUserStore } from "../../stores/userStore";
import Modal from "../atoms/Modal";
import PatientOverviewItem from "../molecules/PatientOverviewItem";
import RegisteredPatientItem from "../molecules/RegisteredPatientItem";

interface PatientListCardProps {
  patients: ObservationRecords[];
  isLoading?: boolean;
  title?: string;
  linkTo?: string;
  useGuardianItem?: boolean;
  showModal?: boolean;
}

export default function PatientListCard({
  patients,
  isLoading = false,
  title = "시니어 리스트",
  linkTo,
  useGuardianItem = false,
  showModal = true,
}: PatientListCardProps) {
  const [selectedPatient, setSelectedPatient] =
    useState<ObservationRecords | null>(null);
  const [open, setOpen] = useState(false);
  const { user } = useUserStore();
  const handleStatusClick = (patient: ObservationRecords) => {
    if (showModal) {
      setSelectedPatient(patient);
      setOpen(true);
    }
  };

  const getStatusColor = (level: "HIGH" | "MEDIUM" | "LOW") => {
    switch (level) {
      case "HIGH":
        return "red";
      case "MEDIUM":
        return "orange";
      case "LOW":
        return "green";
      default:
        return "green";
    }
  };

  const getStatusDescription = (level: "HIGH" | "MEDIUM" | "LOW") => {
    switch (level) {
      case "HIGH":
        return "주의가 필요한 상태입니다. 상시적인 체크가 필요합니다.";
      case "MEDIUM":
        return "관찰이 필요한 상태입니다. 정기적인 체크가 필요합니다.";
      case "LOW":
        return "안정적인 상태입니다. 현재 관리 방식을 유지하세요.";
      default:
        return "최근 7일 이내의 관찰일지가 없습니다.";
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">{title}</span>
          {linkTo && (
            <Link
              to={linkTo}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline transition-colors"
            >
              전체보기 →
            </Link>
          )}
        </div>
      }
      className="h-full border border-gray-200"
      styles={{ body: { padding: "20px" } }}
    >
      {isLoading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
          {patients.length === 0 && !isLoading ? (
            <Empty description="정보가 없습니다." />
          ) : (
            patients.map((patient) =>
              useGuardianItem ? (
                <RegisteredPatientItem key={patient.senior.id} {...patient} />
              ) : (
                <PatientOverviewItem
                  key={patient.senior.id}
                  patientId={patient.senior.id.toString()}
                  name={patient.senior.name}
                  age={patient.senior.age}
                  diagnosis={patient.senior.note}
                  lastVisit={
                    patient.lastHospitalVisit
                      ? dayjs(patient.lastHospitalVisit).format("YYYY-MM-DD")
                      : ""
                  }
                  status={patient.level as "HIGH" | "MEDIUM" | "LOW"}
                  onStatusClick={() => handleStatusClick(patient)}
                />
              )
            )
          )}
        </div>
      )}

      {showModal && (
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          title={
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">시니어 상태 정보</span>
            </div>
          }
          width={550}
          className="patient-status-modal"
        >
          {selectedPatient && (
            <div className="space-y-6">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="성함" className="font-medium">
                  {selectedPatient.senior.name}
                </Descriptions.Item>
                <Descriptions.Item label="나이">
                  {selectedPatient.senior.age}세
                </Descriptions.Item>
                <Descriptions.Item label="관찰내용">
                  {selectedPatient.content ||
                    "최근 7일 이내의 관찰일지가 없습니다."}
                </Descriptions.Item>
                <Descriptions.Item label="최근 진료일">
                  {selectedPatient.lastHospitalVisit
                    ? dayjs(selectedPatient.lastHospitalVisit).format(
                        "YYYY-MM-DD"
                      )
                    : "최근 병원 방문일정이 없습니다."}
                </Descriptions.Item>
                <Descriptions.Item label="상태">
                  <Tag
                    color={getStatusColor(
                      selectedPatient.level as "HIGH" | "MEDIUM" | "LOW"
                    )}
                    className="font-medium"
                  >
                    {selectedPatient.level === "HIGH"
                      ? "위험"
                      : selectedPatient.level === "MEDIUM"
                      ? "주의"
                      : "양호"}
                  </Tag>
                </Descriptions.Item>
                {user?.role === "guardian" && (
                  <Descriptions.Item label="담당간호사">
                    {selectedPatient.nurse.name}
                  </Descriptions.Item>
                )}
                {user?.role === "nurse" && (
                  <Descriptions.Item label="보호자">
                    {selectedPatient.guardian.name}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">상태 설명</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {getStatusDescription(
                    selectedPatient.level as "HIGH" | "MEDIUM" | "LOW"
                  )}
                </p>
              </div>

              {selectedPatient.senior.note && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">참고사항</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {selectedPatient.senior.note}
                  </p>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </Card>
  );
}
