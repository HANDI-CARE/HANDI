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
import type { DrugInfo } from "~/features/drug/application/domain/DrugInfo";
import type { DrugSummary } from "~/features/drug/application/domain/DrugSummary";
import { useDetectDrugByImage } from "~/features/drug/application/hooks/useDrug";
import type { DrugDetectResponseDto } from "~/features/drug/infrastructure/dto/DrugDto";
import type { ImageCropperRef } from "~/presentation/components/atoms/ImageCropper";
import ImageCropper from "~/presentation/components/atoms/ImageCropper";
import { base64ToFile } from "~/shared/utils/fileUtils";

const { Text } = Typography;

interface DetectPrescriptionModalProps {
  open: boolean;
  onClose: () => void;
  onDetectDone: (result: {
    drug_candidates: DrugInfo[];
    drug_summary: DrugSummary[];
  }) => void;
}

export default function DetectPrescriptionModal({
  open,
  onClose,
  onDetectDone,
}: DetectPrescriptionModalProps) {
  return (
    <ConfigProvider theme={{ token: { motion: false } }}>
      <Modal
        open={open}
        onCancel={onClose}
        title="약물 자동 추가"
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
        <DetectPrescriptionContent
          onClose={onClose}
          onDetectDone={onDetectDone}
        />
      </Modal>
    </ConfigProvider>
  );
}

function DetectPrescriptionContent({
  onClose,
  onDetectDone,
}: {
  onClose: () => void;
  onDetectDone: (result: {
    drug_candidates: DrugInfo[];
    drug_summary: DrugSummary[];
  }) => void;
}) {
  // 파일 선택이 끝나야 크롭 단계로 넘어갈 수 있음
  // selectionInfo가 null이 아닐 경우 파일 선택이 끝난 것으로 간주
  const [selectionInfo, setSelectionInfo] = useState<{
    file: File;
  } | null>(null);

  const onSelectDone = ({ file }: { file: File }) => {
    setSelectionInfo({ file });
  };

  const { mutateAsync: detectAsync } = useDetectDrugByImage();

  // 이미지 크롭까지 끝나서 약물 정보를 인식하고 반환하는 단계
  const onDetect = async (file: File) => {
    const res = await detectAsync(file);
    onDetectDone({
      drug_candidates: res.drugCandidates,
      drug_summary: res.drugSummary,
    });
    onClose();
  };

  return (
    <>
      {selectionInfo ? (
        <CropImageModalContent
          onClose={onClose}
          onSave={onDetect}
          file={selectionInfo.file}
        />
      ) : (
        <SelectImageContent onClose={onClose} onSelectDone={onSelectDone} />
      )}
    </>
  );
}

function SelectImageContent({
  onClose,
  onSelectDone,
}: {
  onClose: () => void;
  onSelectDone: ({ file }: { file: File }) => void;
}) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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
      onSelectDone({ file });
    },
    onRemove: () => {
      setFileList([]);
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  return (
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
            // TODO: 문서 추가 완료 로직 구현
            message.success("문서가 성공적으로 추가되었습니다.");
            onClose();
          }}
        >
          추가 완료
        </Button>
      </div>
    </div>
  );
}

function CropImageModalContent({
  onClose,
  onSave,
  file,
}: {
  onClose: () => void;
  onSave: (croppedImage: File) => Promise<void>;
  file: File;
}) {
  const fileUrl = URL.createObjectURL(file);

  const [isSaving, setIsSaving] = useState(false);

  const imageCropperRef = useRef<ImageCropperRef>(null);

  const handleSave = async () => {
    setIsSaving(true);

    //croppedImage는 base64 포맷임.
    const croppedImage = await imageCropperRef.current?.getCroppedImage();
    if (!croppedImage) {
      throw new Error("croppedImage is null");
    }
    const convertedFile = base64ToFile(croppedImage, file.name);
    await onSave(convertedFile);

    setIsSaving(false);
  };

  // 컴포넌트가 언마운트될 때 URL 해제
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  return (
    <Spin size="large" spinning={isSaving} tip="약물 정보를 인식하고 있어요.">
      <div className="flex flex-col gap-4">
        <Alert
          type="info"
          message={
            <div className="flex flex-row gap-2 p-2">
              <BulbOutlined />
              <Text>
                처방된 약 정보 부분을 드래그해서 선택하면, 인식률을 높일 수
                있어요.
              </Text>
            </div>
          }
        />
        <ImageCropper ref={imageCropperRef} src={fileUrl} />
        <Button type="primary" onClick={handleSave} loading={isSaving}>
          확인
        </Button>
      </div>
    </Spin>
  );
}

/**
 * Base64 문자열을 File 객체로 변환
 * @param base64Data "data:<mime>;base64,<data>" 형식 또는 순수 base64 문자열
 * @param filename 파일명 (예: "image.png")
 * @returns File
 */
function base64ToFile_legacy(base64Data: string, filename: string): File {
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
const mockDrugList = {
  drug_candidates: [
    {
      productName: "씨프로바이정",
      extraInfo: "시프로플록사신염산염수화물",
      dosage: "250밀리그램",
      manufacturer: "바이엘코리아(주)",
      appearance: "백색~미황색의원형필름코팅정",
      dosageForm: "원형",
      description: null,
      image:
        "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/147759729217900112",
      category: "기타의화학요법제",
      formCodeName: "필름코팅정",
      thicknessMm: "4",
      similarity_score: 1,
    },
    {
      productName: "화록소정",
      extraInfo: "록소프로펜나트륨수화물",
      dosage: "",
      manufacturer: "화일약품(주)",
      appearance: "흰색∼미황색의원형정제",
      dosageForm: "원형",
      description: null,
      image:
        "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/147427070775200143",
      category: "해열.진통.소염제",
      formCodeName: "나정",
      thicknessMm: "3.5",
      similarity_score: 1,
    },
    {
      productName: "라니드정",
      extraInfo: "라니티딘염산염",
      dosage: "",
      manufacturer: "한국코러스(주)",
      appearance: "분홍색의오각형필름코팅정제",
      dosageForm: "오각형",
      description: null,
      image: "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEylL",
      category: "소화성궤양용제",
      formCodeName: "필름코팅정",
      thicknessMm: "3.3",
      similarity_score: 1,
    },
    {
      productName: "부스코판당의정",
      extraInfo: "부틸스코폴라민브롬화물",
      dosage: "",
      manufacturer: "오펠라헬스케어코리아(주)",
      appearance: "흰색의원형당의정",
      dosageForm: "원형",
      description: null,
      image: "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1O597tTUEd7",
      category: "진경제",
      formCodeName: "당의정",
      thicknessMm: "3.5",
      similarity_score: 1,
    },
    {
      productName: "화록소정",
      extraInfo: "록소프로펜나트륨수화물",
      dosage: "",
      manufacturer: "화일약품(주)",
      appearance: "흰색∼미황색의원형정제",
      dosageForm: "원형",
      description: null,
      image:
        "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/147427070775200143",
      category: "해열.진통.소염제",
      formCodeName: "나정",
      thicknessMm: "3.5",
      similarity_score: 1,
    },
    {
      productName: "라니드정",
      extraInfo: "라니티딘염산염",
      dosage: "",
      manufacturer: "한국코러스(주)",
      appearance: "분홍색의오각형필름코팅정제",
      dosageForm: "오각형",
      description: null,
      image: "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEylL",
      category: "소화성궤양용제",
      formCodeName: "필름코팅정",
      thicknessMm: "3.3",
      similarity_score: 1,
    },
    {
      productName: "부스코판당의정",
      extraInfo: "부틸스코폴라민브롬화물",
      dosage: "",
      manufacturer: "오펠라헬스케어코리아(주)",
      appearance: "흰색의원형당의정",
      dosageForm: "원형",
      description: null,
      image: "https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1O597tTUEd7",
      category: "진경제",
      formCodeName: "당의정",
      thicknessMm: "3.5",
      similarity_score: 1,
    },
  ],
  drug_summary: [
    {
      name: "씨프로바이정",
      capacity: "250밀리그램",
    },
    {
      name: "화록소정",
      capacity: "",
    },
    {
      name: "라니드정",
      capacity: "",
    },
    {
      name: "부스코판당의정",
      capacity: "",
    },
    {
      name: "화록소정",
      capacity: "",
    },
    {
      name: "라니드정",
      capacity: "",
    },
    {
      name: "부스코판당의정",
      capacity: "",
    },
  ],
} satisfies DrugDetectResponseDto;
