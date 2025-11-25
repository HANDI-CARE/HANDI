import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Spin,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import type { DrugInfo } from "~/features/drug/application/domain/DrugInfo";
import { useDrugSearch } from "~/features/drug/application/hooks/useDrug";
import { useCreatePrescription } from "~/features/patient/application/hooks/usePatients";
import type { MedicationScheduleTime } from "~/features/patient/domain/MedicationItem";
import { formatDate } from "~/shared/utils/dateUtils";
import MedicationTimingTag from "../MedicationTimingTag";
import DetectPrescriptionModal from "./DetectPrescriptionModal";
import DrugInfoItem from "./DrugInfoItem";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text, Title } = Typography;

type RangeValue = [Dayjs | null, Dayjs | null] | null;

// MedicineTimingCard에서 사용하는 타이밍 옵션들
const medicationTimings: MedicationScheduleTime[] = [
  "BEFORE_BREAKFAST",
  "AFTER_BREAKFAST",
  "BEFORE_LUNCH",
  "AFTER_LUNCH",
  "BEFORE_DINNER",
  "AFTER_DINNER",
  "BEDTIME",
];

interface AddPrescriptionModalProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
}

export default function AddPrescriptionModal({
  open,
  onClose,
  patientId,
}: AddPrescriptionModalProps) {
  const handleCancel = () => {
    onClose();
  };

  return (
    <ConfigProvider theme={{ token: { motion: false } }}>
      <Modal
        open={open}
        onCancel={handleCancel}
        title="처방 내역"
        destroyOnHidden
        footer={null}
        width={600}
        className="overflow-auto"
        styles={{
          body: {
            maxHeight: "70vh",
            overflowY: "auto",
          },
        }}
      >
        <AddPrescriptionModalContent onClose={onClose} patientId={patientId} />
      </Modal>
    </ConfigProvider>
  );
}

function AddPrescriptionModalContent({
  onClose,
  patientId,
}: {
  onClose: () => void;
  patientId: number;
}) {
  const [form] = Form.useForm();
  const [prescriptionTitle, setPrescriptionTitle] = useState("");
  const [selectedTimes, setSelectedTimes] = useState<MedicationScheduleTime[]>(
    []
  );
  const [dateRange, setDateRange] = useState<RangeValue>([
    dayjs(),
    dayjs().add(7, "day"),
  ]);
  const [drugInfoList, setDrugInfoList] = useState<DrugInfo[]>([]);
  const [drugSummaryInfoList, setDrugSummaryInfoList] = useState<
    { name: string; capacity: string }[]
  >([]);
  const [drugSearchQuery, setDrugSearchQuery] = useState("");
  const { data: searchItems, isLoading: searching } =
    useDrugSearch(drugSearchQuery);

  const handleTimingSelect = (timing: MedicationScheduleTime) => {
    if (selectedTimes.includes(timing)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== timing));
    } else {
      setSelectedTimes([...selectedTimes, timing]);
    }
  };

  const isTimingSelected = (timing: MedicationScheduleTime) => {
    return selectedTimes.includes(timing);
  };

  const addDrugToList = (selectedDrug: DrugInfo) => {
    setDrugSearchQuery("");
    setDrugInfoList((prev) => [...prev, selectedDrug]);
    setDrugSummaryInfoList((prev) => [
      ...prev,
      {
        name: selectedDrug.productName,
        capacity: selectedDrug.dosage,
      },
    ]);
  };

  const removeDrugFromList = (index: number) => {
    // drugInfoList와 drugSummaryInfoList의 index 번째를 제거
    setDrugInfoList((prev) => prev.filter((_, i) => i !== index));
    setDrugSummaryInfoList((prev) => prev.filter((_, i) => i !== index));
  };

  const { mutateAsync: createPrescription, isPending: isCreatingPrescription } =
    useCreatePrescription(patientId);

  const handleSave = async () => {
    await createPrescription({
      medicationName: prescriptionTitle,
      startDate: formatDate(dateRange![0]!.toDate()),
      endDate: formatDate(dateRange![1]!.toDate()),
      description: {
        drug_candidates: drugInfoList,
      },
      medicationTimes: selectedTimes,
      drug_summary: drugSummaryInfoList,
    });

    onClose();
  };

  // 처방전 인식 모달 관련
  const [isDetectPrescriptionModalOpen, setIsDetectPrescriptionModalOpen] =
    useState(false);
  const showDetectPrescriptionModal = () => {
    setIsDetectPrescriptionModalOpen(true);
  };

  const onImageDetectDone = (result: {
    drug_candidates: DrugInfo[];
    drug_summary: { name: string; capacity: string }[];
  }) => {
    setDrugInfoList((prev) => [...prev, ...result.drug_candidates]);
    setDrugSummaryInfoList((prev) => [...prev, ...result.drug_summary]);
  };

  return (
    <Spin
      size="large"
      spinning={isCreatingPrescription}
      tip="처방 정보를 저장 중이에요."
    >
      <div className="px-2">
        <Form
          form={form}
          layout="vertical"
          className="space-y-4 flex flex-col gap-4"
        >
          {/* 처방 내역 입력 */}
          <div>
            <Input
              placeholder="처방 내역을 입력하세요"
              value={prescriptionTitle}
              onChange={(e) => setPrescriptionTitle(e.target.value)}
              size="large"
              className="mb-4"
            />
          </div>

          {/* 복용 기간 */}
          <div className="flex flex-col gap-2">
            <Text strong>복용 기간</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
              format="YYYY-MM-DD"
              placeholder={["2025-01-01", "2025-01-07"]}
              size="large"
              className="w-full"
              allowClear={false}
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="small"
                onClick={() =>
                  setDateRange((prev) => [
                    prev?.[0] ?? dayjs(),
                    prev?.[0]?.add(3, "day") ?? dayjs().add(3, "day"),
                  ])
                }
              >
                3일
              </Button>
              <Button
                size="small"
                onClick={() =>
                  setDateRange((prev) => [
                    prev?.[0] ?? dayjs(),
                    prev?.[0]?.add(7, "day") ?? dayjs().add(7, "day"),
                  ])
                }
              >
                7일
              </Button>
              <Button
                size="small"
                onClick={() =>
                  setDateRange((prev) => [
                    prev?.[0] ?? dayjs(),
                    prev?.[0]?.add(14, "day") ?? dayjs().add(14, "day"),
                  ])
                }
              >
                14일
              </Button>
              <Button
                size="small"
                onClick={() =>
                  setDateRange((prev) => [
                    prev?.[0] ?? dayjs(),
                    prev?.[0]?.add(30, "day") ?? dayjs().add(30, "day"),
                  ])
                }
              >
                30일
              </Button>
            </div>
          </div>

          {/* 복용 시기 */}
          <div className="flex flex-col gap-2">
            <Text strong>복용 시기</Text>
            <div className="flex flex-row flex-wrap gap-2">
              {medicationTimings.map((timing) => (
                <div
                  key={timing}
                  className="contents"
                  onClick={() => handleTimingSelect(timing)}
                >
                  <MedicationTimingTag
                    className="cursor-pointer"
                    timing={timing}
                    isEnabled={isTimingSelected(timing)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 약물 정보 */}
          <div className="flex flex-col gap-2">
            <Text strong>약물 정보</Text>
            {drugInfoList.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <Empty
                  description={
                    <>
                      약물을 추가해주세요.
                      <br />
                      하단에 처방받은 약 정보를 입력하여 검색하거나,
                      <br />
                      처방전 사진을 올려주시면 자동으로 추가해드려요.
                    </>
                  }
                />
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                {drugInfoList.map((drugInfo, index) => (
                  <>
                    <div className="flex flex-row gap-2 items-start">
                      <div className="flex-1">
                        <DrugInfoItem drugInfo={drugInfo} />
                      </div>
                      <CloseOutlined
                        onClick={() => removeDrugFromList(index)}
                      />
                    </div>
                    {index !== drugInfoList.length - 1 && <Divider />}
                  </>
                ))}
              </div>
            )}
          </div>
          {/* 처방전 인식 */}
          <Button className="w-full" onClick={showDetectPrescriptionModal}>
            사진으로부터 자동 추가
          </Button>

          {/* 약물 검색 및 추가 */}
          <div className="flex flex-col gap-2">
            <Text strong>약물 검색</Text>
            <div className="space-y-3">
              <Input
                placeholder="약물을 검색하여 추가하세요."
                value={drugSearchQuery}
                onChange={(e) => setDrugSearchQuery(e.target.value)}
                prefix={<SearchOutlined className="text-gray-400" />}
                size="large"
              />
              {drugSearchQuery.trim().length > 0 && (
                <Card
                  className="max-h-48 overflow-auto"
                  styles={{ body: { padding: "8px" } }}
                >
                  {searching ? (
                    <Empty description="검색 중..." />
                  ) : (searchItems ?? []).length > 0 ? (
                    <List
                      size="small"
                      dataSource={searchItems}
                      renderItem={(item) => (
                        <List.Item
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => addDrugToList(item)}
                        >
                          <div>
                            <div className="font-medium">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.manufacturer} • {item.dosage}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="검색 결과가 없습니다." />
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button size="large" onClick={onClose} className="px-8">
              취소
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleSave}
              className="px-8"
            >
              저장
            </Button>
          </div>
        </Form>
      </div>
      {/* 처방전 인식 모달 */}
      <DetectPrescriptionModal
        open={isDetectPrescriptionModalOpen}
        onClose={() => setIsDetectPrescriptionModalOpen(false)}
        onDetectDone={onImageDetectDone}
      />
    </Spin>
  );
}
