import { BulbOutlined, PictureOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  ConfigProvider,
  message,
  Modal,
  Spin,
  Typography,
  Upload,
} from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { useEffect, useRef, useState } from "react";
import { useUploadDocument } from "~/features/document/application/hooks/useDocuments";
import ImageMasker, {
  type ImageMaskerRef,
  type Mask,
  type PredefinedMask,
} from "~/presentation/components/atoms/ImageMasker";
import { httpClient } from "~/shared/infrastructure/api/httpClient";

const { Text } = Typography;

interface AddDocumentModalProps {
  open: boolean;
  onClose: () => void;
  seniorId: number;
}

export default function AddDocumentModal({
  open,
  onClose,
  seniorId,
}: AddDocumentModalProps) {
  return (
    <ConfigProvider theme={{ token: { motion: false } }}>
      <Modal
        open={open}
        onCancel={onClose}
        title="문서 추가"
        destroyOnHidden
        footer={null}
        width={800}
        className="overflow-auto"
        styles={{
          body: {
            maxHeight: "70vh",
            overflowY: "auto",
          },
        }}
      >
        <AddDocumentContent seniorId={seniorId} onClose={onClose} />
      </Modal>
    </ConfigProvider>
  );
}

function AddDocumentContent({
  seniorId,
  onClose,
}: {
  seniorId: number;
  onClose: () => void;
}) {
  const { mutateAsync: uploadDocument } = useUploadDocument(seniorId);
  // detect가 끝나야 마스킹 단계로 넘어갈 수 있음.
  // detectionResult가 null이 아닐 경우 detect가 끝난 것으로 간주
  const [detectionInfo, setDetectionInfo] = useState<{
    file: File;
    result: DetectionResultDto;
  } | null>(null);
  const onDetectDone = ({
    file,
    result,
  }: {
    file: File;
    result: DetectionResultDto;
  }) => {
    setDetectionInfo({ file, result });
  };

  const onSave = async (file: File) => {
    await uploadDocument(file);
    onClose();
  };

  return (
    <>
      {detectionInfo ? (
        <MaskDocumentModalContent
          onClose={onClose}
          onSave={onSave}
          file={detectionInfo.file}
          result={detectionInfo.result}
        />
      ) : (
        <SelectDocumentContent onClose={onClose} onDetectDone={onDetectDone} />
      )}
    </>
  );
}

function SelectDocumentContent({
  onClose,
  onDetectDone,
}: {
  onClose: () => void;
  onDetectDone: ({
    file,
    result,
  }: {
    file: File;
    result: DetectionResultDto;
  }) => void;
}) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [detectionResult, setDetectionResult] =
    useState<DetectionResultDto | null>(null);

  // 파일 형식 검증 함수
  const validateFileType = (file: File): boolean => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    return allowedTypes.includes(file.type);
  };

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

      setUploading(true);

      const response = await httpClient.postForm<DetectionResultDto>(
        "/api/v1/ai/document/detectEntitiesFromImage",
        {
          file: file,
        },
        { timeout: 30000 }
      );

      setUploading(false);
      onDetectDone({ file, result: response.data });

      return false; // 자동 업로드 방지?
    },
    onRemove: () => {
      setFileList([]);
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  return (
    <Spin
      size="large"
      spinning={uploading}
      tip="민감한 정보를 식별하고 있어요..."
    >
      <div className="p-6">
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
        {fileList.length > 0 && (
          <div className="mt-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <PictureOutlined className="text-blue-500 mr-2" />
                  <span className="text-sm text-blue-700">
                    {fileList[0].name}
                  </span>
                </div>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setFileList([])}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-3 mt-6 pt-4">
          <Button onClick={onClose}>취소</Button>
          <Button
            type="primary"
            disabled={fileList.length === 0}
            onClick={() => {
              message.success("문서가 성공적으로 추가되었습니다.");
              onClose();
            }}
          >
            추가 완료
          </Button>
        </div>
      </div>
    </Spin>
  );
}

function MaskDocumentModalContent({
  onClose,
  onSave,
  file,
  result,
}: {
  onClose: () => void;
  onSave: (maskedImage: File) => Promise<void>;
  file: File;
  result: DetectionResultDto;
}) {
  const fileUrl = URL.createObjectURL(file);

  const [isSaving, setIsSaving] = useState(false);

  const imageMaskerRef = useRef<ImageMaskerRef>(null);

  const handleSave = async () => {
    setIsSaving(true);

    //maskedImage는 base64 포맷임.
    const maskedImage = await imageMaskerRef.current?.getMaskedImage();
    if (!maskedImage) {
      throw new Error("maskedImage is null");
    }
    const convertedFile = base64ToFile(maskedImage, file.name);
    await onSave(convertedFile);

    setIsSaving(false);
  };

  // 컴포넌트가 언마운트될 때 URL 해제
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const [predefinedMasks, setPredefinedMasks] = useState<PredefinedMask[]>(
    result.word_boxes.map((wordBox, index) => ({
      id: index,
      x: wordBox.bounding_box.x1,
      y: wordBox.bounding_box.y1,
      width: wordBox.bounding_box.x2 - wordBox.bounding_box.x1,
      height: wordBox.bounding_box.y2 - wordBox.bounding_box.y1,
      active: true,
    }))
  );

  const [customMasks, setCustomMasks] = useState<Mask[]>([]);

  const maskerInfo = {
    predefinedMasks,
    onPredefinedMasksChange: setPredefinedMasks,
    customMasks,
    onCustomMasksChange: setCustomMasks,
  };

  return (
    <Spin size="large" spinning={isSaving} tip="문서를 저장하고 있어요.">
      <div className="flex flex-col gap-4">
        <Alert
          type="info"
          message={
            <div className="flex flex-row gap-2 p-2">
              <BulbOutlined />
              <Text>
                개인정보를 드래그하여 가려주세요. 문서를 저장할 때 가린 부분은
                제외됩니다.
              </Text>
            </div>
          }
        />
        <ImageMasker ref={imageMaskerRef} src={fileUrl} {...maskerInfo} />
        <Button type="primary" onClick={handleSave} loading={isSaving}>
          저장
        </Button>
      </div>
    </Spin>
  );
}

interface DetectionResultDto {
  word_boxes: {
    text: string;
    bounding_box: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    };
    detected_entity: {
      word: string;
      entity: string;
      entity_type: string;
      entity_type_ko: string;
      score: number;
    };
  }[];
}

/**
 * Base64 문자열을 File 객체로 변환
 * @param base64Data "data:<mime>;base64,<data>" 형식 또는 순수 base64 문자열
 * @param filename 파일명 (예: "image.png")
 * @returns File
 */
function base64ToFile(base64Data: string, filename: string): File {
  // data:[<mediatype>][;base64],<data> 형태 분리
  const parts = base64Data.split(",");
  let mime = "";
  let b64 = "";

  if (parts.length === 2 && parts[0].includes("base64")) {
    mime = parts[0].match(/data:(.*);base64/)?.[1] || "";
    b64 = parts[1];
  } else {
    // 순수 base64만 넘어온 경우 기본 MIME 설정 (png)
    mime = "application/octet-stream";
    b64 = base64Data;
  }

  // Base64 디코딩
  const byteChars = atob(b64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  // Blob → File
  return new File([byteArray], filename, { type: mime });
}
