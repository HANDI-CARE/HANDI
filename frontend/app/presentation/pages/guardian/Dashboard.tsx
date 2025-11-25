import { Card, Col, Descriptions, Radio, Row, Tag } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAllSchedules } from "../../../features/hospital/application/hooks/useHospitals";
import { useRecentObservationRecord } from "../../../features/patient/application/hooks/usePatients";
import ConsultationScheduleCard from "../../components/organisms/ConsultationScheduleCard";
import HospitalScheduleCard from "../../components/organisms/HospitalScheduleCard";
import PatientListCard from "../../components/organisms/PatientListCard";
import { AppLayout } from "../../components/templates/AppLayout";
import { useUserStore } from "../../stores/userStore";

export default function GuardianDashboard() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");

  // 훅을 사용하여 모든 데이터 가져오기
  const {
    data: allEmployeeSchedulesData,
    isLoading: allEmployeeSchedulesLoading,
  } = useAllSchedules(
    { meetingType: "withEmployee" },
    {
      page: 1,
      size: 5,
      startDate: dayjs().format("YYYYMMDD"),
    }
  );
  const { data: allDoctorSchedulesData, isLoading: allDoctorSchedulesLoading } =
    useAllSchedules(
      { meetingType: "withDoctor" },
      {
        page: 1,
        size: 10,
        startDate: dayjs().add(1, "day").format("YYYYMMDD"),
        endDate: dayjs().add(10000, "day").format("YYYYMMDD"),
      }
    );
  const {
    data: recentObservationRecordData,
    isLoading: recentObservationRecordLoading,
  } = useRecentObservationRecord();

  const allEmployeeSchedules = allEmployeeSchedulesData?.result || [];
  const allDoctorSchedules = allDoctorSchedulesData?.result || [];
  const recentObservationRecord = recentObservationRecordData || [];

  // 선택된 환자 정보
  const selectedPatient =
    selectedPatientId === "all"
      ? null
      : recentObservationRecord.find(
          (p) => p.senior.id === parseInt(selectedPatientId)
        );

  // 선택된 환자에 대한 일정 필터링
  const filteredHospitalSchedules =
    selectedPatientId === "all"
      ? allDoctorSchedules
      : allDoctorSchedules.filter(
          (schedule) => schedule.senior.name === selectedPatient?.senior.name
        );

  const filteredConsultationSchedules =
    selectedPatientId === "all"
      ? allEmployeeSchedules
      : allEmployeeSchedules.filter(
          (schedule) => schedule.senior.name === selectedPatient?.senior.name
        );

  const getStatusColor = (status: string) => {
    switch (status) {
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 환자 선택 라디오 버튼 */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Radio.Group
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="flex gap-4"
            >
              <Radio.Button value="all">전체</Radio.Button>
              {recentObservationRecord.map((patient) => (
                <Radio.Button key={patient.senior.id} value={patient.senior.id}>
                  {patient.senior.name}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </div>

        {/* 선택된 환자 요약 정보 */}
        {selectedPatient && (
          <div className="mb-6">
            <Card
              title={
                <div className="flex items-center justify-between">
                  <span>시니어 요약 정보</span>
                </div>
              }
            >
              <Descriptions column={2} bordered>
                <Descriptions.Item label="이름">
                  {selectedPatient.senior.name}
                </Descriptions.Item>
                <Descriptions.Item label="나이">
                  {selectedPatient.senior.age}세
                </Descriptions.Item>
                <Descriptions.Item label="관찰 내용">
                  {selectedPatient.content
                    ? selectedPatient.content
                    : "관찰 내용 없음"}
                </Descriptions.Item>
                <Descriptions.Item label="최근 진료일">
                  {selectedPatient.lastHospitalVisit
                    ? dayjs(selectedPatient.lastHospitalVisit).format(
                        "YYYY-MM-DD"
                      )
                    : "진료 내역 없음"}
                </Descriptions.Item>
                <Descriptions.Item label="상태">
                  <Tag
                    color={getStatusColor(
                      selectedPatient.level as "HIGH" | "MEDIUM" | "LOW"
                    )}
                  >
                    {selectedPatient.level === "HIGH"
                      ? "위험"
                      : selectedPatient.level === "MEDIUM"
                      ? "주의"
                      : "양호"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="참고사항" span={2}>
                  {selectedPatient.senior.note
                    ? selectedPatient.senior.note
                    : "참고사항 없음"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        )}

        <Row gutter={[32, 32]}>
          {/* 등록된 환자 목록 - 전체 선택시에만 표시 */}
          {selectedPatientId === "all" && (
            <Col xs={24}>
              <PatientListCard
                patients={recentObservationRecord}
                isLoading={recentObservationRecordLoading}
                title="등록된 시니어"
                showModal={true}
              />
            </Col>
          )}

          {/* 병원 일정 */}
          <Col xs={24} lg={selectedPatientId === "all" ? 12 : 24}>
            <HospitalScheduleCard
              schedules={filteredHospitalSchedules}
              isLoading={allDoctorSchedulesLoading}
              linkTo="/guardian/hospital-schedules"
            />
          </Col>

          {/* 상담 일정 */}
          <Col xs={24} lg={selectedPatientId === "all" ? 12 : 24}>
            <ConsultationScheduleCard
              schedules={filteredConsultationSchedules}
              isLoading={allEmployeeSchedulesLoading}
              linkTo="/guardian/consultation"
            />
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}
