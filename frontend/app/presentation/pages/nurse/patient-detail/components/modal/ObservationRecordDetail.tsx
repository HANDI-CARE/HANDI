import { blue, orange, red } from "@ant-design/colors";
import {
  CalendarOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Input, Radio, Spin, Typography } from "antd";
import { useRef, useState } from "react";
import {
  useAddPatientObservationRecord,
  useUpdatePatientObservationRecord,
} from "~/features/patient/application/hooks/usePatients";
import type {
  ObservationRecord,
  ObservationRecordLevel,
} from "~/features/patient/domain/ObservationRecord";

const { Text } = Typography;
const { TextArea } = Input;

type Mode = "new" | "viewEdit";

type RecordPreset = {
  [key in ObservationRecordLevel]: {
    text: string;
    color: string;
    icon: React.ReactNode;
  };
};

const recordPreset: RecordPreset = {
  LOW: {
    text: "보통",
    color: blue[5],
    icon: <FileTextOutlined />,
  },
  MEDIUM: {
    text: "경고",
    color: orange[5],
    icon: <WarningOutlined />,
  },
  HIGH: {
    text: "위험",
    color: red[5],
    icon: <ExclamationCircleOutlined />,
  },
};

interface ObservationRecordDetailProps {
  patientId: number;
  /**
   * `mode`가 `new`일 때는 필수 값이 아니다.
   */
  record?: ObservationRecord;
  mode?: Mode;
  onClose?: () => void;
}

/**
 * mode가 new가 아닐 때는 반드시 initialRecord를 넘겨주어야 함
 */
export default function ObservationRecordDetail({
  patientId,
  record: initialRecord,
  mode: initialMode = "viewEdit",
  onClose,
}: ObservationRecordDetailProps) {
  const [mode, setMode] = useState(initialMode);
  const [isEditing, setIsEditing] = useState(mode === "new");
  const originalRecordRef = useRef<ObservationRecord>(undefined);
  // 추가 모드일 경우 더미 데이터 설정.
  const [record, setRecord] = useState<ObservationRecord>(
    initialRecord ?? {
      id: -1,
      senior: {
        id: -1,
        name: "",
        gender: "",
        note: "",
        age: -1,
      },
      content: "",
      level: "LOW",
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      nurse: {
        id: -1,
        name: "",
        email: "",
        phoneNumber: "",
      },
      guardian: {
        id: -1,
        name: "",
        email: "",
        phoneNumber: "",
      },
    }
  );

  const { mutateAsync: addRecord, isPending: isAdding } =
    useAddPatientObservationRecord();
  const { mutateAsync: updateRecord, isPending: isUpdating } =
    useUpdatePatientObservationRecord();

  const handleEdit = () => {
    setIsEditing(true);
    originalRecordRef.current = record;
  };

  const handleCancel = () => {
    // 관찰 일지 추가 모드일 경우 취소 버튼을 누르면 모달을 닫음
    if (mode === "new") {
      onClose?.();
      return;
    }

    setIsEditing(false);
    if (!originalRecordRef.current) {
      throw new Error("originalRecordRef.current is undefined");
    }
    setRecord(originalRecordRef.current);
    originalRecordRef.current = undefined;
  };

  const handleSave = async () => {
    if (mode === "new") {
      const created = await addRecord({
        patientId,
        data: record,
      });
      if (created) {
        setRecord(created);
      }
    } else {
      await updateRecord({
        recordId: record.id,
        data: record,
      });
    }

    originalRecordRef.current = record;

    setIsEditing(false);
    // 관찰 일지 추가 모드였어도 저장이 끝난 후에는
    // 수정 모드인 것처럼 보기와 수정 모드 사이를 오갈 수 있어야 함
    setMode("viewEdit");
  };

  const handleTypeSelect = (selectedType: ObservationRecordLevel) => {
    if (isEditing) {
      setRecord({
        ...record,
        level: selectedType,
      });
    }
  };

  console.log("rec", record);

  return (
    <Spin spinning={isAdding || isUpdating}>
      <div className="flex flex-col gap-4">
        {/* 마지막 저장 날짜 정보 */}
        {!isEditing && !!record && (
          <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg">
            <CalendarOutlined className="text-gray-500" />
            <Text
              className="flex flex-1"
              strong
            >{`마지막 저장: ${record.createdAt.toLocaleString()}`}</Text>
            <div
              className={`px-2.5 py-0.5 rounded-md`}
              style={{
                backgroundColor:
                  recordPreset[record.level as ObservationRecordLevel].color,
              }}
            >
              <Text>
                <span className="text-white">
                  {recordPreset[record.level as ObservationRecordLevel].text}
                </span>
              </Text>
            </div>
          </div>
        )}
        {/* 특이 사항 입력 */}
        <div className="flex flex-col gap-2">
          <Text strong className="text-base">
            특이 사항
          </Text>
          {!isEditing && !!record ? (
            <Text>{record.content}</Text>
          ) : (
            <TextArea
              value={record?.content ?? ""}
              onChange={(e) =>
                setRecord((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              placeholder="보호자나 간호사가 알아야 할 특이 사항을 입력해주세요."
              rows={6}
              disabled={!isEditing}
              className="resize-none"
            />
          )}
        </div>
        {/* 기록 유형 선택 */}
        {isEditing && (
          <div className="flex flex-row gap-2">
            <Radio.Group
              value={record.level}
              onChange={(e) => handleTypeSelect(e.target.value)}
              disabled={!isEditing}
              className="flex flex-row gap-2"
            >
              {(["LOW", "MEDIUM", "HIGH"] as const).map((type) => (
                <Radio.Button key={type} value={type}>
                  <div className="flex flex-row gap-2 items-center">
                    <span
                      style={{
                        color:
                          recordPreset[type as ObservationRecordLevel].color,
                      }}
                    >
                      {recordPreset[type as ObservationRecordLevel].icon}
                    </span>
                    <Text>
                      {recordPreset[type as ObservationRecordLevel].text}
                    </Text>
                  </div>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        )}
        {/* Footer 버튼 */}
        <div className="flex justify-end space-x-2 pt-4">
          {isEditing ? (
            <>
              <Button onClick={handleCancel}>취소</Button>
              <Button type="primary" onClick={handleSave}>
                저장
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onClose}>닫기</Button>
              <Button type="primary" onClick={handleEdit}>
                수정
              </Button>
            </>
          )}
        </div>
      </div>
    </Spin>
  );
}
