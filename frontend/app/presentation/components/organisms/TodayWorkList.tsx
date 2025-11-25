import { geekblue } from "@ant-design/colors";
import { ClockCircleOutlined, MedicineBoxOutlined } from "@ant-design/icons";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HotelIcon from "@mui/icons-material/Hotel";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SunnyIcon from "@mui/icons-material/Sunny";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import { Button, Card, Divider, Image, Spin, Timeline } from "antd";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import AddMedicationPhotoModal from "~/presentation/pages/nurse/patient-detail/components/modal/AddMedicationPhotoModal";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";
import type { TodayMedicationSchedule } from "../../../features/task/domain/Task";
import ConsultationDetailModal from "../../pages/nurse/patient-detail/components/modal/ConsultationDetailModal";

interface TodayWorkListCardProps {
  hospitalSchedules: AllSchedules[];
  consultationSchedules: AllSchedules[];
  medicationSchedules: TodayMedicationSchedule[];
  isLoading?: boolean;
}

// 시간별 타임라인 생성 (00:00-24:00, 1시간 간격)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour <= 24; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
};

// 복약 시간 분류 정의 (기관별 시간은 동적으로 계산)
const medicationTimeCategories = [
  {
    category: "BEFORE_BREAKFAST",
    icon: <WbTwilightIcon style={{ color: "yellow", fontSize: "16px" }} />,
    color: "orange",
    label: "아침 전",
  },
  {
    category: "AFTER_BREAKFAST",
    icon: <WbTwilightIcon style={{ color: "#fa8c16", fontSize: "16px" }} />,
    color: "yellow",
    label: "아침 후",
  },
  {
    category: "BEFORE_LUNCH",
    icon: <SunnyIcon style={{ color: "yellow", fontSize: "16px" }} />,
    color: "blue",
    label: "점심 전",
  },
  {
    category: "AFTER_LUNCH",
    icon: <SunnyIcon style={{ color: "#fa8c16", fontSize: "16px" }} />,
    color: "green",
    label: "점심 후",
  },
  {
    category: "BEFORE_DINNER",
    icon: <BedtimeIcon style={{ color: "yellow", fontSize: "16px" }} />,
    color: "purple",
    label: "저녁 전",
  },
  {
    category: "AFTER_DINNER",
    icon: <BedtimeIcon style={{ color: "#fa8c16", fontSize: "16px" }} />,
    color: "cyan",
    label: "저녁 후",
  },
  {
    category: "BEDTIME",
    icon: <HotelIcon style={{ color: geekblue[4], fontSize: "16px" }} />,
    color: "magenta",
    label: "취침 전",
  },
];

interface ScheduleItem {
  id: number;
  type: "hospital" | "consultation";
  title: string;
  patient: string;
  time: string;
  doctor?: string;
  guardian?: string;
  startedAt: Date;
  endedAt: Date;
  content?: string;
}

export default function TodayWorkListCard({
  hospitalSchedules,
  consultationSchedules,
  medicationSchedules,
  isLoading,
}: TodayWorkListCardProps) {
  const timeSlots = generateTimeSlots();
  const today = dayjs();
  const navigate = useNavigate();
  const medicationScrollRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<AllSchedules | null>(
    null
  );

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 오늘 일정 필터링
  const todayHospitalSchedules = hospitalSchedules.filter(
    (schedule) =>
      dayjs(schedule.meetingTime).format("YYYY-MM-DD") ===
      today.format("YYYY-MM-DD")
  );

  const todayConsultationSchedules = consultationSchedules.filter(
    (schedule) =>
      dayjs(schedule.meetingTime).format("YYYY-MM-DD") ===
      today.format("YYYY-MM-DD")
  );

  // 오늘 복약 일정 필터링 (근데 받아오는 데이터가 이미 today 기준이여서 필터링안해도 되지만 다시 한 번 체크)
  const todayMedicationSchedules = medicationSchedules.filter(
    (schedule) =>
      dayjs(schedule.medicationDate).format("YYYY-MM-DD") ===
      today.format("YYYY-MM-DD")
  );

  // 시간별 일정 매핑
  const getSchedulesForTime = (timeSlot: string): ScheduleItem[] => {
    const hour = parseInt(timeSlot.split(":")[0]);
    const schedules: ScheduleItem[] = [];

    // 병원 일정
    todayHospitalSchedules.forEach((schedule) => {
      const scheduleHour = dayjs(schedule.meetingTime).hour();
      if (scheduleHour === hour && schedule.meetingType === "withDoctor") {
        schedules.push({
          id: schedule.id,
          type: "hospital",
          title: `${schedule.hospitalName} - ${schedule.classification}`,
          patient: schedule.senior.name,
          time: dayjs(schedule.meetingTime).format("HH:mm"),
          doctor: schedule.doctorName || "",
          startedAt: schedule.startedAt,
          endedAt: schedule.endedAt,
          content: schedule.content || "",
        });
      }
    });

    // 상담 일정
    todayConsultationSchedules.forEach((schedule) => {
      const scheduleHour = dayjs(schedule.meetingTime).hour();
      if (scheduleHour === hour && schedule.meetingType === "withEmployee") {
        schedules.push({
          id: schedule.id,
          type: "consultation",
          title: schedule.title,
          patient: schedule.senior.name,
          time: dayjs(schedule.meetingTime).format("HH:mm"),
          guardian: schedule.guardian.name,
          startedAt: schedule.startedAt,
          endedAt: schedule.endedAt,
          content: schedule.content || "",
        });
      }
    });

    return schedules;
  };

  // 특정 시간 분류에 복약이 필요한 스케줄들 가져오기
  const getSchedulesForMedicationCategory = (category: string) => {
    return todayMedicationSchedules.filter(
      (schedule) => schedule.medicationTime === category
    );
  };

  // 복약 관리 섹션에서 첫 번째 복용 대기 상태인 복약 찾기
  const findFirstPendingMedication = () => {
    for (const category of medicationTimeCategories) {
      const schedulesForCategory = getSchedulesForMedicationCategory(
        category.category
      );
      const pendingSchedule = schedulesForCategory.find(
        (schedule) => !schedule.medicatedAt
      );
      if (pendingSchedule) {
        return { category, schedule: pendingSchedule };
      }
    }
    return null;
  };

  // 현재 시간이 화상채팅 시간대에 해당하는지 확인하는 함수
  const isWithinVideoCallTime = (startedAt: Date, endedAt: Date) => {
    const now = dayjs();
    const startTime = dayjs(startedAt);
    const endTime = dayjs(endedAt);

    return now.isAfter(startTime) && now.isBefore(endTime);
  };

  // 복약 관리 섹션이 로드된 후 자동 스크롤
  useEffect(() => {
    if (!isLoading && medicationSchedules.length > 0) {
      const firstPending = findFirstPendingMedication();
      if (firstPending && medicationScrollRef.current) {
        // 해당 카테고리로 스크롤 (복약관리 섹션 내에서만)
        const categoryElement = medicationScrollRef.current.querySelector(
          `[data-category="${firstPending.category.category}"]`
        );
        if (categoryElement) {
          const scrollContainer = medicationScrollRef.current;
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = categoryElement.getBoundingClientRect();

          // 컨테이너 내에서의 상대적 위치 계산
          const scrollTop =
            elementRect.top - containerRect.top + scrollContainer.scrollTop;

          // 복약관리 섹션 내에서만 스크롤
          scrollContainer.scrollTo({
            top: scrollTop,
            behavior: "smooth",
          });
        }
      }
    }
  }, [isLoading, medicationSchedules]);

  // 복용 등록 관련
  const [isAddMedicationPhotoModalOpen, setIsAddMedicationPhotoModalOpen] =
    useState(false);
  const [selectedMedicationScheduleInfo, setSelectedMedicationScheduleInfo] =
    useState<{
      patientId: number;
      medicationId: number;
      scheduleId: number;
    } | null>(null);
  const [selectedMedicationPhotoPath, setSelectedMedicationPhotoPath] =
    useState<string>();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <Card
      title={<span className="text-xl font-semibold">오늘 할 일</span>}
      className="h-full"
      styles={{ body: { padding: "24px" } }}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 시간별 일정과 복약 관리를 가로로 배치 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 시간별 일정 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ClockCircleOutlined className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  병원 및 상담 일정
                </h3>
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {timeSlots
                  .map((timeSlot) => {
                    const schedules = getSchedulesForTime(timeSlot);
                    return { timeSlot, schedules };
                  })
                  .filter(({ schedules }) => schedules.length > 0).length >
                0 ? (
                  <Timeline
                    mode="left"
                    items={timeSlots
                      .map((timeSlot) => {
                        const schedules = getSchedulesForTime(timeSlot);
                        return { timeSlot, schedules };
                      })
                      .filter(({ schedules }) => schedules.length > 0) // 일정이 있는 시간대만 필터링
                      .map(
                        ({
                          timeSlot,
                          schedules,
                        }: {
                          timeSlot: string;
                          schedules: ScheduleItem[];
                        }) => ({
                          color: "blue",
                          children: (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-700 text-base">
                                  {timeSlot}
                                </span>
                              </div>

                              <div className="space-y-3">
                                {schedules.map((schedule, index: number) => (
                                  <div
                                    key={index}
                                    className="relative overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:border-gray-300"
                                  >
                                    {/* 회색 배경 */}
                                    <div className="absolute inset-0 bg-gray-50 opacity-80" />

                                    <div className="relative p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          {/* 상단: 아이콘, 제목, 시간 */}
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600">
                                              {schedule.type === "hospital" ? (
                                                <LocalHospitalIcon
                                                  style={{ fontSize: "16px" }}
                                                />
                                              ) : (
                                                <EventNoteIcon
                                                  style={{ fontSize: "16px" }}
                                                />
                                              )}
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                  {schedule.title}
                                                </span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                  {schedule.time}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* 하단: 환자 정보 */}
                                          <div className="flex items-center gap-3">
                                            <div className="flex flex-1 items-center gap-3">
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                                <span className="font-semibold text-gray-900">
                                                  {schedule.patient}
                                                </span>
                                              </div>
                                              {schedule.doctor && (
                                                <div className="flex items-center gap-1">
                                                  <span className="text-xs text-gray-500">
                                                    담당의
                                                  </span>
                                                  <span className="text-xs font-medium text-gray-700">
                                                    {schedule.doctor}
                                                  </span>
                                                </div>
                                              )}
                                              {schedule.guardian && (
                                                <div className="flex items-center gap-1">
                                                  <span className="text-xs text-gray-500">
                                                    보호자
                                                  </span>
                                                  <span className="text-xs font-medium text-gray-700">
                                                    {schedule.guardian}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            <span>
                                              <div className="flex items-center gap-2">
                                                {schedule.content &&
                                                schedule.content !== "" ? (
                                                  <Button
                                                    size="small"
                                                    type="primary"
                                                    className="bg-gray-600 hover:bg-gray-700 border-0"
                                                    onClick={() => {
                                                      // 원본 schedule에서 AllSchedules 타입 찾기
                                                      const originalSchedule = [
                                                        ...todayHospitalSchedules,
                                                        ...todayConsultationSchedules,
                                                      ].find(
                                                        (s) =>
                                                          s.id === schedule.id
                                                      );
                                                      if (originalSchedule) {
                                                        setSelectedSchedule(
                                                          originalSchedule
                                                        );
                                                        setIsModalOpen(true);
                                                      }
                                                    }}
                                                  >
                                                    요약 확인
                                                  </Button>
                                                ) : (
                                                  isWithinVideoCallTime(
                                                    schedule.startedAt,
                                                    schedule.endedAt
                                                  ) && (
                                                    <Button
                                                      size="small"
                                                      type="primary"
                                                      className="bg-gray-600 hover:bg-gray-700 border-0"
                                                    >
                                                      <Link
                                                        to={`/video-call/${schedule.id}`}
                                                      >
                                                        화상채팅 바로가기
                                                      </Link>
                                                    </Button>
                                                  )
                                                )}

                                                {/* 일정보기 버튼 */}
                                                <Button
                                                  size="small"
                                                  type="primary"
                                                  className="bg-gray-600 hover:bg-gray-700 border-0"
                                                >
                                                  <Link
                                                    to={
                                                      schedule.type ===
                                                      "hospital"
                                                        ? `/nurse/hospital-schedules`
                                                        : `/nurse/consultation`
                                                    }
                                                  >
                                                    일정보기
                                                  </Link>
                                                </Button>
                                              </div>
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        })
                      )}
                  />
                ) : (
                  <div className="text-gray-400 text-sm italic text-center py-8 bg-gray-50 rounded-lg">
                    오늘 예정된 병원 및 상담 일정이 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* 복약 관리 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MedicineBoxOutlined className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  복약 관리
                </h3>
              </div>

              <div
                ref={medicationScrollRef}
                className="max-h-[500px] overflow-y-auto"
              >
                <Timeline
                  mode="left"
                  items={medicationTimeCategories.map(
                    (category, index: number) => {
                      const schedulesForCategory =
                        getSchedulesForMedicationCategory(category.category);
                      return {
                        color:
                          schedulesForCategory.length > 0 ? "green" : "green",
                        children: (
                          <div
                            className="mb-4"
                            data-category={category.category}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 w-full">
                                <span className="text-2xl flex-shrink-0">
                                  {category.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700 text-base whitespace-nowrap">
                                      {category.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {schedulesForCategory.length > 0
                                        ? dayjs(
                                            schedulesForCategory[0]
                                              .medicationExactTime
                                          ).format("HH:mm")
                                        : "복약 없음"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {schedulesForCategory.length > 0 ? (
                              <div className="space-y-3">
                                {schedulesForCategory.map((schedule) => (
                                  <Card
                                    key={`${schedule.id}-${schedule.schedulesId}`}
                                    className="relative overflow-hidden border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:border-gray-300"
                                    styles={{
                                      body: {
                                        background:
                                          "linear-gradient(to right, rgba(249, 250, 251, 0.8), rgba(243, 244, 246, 0.5))",
                                        padding: "16px",
                                      },
                                    }}
                                  >
                                    <div className="flex justify-between items-end-safe">
                                      <div className="flex-1">
                                        {/* 상단: 환자명만 */}
                                        <div className="mb-3">
                                          <span className="font-semibold text-gray-900 text-base">
                                            {schedule.seniorName}
                                          </span>
                                        </div>

                                        {/* 하단: 복용 상태 */}
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                            <span className="text-xs text-gray-500">
                                              {schedule.medicatedAt
                                                ? "복용 완료"
                                                : "복용 대기"}
                                            </span>
                                          </div>
                                          {schedule.medicatedAt && (
                                            <div className="flex items-center gap-1">
                                              <span className="text-xs text-gray-500">
                                                복용시간
                                              </span>
                                              <span className="text-xs font-medium text-gray-700">
                                                {dayjs(
                                                  schedule.medicatedAt
                                                ).format("HH:mm")}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* 복용 등록 버튼 */}
                                      <div className="ml-4">
                                        <Button
                                          onClick={() => {
                                            if (schedule.medicationPhotoPath) {
                                              setSelectedMedicationPhotoPath(
                                                schedule.medicationPhotoPath
                                              );
                                              setIsImageModalOpen(true);
                                            } else {
                                              setSelectedMedicationScheduleInfo(
                                                {
                                                  patientId: schedule.seniorId,
                                                  medicationId: schedule.id,
                                                  scheduleId:
                                                    schedule.schedulesId,
                                                }
                                              );
                                              setIsAddMedicationPhotoModalOpen(
                                                true
                                              );
                                            }
                                          }}
                                          size="small"
                                          type={
                                            schedule.medicationPhotoPath !==
                                            null
                                              ? "default"
                                              : "primary"
                                          }
                                          className="bg-gray-600 hover:bg-gray-700 border-0 shadow-sm"
                                        >
                                          {schedule.medicationPhotoPath !== null
                                            ? "복용완료"
                                            : "복용등록"}
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm italic text-center py-4 bg-gray-50 rounded-lg">
                                복약이 필요한 시니어가 없습니다
                              </div>
                            )}

                            {/* 마지막 카테고리가 아니면 divider 추가 */}
                            {index < medicationTimeCategories.length - 1 && (
                              <Divider className="my-6" />
                            )}
                          </div>
                        ),
                      };
                    }
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상담 상세 모달 */}
      <ConsultationDetailModal
        consultation={selectedSchedule}
        open={isModalOpen}
        onCancel={handleCancel}
        title="상담 내용 요약"
      />

      {/* 복용 등록 모달 */}
      {selectedMedicationScheduleInfo && (
        <AddMedicationPhotoModal
          open={isAddMedicationPhotoModalOpen}
          onClose={() => {
            setIsAddMedicationPhotoModalOpen(false);
            setSelectedMedicationScheduleInfo(null);
          }}
          onSaved={() => {}}
          patientId={selectedMedicationScheduleInfo?.patientId}
          medicationId={selectedMedicationScheduleInfo?.medicationId}
          scheduleId={selectedMedicationScheduleInfo?.scheduleId}
        />
      )}
      {/* 복용 완료 사진 모달 */}
      <Image
        src={selectedMedicationPhotoPath}
        className="hidden"
        preview={{
          visible: isImageModalOpen,
          onVisibleChange: setIsImageModalOpen,
        }}
      />
    </Card>
  );
}
