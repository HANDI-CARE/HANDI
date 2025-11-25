import { PictureOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  ConfigProvider,
  DatePicker,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Spin,
  Typography,
  Upload,
  type UploadFile,
  type UploadProps,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useMedicationSchedule } from "~/features/patient/application/hooks/usePatients";
import { httpClient } from "~/shared/infrastructure/api/httpClient";
import DrugInfoItem from "./DrugInfoItem";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface AddMedicationPhotoModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * 이미지 추가 완료 후 기존 페이지에서 데이터 재로딩 등을 하기 위해 사용하는 콜백
   */
  onSaved: () => void;
  patientId: number;
  medicationId: number;
  scheduleId: number;
}

export default function AddMedicationPhotoModal({
  open,
  onClose,
  onSaved,
  patientId,
  medicationId,
  scheduleId,
}: AddMedicationPhotoModalProps) {
  const handleCancel = () => {
    onClose();
  };

  return (
    <ConfigProvider theme={{ token: { motion: false } }}>
      <Modal
        open={open}
        onCancel={handleCancel}
        title="복용 사진 등록"
        destroyOnHidden
        footer={null}
        width={1200}
        className="overflow-auto"
        styles={{
          body: {
            maxHeight: "70vh",
            overflowY: "auto",
          },
        }}
      >
        <AddMedicationPhotoModalContent
          onClose={onClose}
          onSaved={onSaved}
          patientId={patientId}
          medicationId={medicationId}
          scheduleId={scheduleId}
        />
      </Modal>
    </ConfigProvider>
  );
}

function AddMedicationPhotoModalContent({
  onClose,
  onSaved,
  patientId,
  medicationId,
  scheduleId,
}: {
  onClose: () => void;
  onSaved: () => void;
  patientId: number;
  medicationId: number;
  scheduleId: number;
}) {
  const [form] = Form.useForm();

  // 약물 정보를 모두 추가한 후 저장 중 상태
  const [isSaving, setIsSaving] = useState(false);

  // 스케줄 상세 조회 (부모에서 scheduleId를 직접 전달)
  const { data: medicationSchedule, isLoading: isLoadingSchedule } =
    useMedicationSchedule(scheduleId);

  // 이미지가 있으면 기본적으로 약물 정보 리스트는 숨김
  const [showDrugInfo, setShowDrugInfo] = useState(true);

  const qc = useQueryClient();

  const handleSave = async () => {
    if (!fileList?.length || !fileList[0]?.originFileObj) {
      message.error("이미지 파일을 선택해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const file = fileList[0].originFileObj as File;
      await httpClient.putForm(`/api/v1/medications/${medicationId}`, {
        multipartFile: file,
        seniorId: patientId,
      });
      qc.invalidateQueries({
        queryKey: ["todayMedicationSchedules"],
        exact: false,
      });
      qc.invalidateQueries({
        queryKey: ["todayMedicationSchedulesNew"],
        exact: false,
      });
      qc.invalidateQueries({
        queryKey: ["medications"],
        exact: false,
      });
      message.success("복용 사진이 저장되었어요.");
      onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      message.error("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  // 파일 형식 검증 함수
  const validateFileType = (file: File): boolean => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    return allowedTypes.includes(file.type);
  };

  // 파일 선택 영역 관련
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    fileList,
    accept: ".png,.jpg,.jpeg,.webp",
    showUploadList: false,
    beforeUpload: async (file) => {
      if (!validateFileType(file)) {
        console.error("지원되지 않는 파일 형식입니다");
        return false;
      }
      setFileList([file]);
    },
    onRemove: () => {
      setFileList([]);
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  const fileUrl = useMemo(() => {
    if (!fileList?.length || !fileList[0]?.originFileObj) {
      return null;
    }
    return URL.createObjectURL(fileList[0]?.originFileObj);
  }, [fileList]);

  // 이미지 존재 여부에 따라 리스트 표시 상태 초기화/동기화
  useEffect(() => {
    if (fileUrl) {
      setShowDrugInfo(false);
    }
  }, [fileUrl]);

  return (
    <Spin size="large" spinning={isSaving} tip="복용 사진을 저장 중이에요.">
      <div className="px-2">
        <Form
          form={form}
          layout="vertical"
          className="space-y-4 flex flex-col gap-4"
        >
          {/* 약물 정보 (스케줄 기반 DrugInfo 리스트) */}
          {isLoadingSchedule ? (
            <Spin size="small" />
          ) : (
            medicationSchedule?.description?.drug_candidates &&
            medicationSchedule.description.drug_candidates.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Text strong>약물 정보</Text>
                  <Button
                    size="small"
                    onClick={() => setShowDrugInfo((v) => !v)}
                  >
                    {showDrugInfo ? "약물 정보 숨기기" : "약물 정보 펼치기"}
                  </Button>
                </div>
                {showDrugInfo && (
                  <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                    {medicationSchedule.description.drug_candidates.map(
                      (drugInfo, index) => (
                        <>
                          <DrugInfoItem
                            key={`${drugInfo.productName}-${index}`}
                            drugInfo={drugInfo}
                            showInfo="important"
                          />
                          {index !==
                            medicationSchedule.description.drug_candidates
                              .length -
                              1 && <Divider />}
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {fileList.length === 0 ? (
            <Upload.Dragger {...uploadProps} className="w-full">
              <div className="flex flex-col items-center justify-center py-8">
                <PictureOutlined className="text-4xl text-blue-500 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  사진 파일을 선택하거나 여기에 끌어다 놓으세요.
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, WebP 형식의 파일만 지원됩니다.
                </p>
              </div>
            </Upload.Dragger>
          ) : (
            <img src={fileUrl!} alt="uploaded" />
          )}

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={onClose} className="px-8">
              취소
            </Button>
            <Button type="primary" onClick={handleSave} className="px-8">
              저장
            </Button>
          </div>
        </Form>
      </div>
    </Spin>
  );
}
