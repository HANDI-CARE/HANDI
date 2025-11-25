import { Avatar, Card, Col, Row, Typography } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useState } from "react";
import { useAllSchedules } from "../../../features/hospital/application/hooks/useHospitals";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";
import GenericCalendar from "../../components/organisms/GenericCalendar";
import GenericDetailList from "../../components/organisms/GenericDetailList";
import GenericStatistics from "../../components/organisms/GenericStatistics";
import { AppLayout } from "../../components/templates/AppLayout";
import { useUserStore } from "../../stores/userStore";
import BackToDashboardButton from "./components/BackToDashboardButton";
import { UserOutlined } from "@ant-design/icons";
import "dayjs/locale/ko";

const { Text, Title } = Typography;
dayjs.locale("ko");

export default function GuardianHospitalSchedules() {
  const { user } = useUserStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const { data: hospitalschedules, isLoading } = useAllSchedules(
    {
      meetingType: "withDoctor",
    },
    {
      page: 1,
      size: 9999,
      startDate: "19900816",
      endDate: dayjs().add(10000, 'day').format("YYYYMMDD"),
    }
  );

  const selectedDateHospitals =
    hospitalschedules?.result?.filter(
      (h) =>
        dayjs(h.meetingTime).format("YYYY-MM-DD") ===
        selectedDate.format("YYYY-MM-DD")
    ) || [];

  const currentMonthHospitals =
    hospitalschedules?.result?.filter(
      (h) =>
        dayjs(h.meetingTime).format("YYYY-MM") ===
        selectedDate.format("YYYY-MM")
    ) || [];

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  // 병원 추가 정보 렌더링 함수
  const renderHospitalInfo = (hospital: AllSchedules) => (
    <>
      <p className="text-gray-700 text-sm mb-1">{hospital.hospitalName}</p>
      <p className="text-gray-600 text-sm mb-1">{hospital.classification}</p>
      <p className="text-gray-500 text-xs">담당의: {hospital.doctorName}</p>
    </>
  );

  // 병원 통계 계산 - 동적으로 모든 과 계산
  const calculateDepartmentStatistics = () => {
    // 과별 개수 계산
    const departmentCounts = currentMonthHospitals.reduce((acc, hospital) => {
      const department = hospital.hospitalName;
      if (department) {
        acc[department] = (acc[department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // 색상 팔레트 (과가 많을 경우를 대비)
    const colors = [
      "#059669",
      "#2563eb",
      "#7c3aed",
      "#dc2626",
      "#ea580c",
      "#65a30d",
      "#0891b2",
      "#7c2d12",
      "#be185d",
      "#1e40af",
    ];

    // 통계 배열 생성
    const statistics = [
      {
        title: "총 병원 일정",
        value: currentMonthHospitals.length,
        color: "#1f2937",
      },
      // 과별 통계 추가
      ...Object.entries(departmentCounts).map(([department, count], index) => ({
        title: department,
        value: count,
        color: colors[index % colors.length], // 색상 순환
      })),
    ];

    return statistics;
  };

  const hospitalStatistics = calculateDepartmentStatistics();

  return (
    <AppLayout>
      <div
        style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}
      >
        {/* 헤더 섹션 */}
        <div
          style={{
            marginBottom: "24px",
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar
                size={48}
                style={{ backgroundColor: "#1890ff" }}
                icon={<UserOutlined />}
              />
              <div>
                <Title level={3} style={{ margin: 0, color: "#262626" }}>
                  {user?.name}님, 안녕하세요!
                </Title>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  전체 병원 일정을 확인할 수 있습니다.
                </Text>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: "14px" }}>
                오늘 날짜 : {dayjs().format("YYYY년 M월 D일 dddd")}
              </Text>
            </div>
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {/* Calendar Section */}
          <Col xs={24} lg={16}>
            <Card
              className="h-full shadow-lg"
              styles={{ body: { padding: "16px" } }}
            >
              <GenericCalendar
                items={hospitalschedules?.result || []}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                className="hospital-calendar"
              />
            </Card>
          </Col>

          {/* Selected Date Details */}
          <Col xs={24} lg={8}>
            <GenericDetailList
              selectedDate={selectedDate}
              items={selectedDateHospitals}
              title="병원 일정"
              emptyMessage="해당 날짜에 병원 일정이 없습니다."
              emptyIcon="🏥"
              isLoading={isLoading}
              renderAdditionalInfo={renderHospitalInfo}
            />
          </Col>
        </Row>

        {/* Statistics Section */}
        <GenericStatistics
          title="이번 달 통계"
          statistics={hospitalStatistics}
        />
      </div>
    </AppLayout>
  );
}
