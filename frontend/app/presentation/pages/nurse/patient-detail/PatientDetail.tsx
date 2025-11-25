import { EditOutlined } from "@ant-design/icons";
import {
  Card,
  Col,
  ConfigProvider,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Skeleton,
  Space,
  Spin,
  Tabs,
  Typography,
} from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { useDocuments } from "~/features/document/application/hooks/useDocuments";
import {
  useAllMedicationsByRange,
  usePatientMemo,
  useUpdatePatientMemo,
  useUpdateVitalSign,
  useVitalSignByDate,
} from "~/features/patient/application/hooks/usePatients";
import type { ObservationRecord } from "~/features/patient/domain/ObservationRecord";
import { useUserStore } from "~/presentation/stores/userStore";
import { formatDate } from "~/shared/utils/dateUtils";
import { getLast7DaysEnd, getLast7DaysStart } from "~/shared/utils/weekUtils";
import { useAllSchedules } from "../../../../features/hospital/application/hooks/useHospitals";
import type { AllSchedules } from "../../../../features/hospital/domain/Hospital";
import {
  usePatient,
  usePatientObservationRecords,
  useVitalSignsByRange,
} from "../../../../features/patient/application/hooks/usePatients";
import { AppLayout } from "../../../components/templates/AppLayout";
import ConsultationRecordCard from "./components/ConsultationRecordCard";
import DocumentItemCard from "./components/DocumentCard";
import MedicationItemCard from "./components/MedicationItemCard";
import AddDocumentModal from "./components/modal/AddDocumentModal";
import AddPrescriptionModal from "./components/modal/AddPrescriptionModal";
import ConsultationDetailModal from "./components/modal/ConsultationDetailModal";
import ConsultationRecordHistory from "./components/modal/ConsultationRecordHistory";
import DocumentHistory from "./components/modal/DocumentHistory";
import ObservationRecordDetail from "./components/modal/ObservationRecordDetail";
import ObservationRecordHistory from "./components/modal/ObservationRecordHistory";
import ObservationRecordCard from "./components/ObservationRecordCard";
import VitalSignCard from "./components/VitalSignCard";

const { Title, Text, Link: TypographyLink } = Typography;
const { TextArea } = Input;

export default function PatientDetail() {
  const { patientId: patientIdStr } = useParams();
  // 메모: 서버 연동 훅 + 로컬 상태 (수정 모드 지원)
  const [localMemoText, setLocalMemoText] = useState("");
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const memoTextAreaRef = useRef<TextAreaRef>(null);

  if (patientIdStr === undefined) {
    throw new Error("patientId is undefined");
  }
  const patientId = parseInt(patientIdStr);

  const userStore = useUserStore();

  // 서버에서 메모 불러오기 / 업데이트 훅
  const { data: memoData, isLoading: memoLoading } = usePatientMemo(patientId);
  const { mutateAsync: updatePatientMemo, isPending: isSavingMemo } =
    useUpdatePatientMemo();

  // 서버 데이터 로드시 로컬 상태 동기화 (편집 중에는 동기화하지 않음)
  useEffect(() => {
    if (!isEditingMemo) {
      setLocalMemoText(memoData?.note ?? "");
    }
  }, [memoData?.note, isEditingMemo]);

  // 수정 모드 진입 시 자동 포커스
  useEffect(() => {
    if (isEditingMemo) {
      memoTextAreaRef.current?.focus();
    }
  }, [isEditingMemo]);

  // 메모 편집/저장/취소 핸들러
  const handleMemoChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    setLocalMemoText(e.target.value);
  };
  const handleStartEdit = () => setIsEditingMemo(true);
  const handleCancelEdit = () => {
    setLocalMemoText(memoData?.note ?? "");
    setIsEditingMemo(false);
  };
  const handleSaveEdit = async () => {
    await updatePatientMemo({
      patientId,
      memo: { patientId, note: localMemoText },
    });
    setIsEditingMemo(false);
  };

  // 훅을 사용하여 환자 정보와 건강 기록 가져오기
  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
  } = usePatient(patientId);

  // 탭 상태: 최근 내역 / 날짜별 보기
  const [activeTab, setActiveTab] = useState<"recent" | "byDate">("recent");
  const handleTabChange = (key: string) => {
    setActiveTab(key === "byDate" ? "byDate" : "recent");
  };

  // 날짜별 보기 상태: 선택 날짜
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // 활력 징후, 복약 내역, 최근 진료/상담 조회 기간: recent(최근 7일) | byDate(선택일)
  const selectedDateRange = useMemo(() => {
    if (activeTab === "byDate") {
      const d = dayjs(selectedDate).toDate();
      return { startDate: d, endDate: d };
    }
    return {
      startDate: getLast7DaysStart(),
      endDate: getLast7DaysEnd(),
    };
  }, [activeTab, selectedDate]);

  // 최근 진료 내역 조회 (useAllSchedules 훅 사용)
  const { data: allSchedulesData, isLoading: consultationLoading } =
    useAllSchedules(
      { meetingType: "withDoctor" },
      {
        page: 1,
        size: 10,
        startDate: formatDate(selectedDateRange.startDate),
        endDate: formatDate(selectedDateRange.endDate),
      }
    );

  // AllSchedules 데이터를 직접 사용
  const consultationRecords = allSchedulesData?.result || [];

  // 최근 상담 내역 조회 (withEmployee)
  const {
    data: allEmployeeSchedulesData,
    isLoading: employeeConsultationLoading,
  } = useAllSchedules(
    { meetingType: "withEmployee" },
    {
      page: 1,
      size: 10,
      startDate: formatDate(selectedDateRange.startDate),
      endDate: formatDate(selectedDateRange.endDate),
    }
  );

  const employeeConsultationRecords = allEmployeeSchedulesData?.result || [];

  // 복약 내역을 보여줄 기준 날짜. 즉 해당 날짜에 촬영이 완료됐는지 여부 등
  // 특별한 일이 없으면 무조건 오늘을 기준으로 보여줌.
  const [selectedMedicationDate, setSelectedMedicationDate] = useState(
    new Date()
  );

  // 문서보관함 목록
  const [docPage, setDocPage] = useState(1);
  const [docSize] = useState(6);
  const { data: documents, isLoading: documentsLoading } = useDocuments(
    patientId,
    {
      page: docPage,
      size: docSize,
      sortBy: "uploadedAt",
      sortDirection: "DESC",
    }
  );

  const { data: vitalSigns, isLoading: vitalSignsLoading } =
    useVitalSignsByRange(
      patientId,
      selectedDateRange.startDate,
      selectedDateRange.endDate
    );

  // 환자 관찰 일지 관련
  const { data: observationRecords, isLoading: observationRecordsLoading } =
    usePatientObservationRecords(patientId, {
      startDate: selectedDateRange.startDate,
      endDate: selectedDateRange.endDate,
      page: 1,
      size: 99999,
    });

  // 관찰 일지 상세보기 모달
  const [
    isObservationRecordDetailModalOpen,
    setIsObservationRecordDetailModalOpen,
  ] = useState(false);
  const showObservationRecordDetailModal = () => {
    setIsObservationRecordDetailModalOpen(true);
  };
  const [selectedObservationRecord, setSelectedObservationRecord] =
    useState<ObservationRecord>();
  const handleObservationRecordClick = (record: ObservationRecord) => {
    setSelectedObservationRecord(record);
    setIsObservationRecordDetailModalOpen(true);
  };

  // 관찰 일지 더보기 모달
  const [
    isObservationRecordHistoryModalOpen,
    setIsObservationRecordHistoryModalOpen,
  ] = useState(false);
  const showObservationRecordModal = () => {
    setIsObservationRecordHistoryModalOpen(true);
  };
  // 관찰 일지 추가 모달
  const [isAddObservationRecordModalOpen, setIsAddObservationRecordModalOpen] =
    useState(false);

  // 복약 내역 추가 모달
  const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] =
    useState(false);
  const showAddPrescriptionModal = () => {
    setIsAddPrescriptionModalOpen(true);
  };

  // 문서 추가 모달
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const showAddDocumentModal = () => {
    setIsAddDocumentModalOpen(true);
  };
  const [isDocumentHistoryModalOpen, setIsDocumentHistoryModalOpen] =
    useState(false);

  // 진료 내용 요약 모달
  const [isConsultationDetailModalOpen, setIsConsultationDetailModalOpen] =
    useState(false);
  const [selectedConsultation, setSelectedConsultation] =
    useState<AllSchedules>();
  const showConsultationDetailModal = (consultation: AllSchedules) => {
    setSelectedConsultation(consultation);
    setIsConsultationDetailModalOpen(true);
  };

  // 진료 내역 히스토리 모달
  const [isConsultationHistoryModalOpen, setIsConsultationHistoryModalOpen] =
    useState(false);
  const showConsultationHistoryModal = () => {
    setIsConsultationHistoryModalOpen(true);
  };

  // 상담 내역 히스토리 모달
  const [
    isEmployeeConsultationHistoryModalOpen,
    setIsEmployeeConsultationHistoryModalOpen,
  ] = useState(false);
  const showEmployeeConsultationHistoryModal = () => {
    setIsEmployeeConsultationHistoryModalOpen(true);
  };

  // 복약 내역: 훅을 사용하여 기간 내 투약 스케줄 목록을 전부 조회한 뒤
  // 각 스케줄 별로 투약 내역을 별도로 조회하여 묶음
  const { data: medications, isLoading: medicationsLoading } =
    useAllMedicationsByRange(patientId, {
      startDate: formatDate(selectedDateRange.startDate),
      endDate: formatDate(selectedDateRange.endDate),
    });

  // 날짜별 보기 상태: 편집 모드 및 해당 날짜 데이터
  const { data: vitalByDate, isLoading: vitalByDateLoading } =
    useVitalSignByDate(patientId, selectedDate);
  const [isEditingVital, setIsEditingVital] = useState(false);
  const [vitalForm] = Form.useForm<{
    systolic: number | null;
    diastolic: number | null;
    bloodGlucose: number | null;
    temperature: number | null;
  }>();
  useEffect(() => {
    if (vitalByDate && !isEditingVital) {
      vitalForm.setFieldsValue({
        systolic: vitalByDate.systolic,
        diastolic: vitalByDate.diastolic,
        bloodGlucose: vitalByDate.bloodGlucose,
        temperature: vitalByDate.temperature,
      });
    }
  }, [vitalByDate, isEditingVital, vitalForm]);
  const { mutateAsync: updateVital, isPending: updatingVital } =
    useUpdateVitalSign();
  const lastUpdatedText = useMemo(() => {
    if (!vitalByDate?.updatedAt) return "-";
    try {
      return vitalByDate.updatedAt.toLocaleString("ko-KR");
    } catch {
      return "-";
    }
  }, [vitalByDate?.updatedAt]);

  // 날짜별 관찰 일지 (byDate 모드에서 사용)
  const {
    data: observationRecordsByDate,
    isLoading: observationRecordsByDateLoading,
  } = usePatientObservationRecords(patientId, {
    startDate: selectedDate,
    endDate: selectedDate,
    page: 1,
    size: 99999,
  });

  // 에러 상태
  if (patientError) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">데이터 로딩 실패</p>
            <p className="text-red-600 text-sm">
              시니어 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col p-6 gap-4">
        <div className="flex flex-col">
          {patient ? (
            <Title level={3}>{patient.name} 어르신</Title>
          ) : (
            <ConfigProvider
              theme={{
                components: {
                  Skeleton: {
                    titleHeight: 24,
                  },
                },
              }}
            >
              <Skeleton active paragraph={false} title={{ width: "192px" }} />
            </ConfigProvider>
          )}
          <div className="flex flex-row gap-4 items-baseline">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                { key: "recent", label: "최근 내역" },
                {
                  key: "byDate",
                  label: (
                    <div className="flex items-center gap-2">
                      <span>날짜별 보기</span>
                    </div>
                  ),
                },
              ]}
            />
            {activeTab === "byDate" && (
              <DatePicker
                allowClear={false}
                value={dayjs(selectedDate)}
                onChange={(v) => {
                  if (v) setSelectedDate(v.toDate());
                }}
                size="small"
              />
            )}
          </div>
        </div>

        {/* 건강 지표 섹션: 탭에 따라 다르게 렌더 */}
        {activeTab === "recent" ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card>
                <VitalSignCard
                  records={vitalSigns ?? []}
                  dataKey={["systolic", "diastolic"]}
                  title={
                    <div className="flex flex-row gap-2 items-center">
                      <Title level={4}>혈압</Title>
                      <Text className="pb-1" type="secondary">
                        mmHg
                      </Text>
                    </div>
                  }
                  lineColor="#1890ff"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card>
                <VitalSignCard
                  records={vitalSigns ?? []}
                  dataKey={["bloodGlucose"]}
                  title={
                    <div className="flex flex-row gap-2 items-center">
                      <Title level={4}>혈당</Title>
                      <Text className="pb-1" type="secondary">
                        mg/dL
                      </Text>
                    </div>
                  }
                  lineColor="#fa8c16"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card>
                <VitalSignCard
                  records={vitalSigns ?? []}
                  dataKey={["temperature"]}
                  title={
                    <div className="flex flex-row gap-2 items-center">
                      <Title level={4}>체온</Title>
                      <Text className="pb-1" type="secondary">
                        °C
                      </Text>
                    </div>
                  }
                  lineColor="#f5222d"
                />
              </Card>
            </Col>
          </Row>
        ) : (
          <Card>
            <Spin spinning={vitalByDateLoading || updatingVital}>
              <Form form={vitalForm}>
                <Row align="middle" justify="space-between" gutter={[24, 16]}>
                  <Col xs={24} lg={4}>
                    <div className="text-lg font-semibold mb-1">등록일자</div>
                    <div className="text-sm">{lastUpdatedText}</div>
                  </Col>
                  <Col xs={24} sm={12} lg={4} className="text-center">
                    <div className="text-lg font-semibold mb-1">수축기</div>
                    {isEditingVital ? (
                      <div className="flex items-center justify-center gap-1">
                        <Form.Item name="systolic" className="mb-0">
                          <InputNumber
                            size="large"
                            style={{ textAlign: "center" }}
                            placeholder="120"
                            controls={true}
                          />
                        </Form.Item>
                        <span className="text-xs text-gray-400">mmHg</span>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">
                        {vitalByDate?.systolic || " - "}
                        <span className="text-xs font-normal">mmHg</span>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} lg={4} className="text-center">
                    <div className="text-lg font-semibold mb-1">이완기</div>
                    {isEditingVital ? (
                      <div className="flex items-center justify-center gap-1">
                        <Form.Item name="diastolic" className="mb-0">
                          <InputNumber
                            size="large"
                            style={{ textAlign: "center" }}
                            placeholder="80"
                            controls={true}
                          />
                        </Form.Item>
                        <span className="text-xs text-gray-400">mmHg</span>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">
                        {vitalByDate?.diastolic || " - "}
                        <span className="text-xs font-normal">mmHg</span>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} lg={4} className="text-center">
                    <div className="text-lg font-semibold mb-1">혈당</div>
                    {isEditingVital ? (
                      <div className="flex items-center justify-center gap-1">
                        <Form.Item name="bloodGlucose" className="mb-0">
                          <InputNumber
                            size="large"
                            style={{ textAlign: "center" }}
                            placeholder="100"
                            controls={true}
                          />
                        </Form.Item>
                        <span className="text-xs text-gray-400">mg/dL</span>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">
                        {vitalByDate?.bloodGlucose || " - "}
                        <span className="text-xs font-normal">mg/dL</span>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={12} lg={4} className="text-center">
                    <div className="text-lg font-semibold mb-1">체온</div>
                    {isEditingVital ? (
                      <div className="flex items-center justify-center gap-1">
                        <Form.Item name="temperature" className="mb-0">
                          <InputNumber
                            size="large"
                            style={{ textAlign: "center" }}
                            placeholder="36.5"
                            step={0.1}
                            controls={true}
                          />
                        </Form.Item>
                        <span className="text-xs text-gray-400">°C</span>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold">
                        {vitalByDate?.temperature || " - "}
                        <span className="text-xs font-normal">°C</span>
                      </div>
                    )}
                  </Col>
                  <Col xs={24} sm={24} lg={4} className="text-right">
                    {!isEditingVital ? (
                      <TypographyLink
                        onClick={() => setIsEditingVital(true)}
                        disabled={vitalByDateLoading || updatingVital}
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 ml-auto"
                      >
                        <EditOutlined />
                      </TypographyLink>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <TypographyLink
                          onClick={() => {
                            setIsEditingVital(false);
                            vitalForm.resetFields();
                          }}
                          disabled={updatingVital}
                          className="text-gray-500"
                        >
                          취소
                        </TypographyLink>
                        <TypographyLink
                          onClick={async () => {
                            const values = await vitalForm.validateFields();
                            await updateVital({
                              patientId,
                              date: selectedDate,
                              data: values,
                            });
                            setIsEditingVital(false);
                          }}
                          strong
                          disabled={updatingVital}
                        >
                          저장
                        </TypographyLink>
                      </div>
                    )}
                  </Col>
                </Row>
              </Form>
            </Spin>
          </Card>
        )}

        {/* 관찰 일지와 메모 섹션 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Spin
              spinning={
                activeTab === "byDate"
                  ? observationRecordsByDateLoading
                  : observationRecordsLoading
              }
            >
              <Card
                title="관찰 일지"
                extra={
                  <Space size="middle">
                    <TypographyLink
                      onClick={() => setIsAddObservationRecordModalOpen(true)}
                    >
                      추가하기
                    </TypographyLink>
                    <TypographyLink onClick={showObservationRecordModal}>
                      더보기
                    </TypographyLink>
                  </Space>
                }
                className="h-full"
                styles={{
                  body: {
                    height: "21rem",
                    overflowY: "scroll",
                  },
                }}
              >
                <Space direction="vertical" className="w-full" size="middle">
                  {/* 관찰 일지가 비어있을 경우 비어있음을 표시 */}
                  {!(
                    (activeTab === "byDate"
                      ? observationRecordsByDate?.data
                      : observationRecords?.data) || []
                  ).length ? (
                    <Empty description="작성된 관찰 일지가 없어요." />
                  ) : (
                    // 관찰 일지가 존재할 경우 표시
                    (activeTab === "byDate"
                      ? observationRecordsByDate?.data
                      : observationRecords?.data
                    )?.map((record) => (
                      <ObservationRecordCard
                        key={record.id}
                        record={record}
                        onClick={() => handleObservationRecordClick(record)}
                        ellipsis
                      />
                    ))
                  )}
                </Space>
              </Card>
            </Spin>
          </Col>
          <Col xs={24} lg={12}>
            {/* 메모 섹션 */}
            <Card
              title="메모"
              styles={{
                body: {
                  height: "21rem",
                },
              }}
              extra={
                !isEditingMemo ? (
                  <TypographyLink
                    onClick={handleStartEdit}
                    disabled={memoLoading || isSavingMemo}
                  >
                    수정
                  </TypographyLink>
                ) : (
                  <Space size="middle">
                    <TypographyLink
                      onClick={handleCancelEdit}
                      disabled={isSavingMemo}
                    >
                      취소
                    </TypographyLink>
                    <TypographyLink
                      onClick={handleSaveEdit}
                      disabled={isSavingMemo}
                      strong
                    >
                      저장
                    </TypographyLink>
                  </Space>
                )
              }
            >
              <Spin
                spinning={memoLoading || isSavingMemo}
                wrapperClassName="h-full flex flex-col flex-1"
              >
                <TextArea
                  ref={memoTextAreaRef}
                  value={localMemoText}
                  onChange={handleMemoChange}
                  readOnly={!isEditingMemo}
                  disabled={memoLoading}
                  placeholder="메모를 입력하세요..."
                  maxLength={1000}
                  style={{
                    height: "calc(21rem - 3rem)",
                  }}
                />
                <div className="absolute bottom-2 right-2 text-sm text-gray-400">
                  {localMemoText.length}/1000
                </div>
              </Spin>
            </Card>
          </Col>
        </Row>

        {/* 최근 진료/상담 섹션 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Spin spinning={consultationLoading}>
              <Card
                title="최근 진료"
                extra={
                  <TypographyLink onClick={showConsultationHistoryModal}>
                    더보기
                  </TypographyLink>
                }
                styles={{
                  body: {
                    height: "21rem",
                    overflowY: "scroll",
                  },
                }}
              >
                <Space direction="vertical" className="w-full" size="middle">
                  {consultationRecords.length > 0 ? (
                    consultationRecords.map((record) => (
                      <ConsultationRecordCard
                        key={record.id}
                        record={record}
                        ellipsis
                        onClick={() =>
                          record.content !== null &&
                          showConsultationDetailModal(record)
                        }
                      />
                    ))
                  ) : (
                    <Empty description="진료 내역이 없습니다." />
                  )}
                </Space>
              </Card>
            </Spin>
          </Col>
          <Col xs={24} lg={12}>
            <Spin spinning={employeeConsultationLoading}>
              <Card
                title="최근 상담"
                extra={
                  <TypographyLink
                    onClick={showEmployeeConsultationHistoryModal}
                  >
                    더보기
                  </TypographyLink>
                }
                styles={{
                  body: {
                    height: "21rem",
                    overflowY: "scroll",
                  },
                }}
              >
                <Space direction="vertical" className="w-full" size="middle">
                  {employeeConsultationRecords.length > 0 ? (
                    employeeConsultationRecords.map((record) => (
                      <ConsultationRecordCard
                        key={record.id}
                        record={record}
                        ellipsis
                        onClick={() =>
                          record.content !== null &&
                          showConsultationDetailModal(record)
                        }
                      />
                    ))
                  ) : (
                    <Empty description="상담 내역이 없습니다." />
                  )}
                </Space>
              </Card>
            </Spin>
          </Col>
        </Row>

        {/* 복약 내역 섹션 */}
        <Card
          title="복약 내역"
          extra={
            <TypographyLink onClick={showAddPrescriptionModal}>
              추가하기
            </TypographyLink>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Spin spinning={medicationsLoading && !medications}>
              {!!medications && Object.keys(medications!).length > 0 ? (
                <div className="flex flex-col gap-4">
                  {Object.entries(medications!).map(([scheduleId, items]) => (
                    <MedicationItemCard
                      key={items.medications[0]?.id}
                      scheduleId={Number(scheduleId)}
                      items={items.medications}
                      patientId={patientId}
                      date={selectedMedicationDate}
                    />
                  ))}
                </div>
              ) : (
                !medicationsLoading && (
                  <Empty description="오늘 복약 내역이 없어요." />
                )
              )}
            </Spin>
          </Space>
        </Card>

        {/* 문서보관함 섹션 */}
        <Card
          title="문서보관함"
          extra={
            <div className="flex flex-row gap-4">
              <TypographyLink onClick={showAddDocumentModal}>
                추가하기
              </TypographyLink>
              <TypographyLink
                onClick={() => setIsDocumentHistoryModalOpen(true)}
              >
                더보기
              </TypographyLink>
            </div>
          }
        >
          <Spin spinning={documentsLoading}>
            <Row gutter={[16, 16]}>
              {documents?.data?.length
                ? documents.data.map((item) => (
                    <Col xs={24} sm={12} md={8} key={item.documentId}>
                      <DocumentItemCard document={item} />
                    </Col>
                  ))
                : !documentsLoading && (
                    <div className="flex justify-center items-center w-full">
                      <Empty description="문서가 없어요." />
                    </div>
                  )}
            </Row>
          </Spin>
        </Card>
      </div>
      {/* 관찰 일지 더보기 모달 */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          title="관찰 일지"
          open={isObservationRecordHistoryModalOpen}
          onCancel={() => setIsObservationRecordHistoryModalOpen(false)}
          onOk={() => setIsObservationRecordHistoryModalOpen(false)}
          destroyOnHidden
          footer={null}
        >
          <ObservationRecordHistory patientId={patientId} />
        </Modal>
      </ConfigProvider>
      {/* 관찰 일지 작성 모달 - ObservationRecordDetail 재사용 */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          title="관찰 일지 작성"
          open={isAddObservationRecordModalOpen}
          onCancel={() => setIsAddObservationRecordModalOpen(false)}
          onOk={() => setIsAddObservationRecordModalOpen(false)}
          destroyOnHidden
          footer={null}
        >
          <ObservationRecordDetail
            patientId={patientId}
            mode="new"
            onClose={() => setIsAddObservationRecordModalOpen(false)}
          />
        </Modal>
      </ConfigProvider>

      {/* 관찰 일지 상세보기 모달 */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          title="관찰 일지"
          open={isObservationRecordDetailModalOpen}
          onCancel={() => setIsObservationRecordDetailModalOpen(false)}
          onOk={() => setIsObservationRecordDetailModalOpen(false)}
          destroyOnHidden
          footer={null}
        >
          <ObservationRecordDetail
            patientId={patientId}
            record={selectedObservationRecord}
            onClose={() => setIsObservationRecordDetailModalOpen(false)}
          />
        </Modal>
      </ConfigProvider>
      {/* 복약 내역 추가 모달 */}
      <AddPrescriptionModal
        open={isAddPrescriptionModalOpen}
        onClose={() => setIsAddPrescriptionModalOpen(false)}
        patientId={patientId}
      />
      {/* 문서 추가 모달 */}
      <AddDocumentModal
        open={isAddDocumentModalOpen}
        onClose={() => setIsAddDocumentModalOpen(false)}
        seniorId={patientId}
      />

      {/* 문서 더보기 모달 */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          title="문서보관함"
          open={isDocumentHistoryModalOpen}
          onCancel={() => setIsDocumentHistoryModalOpen(false)}
          onOk={() => setIsDocumentHistoryModalOpen(false)}
          destroyOnHidden
          footer={null}
          width={960}
        >
          <DocumentHistory patientId={patientId} />
        </Modal>
      </ConfigProvider>

      {/* 진료 내용 요약 모달 */}
      <ConsultationDetailModal
        consultation={selectedConsultation || null}
        open={isConsultationDetailModalOpen}
        onCancel={() => setIsConsultationDetailModalOpen(false)}
      />

      {/* 진료 내역 히스토리 모달 */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          title="진료 내역"
          open={isConsultationHistoryModalOpen}
          onCancel={() => setIsConsultationHistoryModalOpen(false)}
          onOk={() => setIsConsultationHistoryModalOpen(false)}
          destroyOnHidden
          footer={null}
        >
          <ConsultationRecordHistory
            patientId={patientId}
            meetingType="withDoctor"
            onCancel={() => setIsConsultationHistoryModalOpen(false)}
          />
        </Modal>
      </ConfigProvider>
      {/* 상담 내역 히스토리 모달 */}
      <ConfigProvider theme={{ token: { motion: false } }}>
        <Modal
          title="상담 내역"
          open={isEmployeeConsultationHistoryModalOpen}
          onCancel={() => setIsEmployeeConsultationHistoryModalOpen(false)}
          onOk={() => setIsEmployeeConsultationHistoryModalOpen(false)}
          destroyOnHidden
          footer={null}
        >
          <ConsultationRecordHistory
            patientId={patientId}
            meetingType="withEmployee"
            onCancel={() => setIsEmployeeConsultationHistoryModalOpen(false)}
          />
        </Modal>
      </ConfigProvider>
    </AppLayout>
  );
}
