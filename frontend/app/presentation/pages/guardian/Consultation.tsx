import { UserOutlined } from "@ant-design/icons";
import { Avatar, Col, Row, Typography } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useState } from "react";
import { useAllSchedules } from "~/features/hospital/application/hooks/useHospitals";
import type { AllSchedules } from "~/features/hospital/domain/Hospital";
import GenericCalendar from "../../components/organisms/GenericCalendar";
import GenericDetailList from "../../components/organisms/GenericDetailList";
import GenericStatistics from "../../components/organisms/GenericStatistics";
import { AppLayout } from "../../components/templates/AppLayout";
import { useUserStore } from "../../stores/userStore";

const { Text, Title } = Typography;
dayjs.locale("ko");

export default function GuardianConsultationSchedules() {
  const { user } = useUserStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const { data: allSchedules, isLoading: isAllSchedulesLoading } =
    useAllSchedules(
      {
        meetingType: "withEmployee",
      },
      {
        page: 1,
        size: 9999,
        startDate: "19900816",
        endDate: dayjs().add(10000, "day").format("YYYYMMDD"),
      }
    );

  const selectedDateConsultations =
    allSchedules?.result?.filter(
      (c) =>
        dayjs(c.meetingTime).format("YYYY-MM-DD") ===
        selectedDate.format("YYYY-MM-DD")
    ) || [];

  const currentMonthConsultations =
    allSchedules?.result?.filter(
      (c) =>
        dayjs(c.meetingTime).format("YYYY-MM") ===
        selectedDate.format("YYYY-MM")
    ) || [];

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  const renderConsultationInfo = (consultation: AllSchedules) => (
    <>
      <p className="text-gray-700 text-sm mb-1">{consultation.title}</p>
    </>
  );

  const consultationStatistics = [
    {
      title: "총 상담 건수",
      value: currentMonthConsultations.length,
      color: "#1f2937",
    },
    {
      title: "질병 관리",
      value: currentMonthConsultations.filter((c) => c.title?.includes("관리"))
        .length,
      color: "#059669",
    },
    {
      title: "일반 상담",
      value: currentMonthConsultations.filter(
        (c) => !c.title?.includes("관리") && !c.title?.includes("지도")
      ).length,
      color: "#2563eb",
    },
    {
      title: "지도 상담",
      value: currentMonthConsultations.filter((c) => c.title?.includes("지도"))
        .length,
      color: "#7c3aed",
    },
  ];

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
                  전체 상담 일정을 확인할 수 있습니다.
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

        {/* 좌: 달력 / 우: 리스트 - 화면 높이를 크게 사용 */}
        <Row gutter={[24, 24]} className="items-stretch">
          {/* Calendar Section: 이중 Card 제거, 컬럼 고정 높이 */}
          <Col xs={24} lg={16}>
            <GenericCalendar
              items={allSchedules?.result || []}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              className="h-full"
            />
          </Col>

          {/* Selected Date Details: 리스트 컬럼도 동일 높이로 맞추고 내부 카드가 꽉 차도록 */}
          <Col xs={24} lg={8}>
            <GenericDetailList
              selectedDate={selectedDate}
              items={selectedDateConsultations}
              title="상담 일정"
              emptyMessage="해당 날짜에 상담 일정이 없습니다."
              emptyIcon="📅"
              isLoading={isAllSchedulesLoading}
              renderAdditionalInfo={renderConsultationInfo}
              primaryButtonText="시니어 상세보기"
              secondaryButtonText="일정 수정하기"
            />
          </Col>
        </Row>

        <GenericStatistics
          title="이번 달 통계 (등록된 시니어)"
          statistics={consultationStatistics}
        />
      </div>
    </AppLayout>
  );
}
