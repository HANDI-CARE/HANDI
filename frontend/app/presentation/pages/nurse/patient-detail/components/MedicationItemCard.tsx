import { InfoCircleOutlined } from "@ant-design/icons";
import { Card, Divider, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useMedicationSchedule } from "~/features/patient/application/hooks/usePatients";
import {
  timeOrder,
  type MedicationMinimal,
} from "~/features/patient/domain/Patient";
import MedicationCheckTag from "./MedicationCheckTag";
import AddMedicationPhotoModal from "./modal/AddMedicationPhotoModal";
import DrugInfoItem from "./modal/DrugInfoItem";

const { Text, Title } = Typography;

interface MedicationItemCardProps {
  /**
   * 동일한 처방전 내의 약물들의 집합
   */
  items: MedicationMinimal[];
  scheduleId: number;
  patientId: number;
  date: Date;
}

const MedicationItemCard: React.FC<MedicationItemCardProps> = ({
  items,
  scheduleId,
  patientId,
  date,
}) => {
  const today = useMemo(
    () => new Intl.DateTimeFormat("ko-KR").format(new Date()),
    []
  );

  // 복용 사진 촬영 모달 관련
  const [isAddMedicationPhotoModalOpen, setIsAddMedicationPhotoModalOpen] =
    useState(false);
  const showAddMedicationPhotoModal = () => {
    setIsAddMedicationPhotoModalOpen(true);
  };

  // 설명(키워드/상세) 토글
  const [showDetail, setShowDetail] = useState(false);

  // 동일 처방 스케줄 ID로 상세 스케줄 조회 (description 표시용)
  const { data: schedule, isLoading: scheduleLoading } =
    useMedicationSchedule(scheduleId);

  // 사진을 찍기 위해 선택한 복약 내역
  const [selectedMedication, setSelectedMedication] = useState(-1);

  // 주어진 items로부터 제일 빠른 medicationDate를 통해 startDate와 endDate를 결정
  const { startDate, endDate } = useMemo(() => {
    if (items && items.length > 0) {
      const dates = items.map((m) => dayjs(m.medicationDate));
      const min = dates.reduce(
        (acc, d) => (d.isBefore(acc) ? d : acc),
        dates[0]
      );
      const max = dates.reduce(
        (acc, d) => (d.isAfter(acc) ? d : acc),
        dates[0]
      );
      return { startDate: min.toDate(), endDate: max.toDate() };
    }
    const s = schedule?.startDate
      ? dayjs(schedule.startDate).toDate()
      : new Date();
    const e = schedule?.endDate ? dayjs(schedule.endDate).toDate() : s;
    return { startDate: s, endDate: e };
  }, [items, schedule?.startDate, schedule?.endDate]);

  // items에서 medicationDate이 주어진 `date` props와 일치하는 것만 필터링
  const filteredItems = useMemo(() => {
    return items
      .sort((a, b) => timeOrder[a.medicationTime] - timeOrder[b.medicationTime])
      .filter((item) => dayjs(item.medicationDate).isSame(date, "day"));
  }, [items, date]);

  return (
    <>
      <Card
        type="inner"
        title={
          <div className="flex flex-col py-2">
            <Title level={5} className="!mb-0">
              {schedule?.medicationName}
            </Title>
            <Text type="secondary" style={{ fontWeight: 400 }}>
              {`${dayjs(startDate).format("YYYY.MM.DD")} ~ ${dayjs(
                endDate
              ).format("YYYY.MM.DD")}`}
            </Text>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* 약물 정보 리스트 */}
          {schedule?.description?.drug_candidates &&
            schedule.description.drug_candidates.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2">
                  <Text strong>약물 정보</Text>
                  <Tooltip title="AI를 이용해 생성된 정보예요. 주요 약물의 주의 사항이나 복용 방법 등은 중요한 정보는 반드시 의사나 약사를 통해 확인하세요.">
                    <InfoCircleOutlined />
                  </Tooltip>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                  {schedule.description.drug_candidates.map(
                    (drugInfo, index) => (
                      <>
                        <DrugInfoItem
                          key={`${drugInfo.productName}-${index}`}
                          drugInfo={drugInfo}
                          showInfo="all"
                        />
                        {index !==
                          schedule.description.drug_candidates.length - 1 && (
                          <Divider />
                        )}
                      </>
                    )
                  )}
                </div>
              </div>
            )}
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <Text strong>복용 시간</Text>
              <Tooltip
                title={`복용 사진 촬영은 오늘(${today})을 기준으로 진행돼요.`}
              >
                <InfoCircleOutlined />
              </Tooltip>
            </div>
            <div className="flex flex-row flex-wrap gap-2">
              {filteredItems.map((medication) => (
                <MedicationCheckTag
                  timing={medication.medicationTime}
                  onClickTakePicture={showAddMedicationPhotoModal}
                  onClickPictureTaken={(timing) => {
                    setSelectedMedication(medication.id);
                  }}
                  isCompleted={!!medication.medicationPhotoPath}
                  photoPath={medication.medicationPhotoPath ?? undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
      <AddMedicationPhotoModal
        open={isAddMedicationPhotoModalOpen}
        onClose={() => setIsAddMedicationPhotoModalOpen(false)}
        onSaved={() => {}}
        patientId={patientId}
        medicationId={selectedMedication}
        scheduleId={scheduleId}
      />
    </>
  );
};

export default MedicationItemCard;
