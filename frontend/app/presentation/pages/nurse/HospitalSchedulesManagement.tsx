import { UserOutlined } from "@ant-design/icons";
import type { CalendarProps } from "antd";
import {
  Alert,
  Button as AntButton,
  Avatar,
  Calendar,
  Card,
  Col,
  Input,
  List,
  message,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/ko";
import { useMemo, useState } from "react";
import {
  useAllSchedules,
  useCreateNewMeeting,
} from "~/features/hospital/application/hooks/useHospitals";
import { useAssignedPatientsWithRelations } from "~/features/patient/application/hooks/usePatients";
import { useUserStore } from "~/presentation/stores/userStore";
import { AppLayout } from "../../components/templates/AppLayout";


dayjs.extend(isBetween);
dayjs.locale("ko");

const { Title, Text } = Typography;
const { Option } = Select;

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

/**
 * 간호사 진료 일정 관리 페이지
 *
 * 간호사 담당 환자들을 우선 조회한 뒤, 환자의 연관 사용자 정보가 담겨 있는
 * 환자 상세 정보 API를 환자 별로 조회하여 보호자와 시니어를 매핑하여 사용
 */

export default function HospitalSchedulesManagement() {
  const { user } = useUserStore();

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedGuardianId, setSelectedGuardianId] = useState<number | null>(
    null
  );
  const [selectedSeniorId, setSelectedSeniorId] = useState<number | null>(null);
  const { guardianOptions, guardianToSeniors } =
    useAssignedPatientsWithRelations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [classification, setClassification] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{
    id: number;
    title: string;
    meetingTime: Date | string | number;
    guardian?: { id: number; name: string } | null;
    senior?: { id: number; name: string } | null;
  } | null>(null);

  const { mutate: createMeeting, isPending: creating } = useCreateNewMeeting();

  // withDoctor 스케줄 조회
  const { data: schedulesData } = useAllSchedules(
    { meetingType: "withDoctor" },
    { page: 1, size: 99999, startDate:'19900101', endDate: '20501231' }
  );

  // 오늘 이전 날짜인지 확인하는 함수 (오늘과 오늘 이후만 선택 가능)
  const isPastDate = (date: Dayjs) => {
    const today = dayjs();
    return date.isBefore(today, 'day');
  };

  // 날짜 선택 시 시간 초기화
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  // 선택 날짜의 비활성 시간 계산
  const disabledTimesForSelectedDate = useMemo(() => {
    const list = schedulesData?.result || [];
    const dateKey = selectedDate.format("YYYY-MM-DD");
    return list
      .filter(
        (item) => dayjs(item.meetingTime).format("YYYY-MM-DD") === dateKey
      )
      .map((item) => dayjs(item.meetingTime).format("HH:mm"));
  }, [schedulesData, selectedDate]);

  const isTimeDisabled = (timeSlot: string) =>
    disabledTimesForSelectedDate.includes(timeSlot);

  const onClickTimeSlot = (timeSlot: string) => {
    if (isPastDate(selectedDate)) {
      message.warning("과거 날짜는 수정/생성 할 수 없습니다.");
      return;
    }
    if (isTimeDisabled(timeSlot)) return;
    setSelectedTimeSlot((prev) => (prev === timeSlot ? null : timeSlot));
  };

  // 모달 제어 및 생성 실행
  const openRequestModal = () => {
    if (isPastDate(selectedDate)) {
      message.warning("과거 날짜는 상담을 신청할 수 없습니다.");
      return;
    }
    setIsModalOpen(true);
  };
  const closeRequestModal = () => setIsModalOpen(false);

  const handleConfirmRequest = () => {
    if (
      !user?.id ||
      !selectedGuardianId ||
      !selectedSeniorId ||
      !selectedTimeSlot
    ) {
      message.warning("보호자, 시니어, 시간, 제목을 모두 선택/입력하세요.");
      return;
    }
    if (!meetingTitle.trim()) {
      message.warning("상담 제목을 입력하세요.");
      return;
    }
    if (!doctorName.trim()) {
      message.warning("의사명을 입력하세요.");
      return;
    }
    if (!hospitalName.trim()) {
      message.warning("병원명을 입력하세요.");
      return;
    }
    if (!classification.trim()) {
      message.warning("상담분류를 입력하세요.");
      return;
    }

    const dateTime = dayjs(
      `${selectedDate.format("YYYY-MM-DD")} ${selectedTimeSlot}`
    );
    const meetingTime = dateTime.format("YYYYMMDDHHmmss");

    createMeeting(
      {
        employeeId: user.id,
        guardianId: selectedGuardianId,
        seniorId: selectedSeniorId,
        meetingTime,
        title: meetingTitle.trim(),
        meetingType: "withDoctor",
        doctorName: doctorName.trim(),
        hospitalName: hospitalName.trim(),
        classification: classification.trim(),
      },
      {
        onSuccess: () => {
          message.success("상담이 신청되었습니다.");
          setIsModalOpen(false);
          setMeetingTitle("");
          setDoctorName("");
          setHospitalName("");
          setClassification("");
          setSelectedTimeSlot(null);
        },
        onError: () => {
          message.error("상담 신청에 실패했습니다.");
        },
      }
    );
  };

  // 선택된 날짜의 예약 목록
  const selectedDateMeetings = useMemo(() => {
    const list = schedulesData?.result || [];
    const dateKey = selectedDate.format("YYYY-MM-DD");
    return list
      .filter(
        (item) => dayjs(item.meetingTime).format("YYYY-MM-DD") === dateKey
      )
      .sort(
        (a, b) =>
          dayjs(a.meetingTime).valueOf() - dayjs(b.meetingTime).valueOf()
      );
  }, [schedulesData, selectedDate]);

  const openDeleteModal = (item: any) => {
    setScheduleToDelete(item);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = () => {
    setIsDeleteModalOpen(false);
    setScheduleToDelete(null);
    message.success("삭제되었습니다.");
  };
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setScheduleToDelete(null);
  };

  // 달력 셀 렌더링: 해당 날짜에 예약이 있으면 점 표시
  const dateCellRender = (value: Dayjs) => {
    const dateString = value.format("YYYY-MM-DD");
    const hasConsultations = (schedulesData?.result || []).some(
      (item) => dayjs(item.meetingTime).format("YYYY-MM-DD") === dateString
    );
    
    // 과거 날짜인지 확인
    const isPast = isPastDate(value);
    
    if (hasConsultations) {
      return (
        <div className="events">
          <div 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
              isPast ? 'bg-gray-400' : 'bg-blue-500'
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

  // 임시저장
  const handleTempSave = () => {
    message.info("임시저장되었습니다.");
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
                  {user?.name || '김영규' }님, 안녕하세요!
                </Title>
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  병원 일정을 관리할 수 있습니다.
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
                  <Space></Space>
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
                      <span style={{ color: "#ff4d4f", fontSize: "14px", marginLeft: "8px" }}>
                        (수정 불가)
                      </span>
                    )}
                  </span>
                  <Space size="small"></Space>
                </div>
              }
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              }}
            >
              {/* 보호자/시니어 선택 */}
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="small"
              >
                <Select
                  placeholder="보호자를 선택하세요"
                  value={selectedGuardianId ?? undefined}
                  onChange={(v) => {
                    setSelectedGuardianId(v);
                    setSelectedSeniorId(null);
                  }}
                  allowClear
                  style={{ width: "100%" }}
                  disabled={isPastDate(selectedDate)}
                >
                  {guardianOptions.map((g) => (
                    <Option key={g.id} value={g.id}>
                      {g.name}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="시니어를 선택하세요"
                  value={selectedSeniorId ?? undefined}
                  onChange={setSelectedSeniorId}
                  disabled={!selectedGuardianId || isPastDate(selectedDate)}
                  allowClear
                  style={{ width: "100%" }}
                >
                  {(selectedGuardianId
                    ? guardianToSeniors[selectedGuardianId] || []
                    : []
                  ).map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Space>

              <Alert
                message={
                  isPastDate(selectedDate)
                    ? "과거 날짜는 수정/생성 할 수 없습니다."
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
                  const isSelected = selectedTimeSlot === timeSlot;
                  const isDisabled = isTimeDisabled(timeSlot);
                  const isPast = isPastDate(selectedDate);
                  
                  return (
                    <AntButton
                      key={timeSlot}
                      size="small"
                      type={isSelected ? "primary" : "default"}
                      disabled={isDisabled || isPast}
                      onClick={() => onClickTimeSlot(timeSlot)}
                      style={{
                        fontSize: "12px",
                        height: "28px",
                        borderRadius: "4px",
                        opacity: (isDisabled || isPast) ? 0.5 : 1,
                      }}
                    >
                      {timeSlot}
                    </AntButton>
                  );
                })}
              </div>

              {selectedTimeSlot && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    background: "#f0f7f7",
                    borderRadius: "6px",
                  }}
                >
                  <Text style={{ fontSize: "13px", color: "#92C3BF", fontWeight: 500 }}>
                    선택된 시간: {selectedTimeSlot}
                  </Text>
                </div>
              )}

              <div style={{ marginTop: "16px" }}>
                <AntButton
                  type="primary"
                  size="middle"
                  onClick={openRequestModal}
                  disabled={
                    !selectedGuardianId ||
                    !selectedSeniorId ||
                    !selectedTimeSlot ||
                    !user?.id ||
                    isPastDate(selectedDate)
                  }
                  style={{ width: "100%", color: "white" }}
                >
                  상담 신청
                </AntButton>
              </div>
            </Card>

            {/* 신청된 예약 목록 */}
            <Card
              style={{ marginTop: 16 }}
              title={
                <span style={{ fontSize: "16px", fontWeight: 600 }}>
                  신청된 예약 목록
                </span>
              }
            >
              <List
                locale={{ emptyText: "선택한 날짜에 예약이 없습니다." }}
                dataSource={selectedDateMeetings}
                renderItem={(item: any) => {
                  const time = dayjs(item.meetingTime).format("HH:mm");
                  const guardianName = item.guardian?.name || "-";
                  const seniorName = item.senior?.name || "-";
                  const title = item.title || "(제목 없음)";
                  return (
                    <List.Item
                      actions={[
                        <AntButton
                          key="delete"
                          danger
                          size="small"
                          onClick={() => openDeleteModal(item)}
                          disabled={isPastDate(selectedDate)}
                        >
                          삭제
                        </AntButton>,
                      ]}
                    >
                      <List.Item.Meta
                        title={`${time} · ${title}`}
                        description={`보호자: ${guardianName} / 시니어: ${seniorName}`}
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 상담 신청 모달 */}
        <Modal
          title="상담 제목 입력"
          open={isModalOpen}
          onOk={handleConfirmRequest}
          confirmLoading={creating}
          onCancel={() => setIsModalOpen(false)}
          okText="신청"
          cancelText="취소"
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Input
              placeholder="상담 제목을 입력하세요"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              maxLength={100}
            />
            <Input
              placeholder="병원명을 입력하세요"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              maxLength={100}
            />
            <Input
              placeholder="의사명을 입력하세요"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              maxLength={100}
            />
            <Input
              placeholder="상담분류를 입력하세요"
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              maxLength={100}
            />
          </Space>
        </Modal>

        {/* 예약 삭제 확인 모달 (실제 삭제 미구현) */}
        <Modal
          title="예약 삭제"
          open={isDeleteModalOpen}
          onOk={confirmDelete}
          onCancel={cancelDelete}
          okText="삭제"
          cancelText="취소"
        >
          <div>
            {scheduleToDelete ? (
              <span>
                {`${dayjs(scheduleToDelete.meetingTime).format(
                  "YYYY-MM-DD HH:mm"
                )} · ${
                  scheduleToDelete.title || "(제목 없음)"
                } 예약을 삭제하시겠습니까?`}
              </span>
            ) : (
              <span>예약을 삭제하시겠습니까?</span>
            )}
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
