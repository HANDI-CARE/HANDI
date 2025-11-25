import { UserOutlined } from "@ant-design/icons";
import type { CalendarProps } from "antd";
import {
  Alert,
  Button as AntButton,
  Avatar,
  Calendar,
  Card,
  Col,
  Collapse,
  message,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import isBetween from "dayjs/plugin/isBetween";
import { useEffect, useMemo, useState } from "react";
import { useUserStore } from "~/presentation/stores/userStore";
import {
  useEmployeeSchedule,
  useRegisterEmployeeSchedule,
} from "../../../features/consultation/application/hooks/useConsultations";
import { AppLayout } from "../../components/templates/AppLayout";

dayjs.extend(isBetween);
dayjs.locale("ko");

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// 9:00부터 17:30까지 30분 단위로 시간 슬롯 생성
const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

export default function ConsultationSchedules() {
  const { user } = useUserStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [viewType, setViewType] = useState<string>("Month");
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<string[]>(
    []
  );

  // 전체 상담 일정을 관리하는 상태 추가
  const [allSelectedSchedules, setAllSelectedSchedules] = useState<
    Record<string, string[]>
  >({});

  // consultations 상태와 관련 로직 삭제
  // const [consultations, setConsultations] = useState<Consultation[]>([]);
  // const [loading, setLoading] = useState(false);

  const { mutate: registerEmployeeSchedule } = useRegisterEmployeeSchedule();

  // 간호사가 선택한 상담 일정 조회
  const { data: employeeSchedule, isLoading: scheduleLoading } =
    useEmployeeSchedule();

  // Mock 데이터를 useMemo로 메모이제이션
  const mockEmployeeSchedule = useMemo(
    () => ({
      checkedTime: [
        // "2025-08-15T13:00:00+09:00", // 8월 15일 13:00
        // "2025-08-15T13:30:00+09:00", // 8월 15일 13:30
        // "2025-08-15T14:00:00+09:00"  // 8월 15일 14:00
      ],
    }),
    []
  );

  // 실제 데이터가 없으면 mock 데이터 사용 (useMemo로 메모이제이션)
  const effectiveEmployeeSchedule = useMemo(() => {
    return employeeSchedule?.checkedTime &&
      employeeSchedule.checkedTime.length > 0
      ? employeeSchedule
      : mockEmployeeSchedule;
  }, [employeeSchedule, mockEmployeeSchedule]);

  // 오늘 날짜 기준 +3일 전인지 확인하는 함수 (과거 날짜는 일정 유무와 관계없이 수정 불가)
  const isPastDate = (date: Dayjs) => {
    const today = dayjs();
    const threeDaysAfter = today.add(3, "day");
    return date.isBefore(threeDaysAfter, "day");
  };

  // 해당 날짜에 상담 일정이 있는지 확인하는 함수
  const hasScheduleOnDate = (date: Dayjs) => {
    const dateString = date.format("YYYY-MM-DD");

    // effectiveEmployeeSchedule에서 해당 날짜에 시간이 있는지 확인 (전체 저장된 데이터만)
    const hasFromEffective =
      effectiveEmployeeSchedule?.checkedTime?.some((time) => {
        const timeDate = dayjs(time).format("YYYY-MM-DD");
        return timeDate === dateString;
      }) || false;

    return hasFromEffective;
  };

  // selectedDate가 변경될 때마다 해당 날짜의 시간 설정
  useEffect(() => {
    const dateString = selectedDate.format("YYYY-MM-DD");

    // 과거 날짜인 경우 수정 불가 (일정 유무와 관계없이)
    if (isPastDate(selectedDate)) {
      // 과거 날짜에 일정이 있는 경우에만 기존 데이터 표시, 없으면 빈 배열
      if (hasScheduleOnDate(selectedDate)) {
        const employeeSelectedTimes: string[] = [];
        if (effectiveEmployeeSchedule?.checkedTime) {
          effectiveEmployeeSchedule.checkedTime.forEach((time) => {
            const date = dayjs(time);
            const timeDate = date.format("YYYY-MM-DD");
            if (timeDate === dateString) {
              const timeStr = date.format("HH:mm");
              employeeSelectedTimes.push(timeStr);
            }
          });
        }
        setSelectedDateSchedules(employeeSelectedTimes);
      } else {
        setSelectedDateSchedules([]);
      }
      return;
    }

    // 1. allSelectedSchedules에서 해당 날짜의 저장된 시간 확인 (우선순위 1)
    const savedTimes = allSelectedSchedules[dateString] || [];

    // 2. 간호사가 선택한 상담 일정에서 해당 날짜의 시간 확인 (우선순위 2)
    // 단, allSelectedSchedules에 저장된 데이터가 있으면 effectiveEmployeeSchedule은 무시
    const employeeSelectedTimes: string[] = [];
    if (savedTimes.length === 0 && effectiveEmployeeSchedule?.checkedTime) {
      effectiveEmployeeSchedule.checkedTime.forEach((time) => {
        // ISO 문자열 형식 파싱
        const date = dayjs(time);
        const timeDate = date.format("YYYY-MM-DD");
        if (timeDate === dateString) {
          const timeStr = date.format("HH:mm");
          employeeSelectedTimes.push(timeStr);
        }
      });
    }

    // 3. 저장된 데이터가 있으면 그것을 사용, 없으면 effectiveEmployeeSchedule 사용
    const allTimes = savedTimes.length > 0 ? savedTimes : employeeSelectedTimes;
    setSelectedDateSchedules(allTimes);
  }, [selectedDate, effectiveEmployeeSchedule, allSelectedSchedules]);

  // 달력에서 날짜 선택 시 호출 (간단하게 수정)
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  // 시간 슬롯 토글 (과거 날짜는 일정 유무와 관계없이 수정 불가)
  const toggleTimeSlot = (timeSlot: string) => {
    if (isPastDate(selectedDate)) {
      message.warning("과거 날짜는 수정/생성 할 수 없습니다.");
      return;
    }

    setSelectedDateSchedules((prev) => {
      const newSchedules = prev.includes(timeSlot)
        ? prev.filter((t) => t !== timeSlot)
        : [...prev, timeSlot];

      return newSchedules;
    });
  };

  // 전체 선택/취소 (과거 날짜는 일정 유무와 관계없이 수정 불가)
  const toggleAllTimes = (selectAll: boolean) => {
    if (isPastDate(selectedDate)) {
      message.warning("과거 날짜는 수정할 수 없습니다.");
      return;
    }

    const newSchedules = selectAll ? [...timeSlots] : [];
    setSelectedDateSchedules(newSchedules);
  };

  // 현재 선택된 날짜의 시간을 전체 일정에 저장 (과거 날짜는 일정 유무와 관계없이 저장 불가)
  const saveCurrentDateSchedule = () => {
    if (isPastDate(selectedDate)) {
      message.warning("과거 날짜는 저장할 수 없습니다.");
      return;
    }

    const dateString = selectedDate.format("YYYY-MM-DD");
    setAllSelectedSchedules((prev) => {
      const newSchedules = {
        ...prev,
        [dateString]: [...selectedDateSchedules],
      };

      return newSchedules;
    });
    message.success(`${dateString} 상담 일정이 저장되었습니다.`);
  };

  // 변경사항이 있는지 확인하는 함수
  const hasChanges = () => {
    // 1. 저장된 일정이 없으면 변경사항 없음 (아직 아무것도 저장하지 않은 상태)
    if (Object.keys(allSelectedSchedules).length === 0) {
      return false;
    }

    // 2. 저장된 일정과 기존 일정을 비교
    for (const [dateString, newTimes] of Object.entries(allSelectedSchedules)) {
      // 기존 데이터에서 해당 날짜의 시간들 추출
      const existingTimes: string[] = [];
      if (effectiveEmployeeSchedule?.checkedTime) {
        effectiveEmployeeSchedule.checkedTime.forEach((time) => {
          const date = dayjs(time);
          const timeDate = date.format("YYYY-MM-DD");
          if (timeDate === dateString) {
            const timeStr = date.format("HH:mm");
            existingTimes.push(timeStr);
          }
        });
      }

      // 시간 배열을 정렬해서 비교
      const sortedNewTimes = [...newTimes].sort();
      const sortedExistingTimes = [...existingTimes].sort();

      // 배열이 다르면 변경사항 있음 (빈 배열로 변경하는 경우도 포함)
      if (
        JSON.stringify(sortedNewTimes) !== JSON.stringify(sortedExistingTimes)
      ) {
        return true;
      }
    }

    return false;
  };

  // 현재 날짜에 변경사항이 있는지 확인하는 함수
  const hasCurrentDateChanges = () => {
    const dateString = selectedDate.format("YYYY-MM-DD");

    // 비교 기준 결정: allSelectedSchedules에 저장된 데이터가 있으면 그것을, 없으면 원본 데이터 사용
    let referenceTimes: string[] = [];

    if (allSelectedSchedules.hasOwnProperty(dateString)) {
      // 이미 "현재 날짜 저장"을 한 적이 있는 날짜라면, 저장된 데이터와 비교
      referenceTimes = allSelectedSchedules[dateString];
    } else {
      // 아직 저장한 적이 없는 날짜라면, 원본 데이터와 비교
      if (effectiveEmployeeSchedule?.checkedTime) {
        effectiveEmployeeSchedule.checkedTime.forEach((time) => {
          const date = dayjs(time);
          const timeDate = date.format("YYYY-MM-DD");
          if (timeDate === dateString) {
            const timeStr = date.format("HH:mm");
            referenceTimes.push(timeStr);
          }
        });
      }
    }

    // 시간 배열을 정렬해서 비교
    const sortedSelectedTimes = [...selectedDateSchedules].sort();
    const sortedReferenceTimes = [...referenceTimes].sort();

    // 배열이 다르면 변경사항 있음
    return (
      JSON.stringify(sortedSelectedTimes) !==
      JSON.stringify(sortedReferenceTimes)
    );
  };

  // 모든 선택된 일정을 API로 전송 (기존 데이터 + 새로 추가된 데이터 합쳐서)
  const handleSaveAll = () => {
    const allCheckedTimes: Date[] = [];

    // 1. 기존에 useEmployeeSchedule에서 받아온 데이터 추가 (effectiveEmployeeSchedule 사용)
    // 단, 새로 선택한 날짜의 시간은 제외 (나중에 새로 선택한 데이터로 대체)
    if (effectiveEmployeeSchedule?.checkedTime) {
      effectiveEmployeeSchedule.checkedTime.forEach((timeStr) => {
        // ISO 문자열 형식 파싱
        const date = dayjs(timeStr);
        const timeDate = date.format("YYYY-MM-DD");

        // 새로 선택한 날짜가 아닌 경우에만 기존 데이터 유지
        if (!allSelectedSchedules[timeDate]) {
          allCheckedTimes.push(date.toDate());
        }
      });
    }

    // 2. 새로 선택한 일정 데이터 추가 (기존 데이터를 대체)
    Object.entries(allSelectedSchedules).forEach(([dateStr, times]) => {
      times.forEach((timeStr) => {
        const [hours, minutes] = timeStr.split(":");
        const date = dayjs(dateStr)
          .hour(parseInt(hours))
          .minute(parseInt(minutes))
          .toDate();
        allCheckedTimes.push(date);
      });
    });

    // 빈 배열이어도 API 호출 (모든 일정 삭제 의미)
    registerEmployeeSchedule({
      checkedTime: allCheckedTimes, // 기존 데이터 + 새로 추가된 데이터 합쳐서 전송 (빈 배열일 수 있음)
    });

    if (allCheckedTimes.length === 0) {
      message.success("모든 상담 일정이 삭제되었습니다.");
    } else {
      message.success("모든 상담 일정이 저장되었습니다.");
    }

    // 저장 후 임시 저장 데이터 초기화
    setAllSelectedSchedules({});
  };

  // 달력 셀 렌더링 (과거 날짜는 일정 유무와 관계없이 회색으로 표시)
  const dateCellRender = (value: Dayjs) => {
    const dateString = value.format("YYYY-MM-DD");

    // 과거 날짜인지 확인
    const isPast = isPastDate(value);

    // effectiveEmployeeSchedule에서 해당 날짜에 시간이 있는지 확인 (전체 저장된 데이터만)
    const hasConsultations =
      effectiveEmployeeSchedule?.checkedTime?.some((time) => {
        const date = dayjs(time);
        const timeDate = date.format("YYYY-MM-DD");
        return timeDate === dateString;
      }) || false;

    if (hasConsultations) {
      return (
        <div className="events">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              isPast ? "bg-gray-400" : "bg-blue-500"
            }`}
          >
            {value.date()}
          </div>
        </div>
      );
    }
    return null;
  };

  const cellRender: CalendarProps<Dayjs>["cellRender"] = (current, info) => {
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

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
                  {user?.name || "김영규"}님, 안녕하세요!
                </Title>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  상담 일정을 관리할 수 있습니다.
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
          {/* 상담 달력 */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 600 }}>
                    상담 달력
                  </span>
                </div>
              }
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <Calendar
                cellRender={cellRender}
                fullscreen={true}
                value={selectedDate}
                onSelect={handleDateSelect}
                style={{ background: "white" }}
              />
            </Card>
          </Col>

          {/* 선택된 날짜의 상담 시간 설정 */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 600 }}>
                    {selectedDate.format("YYYY년 M월 D일")} 상담 시간 설정
                    {isPastDate(selectedDate) && (
                      <span
                        style={{
                          color: "#ff4d4f",
                          fontSize: "14px",
                          marginLeft: "8px",
                        }}
                      >
                        (수정 불가)
                      </span>
                    )}
                  </span>
                  <Space size="small">
                    <AntButton
                      size="small"
                      type="text"
                      onClick={() => toggleAllTimes(true)}
                      disabled={isPastDate(selectedDate)}
                    >
                      전체선택
                    </AntButton>
                    <AntButton
                      size="small"
                      type="text"
                      onClick={() => toggleAllTimes(false)}
                      disabled={isPastDate(selectedDate)}
                    >
                      전체취소
                    </AntButton>
                  </Space>
                </div>
              }
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              <Alert
                message={
                  isPastDate(selectedDate)
                    ? "오늘로부터 3일 이후의 날짜만 수정/생성 할 수 있습니다."
                    : "달력에서 날짜를 선택하면 해당 날짜의 상담 시간을 설정할 수 있습니다."
                }
                type={isPastDate(selectedDate) ? "warning" : "info"}
                showIcon
                style={{ marginBottom: "16px" }}
                closable
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "4px",
                  marginTop: "12px",
                }}
              >
                {timeSlots.map((timeSlot) => {
                  const isSelected = selectedDateSchedules.includes(timeSlot);
                  const isPast = isPastDate(selectedDate);

                  return (
                    <AntButton
                      key={timeSlot}
                      size="small"
                      type={isSelected ? "primary" : "default"}
                      onClick={() => toggleTimeSlot(timeSlot)}
                      disabled={isPast}
                      style={{
                        fontSize: "12px",
                        height: "28px",
                        borderRadius: "4px",
                        backgroundColor: isPast
                          ? isSelected
                            ? "#1677ff"
                            : "#f5f5f5"
                          : undefined,
                        borderColor: isPast
                          ? isSelected
                            ? "#1677ff"
                            : "#d9d9d9"
                          : undefined,
                        color: isPast
                          ? isSelected
                            ? "#ffffff"
                            : "#bfbfbf"
                          : undefined,
                        opacity: isPast ? 0.7 : 1,
                      }}
                    >
                      {timeSlot}
                    </AntButton>
                  );
                })}
              </div>

              {selectedDateSchedules.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    background: "#f0f7f7",
                    borderRadius: "6px",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "13px",
                      color: "#92C3BF",
                      fontWeight: 500,
                    }}
                  >
                    선택된 시간: {selectedDateSchedules.join(", ")}
                  </Text>
                </div>
              )}

              {/* 저장 버튼 추가 */}
              <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                <AntButton
                  type="primary"
                  size="small"
                  onClick={saveCurrentDateSchedule}
                  disabled={
                    isPastDate(selectedDate) || !hasCurrentDateChanges()
                  }
                  style={{ flex: 1, color: "white" }}
                >
                  현재 날짜 추가
                </AntButton>
                <AntButton
                  size="small"
                  onClick={() => setSelectedDateSchedules([])}
                  disabled={
                    selectedDateSchedules.length === 0 ||
                    isPastDate(selectedDate)
                  }
                >
                  초기화
                </AntButton>
              </div>
            </Card>

            {/* 저장 버튼 카드 */}
            <Card
              style={{
                marginTop: "16px",
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
              bodyStyle={{ padding: "16px" }}
            >
              {/* 선택된 날짜별 시간 요약 */}
              {Object.keys(allSelectedSchedules).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <Text strong style={{ fontSize: "14px", color: "#92C3BF" }}>
                    저장 예정 일정
                  </Text>
                  <div style={{ marginTop: "8px" }}>
                    {Object.entries(allSelectedSchedules)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateString, times]) => (
                        <div
                          key={dateString}
                          style={{
                            padding: "8px 12px",
                            margin: "4px 0",
                            background: "#f0f7f7",
                            border: "1px solid #92C3BF",
                            borderRadius: "4px",
                          }}
                        >
                          <Text strong style={{ color: "#92C3BF" }}>
                            {dayjs(dateString).format("M월 D일 (dddd)")}
                          </Text>
                          <div style={{ marginTop: "4px" }}>
                            {times.length > 0 ? (
                              <Text style={{ fontSize: "13px", color: "#666" }}>
                                {times.sort().join(", ")}
                              </Text>
                            ) : (
                              <Text
                                style={{ fontSize: "13px", color: "#ff4d4f" }}
                              >
                                모든 시간 삭제
                              </Text>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center" }}>
                <AntButton
                  size="large"
                  onClick={handleSaveAll}
                  type="primary"
                  disabled={!hasChanges()}
                  style={{ width: "100%", color: "white" }}
                >
                  전체 저장하기
                </AntButton>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AppLayout>
  );
}
