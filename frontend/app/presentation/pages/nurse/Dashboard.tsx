import { Col, Row } from "antd";
import {
  useAllSchedules,
} from "../../../features/hospital/application/hooks/useHospitals";
import {
  useRecentObservationRecord,
} from "../../../features/patient/application/hooks/usePatients";
import {
  useTodayMedicationSchedules,
} from "../../../features/task/application/hooks/useTasks";
import ConsultationScheduleCard from "../../components/organisms/ConsultationScheduleCard";
import HospitalScheduleCard from "../../components/organisms/HospitalScheduleCard";
import PatientListCard from "../../components/organisms/PatientListCard";
import TodayWorkListCard from "../../components/organisms/TodayWorkList";
import { AppLayout } from "../../components/templates/AppLayout";
import SubHeader from "../../components/templates/components/SubHeader";
import { useUserStore } from "../../stores/userStore";
import dayjs from "dayjs";

export default function NurseDashboard() {
  const { user } = useUserStore();

  // 훅을 사용하여 모든 데이터 가져오기
  const { data: todayMedicationSchedulesData, isLoading: todayMedicationSchedulesLoading } =
    useTodayMedicationSchedules();
  const { data: recentObservationRecordData, isLoading: recentObservationRecordLoading } =
    useRecentObservationRecord();
  const { data: allEmployeeSchedulesData, isLoading: allEmployeeSchedulesLoading } =
    useAllSchedules({ meetingType: "withEmployee" }, { page: 1, size: 5, startDate: dayjs().add(1, 'day').format("YYYYMMDD"), endDate: dayjs().add(10000, 'day').format("YYYYMMDD") });
  const { data: allDoctorSchedulesData, isLoading: allDoctorSchedulesLoading } =
    useAllSchedules({ meetingType: "withDoctor" }, { page: 1, size: 5, startDate: dayjs().add(1, 'day').format("YYYYMMDD"), endDate: dayjs().add(10000, 'day').format("YYYYMMDD") });
  const { data: todayHospitalSchedulesData, isLoading: todayHospitalSchedulesLoading } =
    useAllSchedules({ meetingType: "withDoctor" }, { page: 1, size: 9999, startDate: dayjs().format("YYYYMMDD"), endDate: dayjs().format("YYYYMMDD") });
  const { data: todayConsultationSchedulesData, isLoading: todayConsultationSchedulesLoading } =
    useAllSchedules({ meetingType: "withEmployee" }, { page: 1, size: 9999, startDate: dayjs().format("YYYYMMDD"), endDate: dayjs().format("YYYYMMDD") });

  const todayMedicationSchedules = todayMedicationSchedulesData || [];
  const allEmployeeSchedules = allEmployeeSchedulesData?.result || [];
  const allDoctorSchedules = allDoctorSchedulesData?.result || [];
  const recentObservationRecord = recentObservationRecordData || [];
  const todayHospitalSchedules = todayHospitalSchedulesData?.result || [];
  const todayConsultationSchedules = todayConsultationSchedulesData?.result || [];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <SubHeader
            userName={user?.name || "박간호사"}
            date={new Date().toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          />
        </div>

        <Row gutter={[32, 32]}>
          {/* 오늘 할 일 - 전체 너비 */}
          <Col xs={24}>
            <div className="min-h-[600px]">
              <TodayWorkListCard
                hospitalSchedules={todayHospitalSchedules}
                consultationSchedules={todayConsultationSchedules}
                medicationSchedules={todayMedicationSchedules}
                isLoading={
                  allEmployeeSchedulesLoading ||
                  allDoctorSchedulesLoading ||
                  todayMedicationSchedulesLoading
                }
              />
            </div>
          </Col>

          {/* 내 환자 목록 - 아래쪽 전체 너비 */}
          <Col xs={24}>
            <PatientListCard patients={recentObservationRecord} isLoading={recentObservationRecordLoading} />
          </Col>

          {/* 병원 일정 */}
          <Col xs={24} lg={12}>
            <HospitalScheduleCard
              schedules={allDoctorSchedules}
              isLoading={allDoctorSchedulesLoading}
              useGuardianItem={false}
              linkTo="/nurse/hospital-schedules"
            />
          </Col>

          {/* 상담 일정 */}
          <Col xs={24} lg={12}>
            <ConsultationScheduleCard
              schedules={allEmployeeSchedules}
              isLoading={allEmployeeSchedulesLoading}
              useGuardianItem={false}
              linkTo="/nurse/consultation"
            />
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}
