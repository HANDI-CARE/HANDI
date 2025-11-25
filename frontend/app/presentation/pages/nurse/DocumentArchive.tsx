import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  notification,
  Pagination,
  Row,
  Space,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { useState } from "react";
import { useUserStore } from "~/presentation/stores/userStore";
import { AppLayout } from "../../components/templates/AppLayout";

// dayjs 플러그인 확장
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { TextArea } = Input;

// 목업 문서 데이터
const mockDocuments = [
  {
    id: "1",
    documentName: "진료확인서",
    uploadedAt: "2025-08-11 12:00",
    imageUrl: "/images/mockup01.png", // 산 모양 이미지 플레이스홀더
    patientName: "김영희",
    patientId: "P001",
    documentType: "진료확인서",
    fileSize: "2.5MB",
    uploadedBy: "박간호사",
    content:
      "환자 김영희의 진료 확인서입니다. 혈압약 복용 중이며 정기적으로 체크가 필요합니다.",
  },
  {
    id: "2",
    documentName: "진료확인서",
    uploadedAt: "2025-08-10 15:30",
    imageUrl: "/images/mockup01.png",
    patientName: "박철수",
    patientId: "P002",
    documentType: "진료확인서",
    fileSize: "1.8MB",
    uploadedBy: "이의사",
    content:
      "환자 박철수의 진료 확인서입니다. 당뇨 관리가 필요하며 식이 조절이 중요합니다.",
  },
  {
    id: "3",
    documentName: "진료확인서",
    uploadedAt: "2025-08-09 09:15",
    imageUrl: "/images/mockup01.png",
    patientName: "이순자",
    patientId: "P003",
    documentType: "진료확인서",
    fileSize: "3.2MB",
    uploadedBy: "김간호사",
    content: "환자 이순자의 진료 확인서입니다. 심장질환 관리가 필요합니다.",
  },
  {
    id: "4",
    documentName: "진료확인서",
    uploadedAt: "2025-08-08 14:20",
    imageUrl: "/images/mockup01.png",
    patientName: "최민수",
    patientId: "P004",
    documentType: "진료확인서",
    fileSize: "2.1MB",
    uploadedBy: "박의사",
    content: "환자 최민수의 진료 확인서입니다. 항생제 복용 중입니다.",
  },
  {
    id: "5",
    documentName: "진료확인서",
    uploadedAt: "2025-08-07 11:45",
    imageUrl: "/images/mockup01.png",
    patientName: "김영희",
    patientId: "P001",
    documentType: "진료확인서",
    fileSize: "2.8MB",
    uploadedBy: "이간호사",
    content: "환자 김영희의 이전 진료 확인서입니다.",
  },
  {
    id: "6",
    documentName: "진료확인서",
    uploadedAt: "2025-08-06 16:30",
    imageUrl: "/images/mockup01.png",
    patientName: "박철수",
    patientId: "P002",
    documentType: "진료확인서",
    fileSize: "1.9MB",
    uploadedBy: "김의사",
    content: "환자 박철수의 이전 진료 확인서입니다.",
  },
  {
    id: "7",
    documentName: "진료확인서",
    uploadedAt: "2025-08-05 10:00",
    imageUrl: "/images/mockup01.png",
    patientName: "이순자",
    patientId: "P003",
    documentType: "진료확인서",
    fileSize: "2.3MB",
    uploadedBy: "박간호사",
    content: "환자 이순자의 이전 진료 확인서입니다.",
  },
  {
    id: "8",
    documentName: "진료확인서",
    uploadedAt: "2025-08-04 13:25",
    imageUrl: "/images/mockup01.png",
    patientName: "최민수",
    patientId: "P004",
    documentType: "진료확인서",
    fileSize: "2.0MB",
    uploadedBy: "이의사",
    content: "환자 최민수의 이전 진료 확인서입니다.",
  },
  {
    id: "9",
    documentName: "진료확인서",
    uploadedAt: "2025-08-03 08:50",
    imageUrl: "/images/mockup01.png",
    patientName: "김영희",
    patientId: "P001",
    documentType: "진료확인서",
    fileSize: "2.4MB",
    uploadedBy: "김간호사",
    content: "환자 김영희의 초기 진료 확인서입니다.",
  },
  // 추가 문서들 (펼치기 기능용)
  {
    id: "10",
    documentName: "처방전",
    uploadedAt: "2025-08-02 14:30",
    imageUrl: "/images/mockup01.png",
    patientName: "박철수",
    patientId: "P002",
    documentType: "처방전",
    fileSize: "1.5MB",
    uploadedBy: "김의사",
    content: "환자 박철수의 처방전입니다. 당뇨약 처방이 포함되어 있습니다.",
  },
  {
    id: "11",
    documentName: "검사결과",
    uploadedAt: "2025-08-01 09:20",
    imageUrl: "/images/mockup01.png",
    patientName: "이순자",
    patientId: "P003",
    documentType: "검사결과",
    fileSize: "3.8MB",
    uploadedBy: "박간호사",
    content: "환자 이순자의 혈액검사 결과입니다. 정상 범위 내에 있습니다.",
  },
  {
    id: "12",
    documentName: "진료확인서",
    uploadedAt: "2025-07-31 16:45",
    imageUrl: "/images/mockup01.png",
    patientName: "최민수",
    patientId: "P004",
    documentType: "진료확인서",
    fileSize: "2.2MB",
    uploadedBy: "이의사",
    content:
      "환자 최민수의 진료 확인서입니다. 항생제 복용 완료 후 상태가 양호합니다.",
  },
  {
    id: "13",
    documentName: "처방전",
    uploadedAt: "2025-07-30 11:15",
    imageUrl: "/images/mockup01.png",
    patientName: "김영희",
    patientId: "P001",
    documentType: "처방전",
    fileSize: "1.7MB",
    uploadedBy: "박의사",
    content: "환자 김영희의 처방전입니다. 혈압약 처방이 포함되어 있습니다.",
  },
  {
    id: "14",
    documentName: "검사결과",
    uploadedAt: "2025-07-29 13:40",
    imageUrl: "/images/mockup01.png",
    patientName: "박철수",
    patientId: "P002",
    documentType: "검사결과",
    fileSize: "4.1MB",
    uploadedBy: "김간호사",
    content: "환자 박철수의 당뇨 검사 결과입니다. 혈당 수치가 정상 범위입니다.",
  },
  {
    id: "15",
    documentName: "진료확인서",
    uploadedAt: "2025-07-28 10:30",
    imageUrl: "/images/mockup01.png",
    patientName: "이순자",
    patientId: "P003",
    documentType: "진료확인서",
    fileSize: "2.6MB",
    uploadedBy: "박의사",
    content:
      "환자 이순자의 진료 확인서입니다. 심장질환 관리가 잘 되고 있습니다.",
  },
];

export default function DocumentArchive() {
  const { user } = useUserStore();
  const [form] = Form.useForm();
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const pageSize = 9; // 한 페이지당 보여줄 문서 수

  const handleUpload = (info: any) => {
    if (info.file.status === "uploading") {
      setUploading(true);
      // 업로드 중 알림
      notification.info({
        message: `${info.file.name} 를 업로드 중입니다.`,
        icon: <FileTextOutlined />,
        duration: 0,
        key: "uploading",
        btn: (
          <DeleteOutlined onClick={() => notification.destroy("uploading")} />
        ),
      });
    } else if (info.file.status === "done") {
      setUploading(false);
      notification.destroy("uploading");

      // 업로드 완료 알림
      notification.success({
        message: "문서가 업로드되었습니다.",
        description: "의료문서 보관함에서 확인할 수 있습니다.",
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
        duration: 4,
      });

      setIsUploadModalVisible(false);
      form.resetFields();
    } else if (info.file.status === "error") {
      setUploading(false);
      notification.destroy("uploading");
      message.error(`${info.file.name} 파일 업로드에 실패했습니다.`);
    }
  };

  const handleDocumentClick = (document: any) => {
    setSelectedDocument(document);
    setIsDetailModalVisible(true);
  };

  const uploadProps = {
    name: "file",
    action: "https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188",
    headers: {
      authorization: "authorization-text",
    },
    onChange: handleUpload,
    accept: ".jpg,.jpeg,.png,.pdf",
    beforeUpload: (file: File) => {
      const isImageOrPdf =
        file.type.startsWith("image/") || file.type === "application/pdf";
      if (!isImageOrPdf) {
        message.error("사진과 PDF 파일만 올릴 수 있어요.");
        return false;
      }
      return true;
    },
  };

  // 검색 필터링 함수
  const filteredDocuments = mockDocuments.filter((document) => {
    const searchLower = searchText.toLowerCase();
    const documentDate = dayjs(document.uploadedAt.split(" ")[0]); // 날짜 부분만 추출

    // 텍스트 검색 조건
    const textMatch =
      document.patientName.toLowerCase().includes(searchLower) ||
      document.documentName.toLowerCase().includes(searchLower);

    // 날짜 검색 조건
    let dateMatch = true;
    if (selectedDate) {
      dateMatch = documentDate.isSame(selectedDate, "day");
    } else if (dateRange && dateRange[0] && dateRange[1]) {
      dateMatch = documentDate.isBetween(
        dateRange[0],
        dateRange[1],
        "day",
        "[]"
      ); // 시작일과 종료일 포함
    }

    return textMatch && dateMatch;
  });

  // 펼치기 기능: 초기에는 9개만, 펼치면 전체 표시
  const displayDocuments = isExpanded
    ? filteredDocuments
    : filteredDocuments.slice(0, 9);

  // 페이지네이션을 위한 데이터
  const paginatedDocuments = displayDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 검색어가 변경되면 페이지를 1로 리셋
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  // 날짜가 변경되면 페이지를 1로 리셋
  const handleDateChange = (date: any) => {
    setSelectedDate(date);
    setDateRange(null); // 단일 날짜 선택 시 범위 초기화
    setCurrentPage(1);
  };

  // 날짜 범위가 변경되면 페이지를 1로 리셋
  const handleDateRangeChange = (dates: [any, any] | null) => {
    setDateRange(dates);
    setSelectedDate(null); // 범위 선택 시 단일 날짜 초기화
    setCurrentPage(1);
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearchText("");
    setSelectedDate(null);
    setDateRange(null);
    setCurrentPage(1);
  };

  // 펼치기 버튼 클릭 핸들러
  const handleExpand = () => {
    setIsExpanded(true);
    setCurrentPage(1);
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
                icon={<FileTextOutlined />}
              />
              <div>
                <Title level={3} style={{ margin: 0, color: "#262626" }}>
                  의료문서 보관함
                </Title>
                <Space>
                  <Tooltip
                    title="환자 관련 문서들을 관리하고 보관하세요."
                    placement="top"
                  >
                    <InfoCircleOutlined
                      style={{ color: "#1890ff", cursor: "help" }}
                    />
                  </Tooltip>
                  <Text type="secondary" style={{ fontSize: "14px" }}>
                    환자 관련 문서들을 관리하고 보관하세요.
                  </Text>
                </Space>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Button type="link" style={{ padding: 0 }}>
                전체보기
              </Button>
            </div>
          </div>
        </div>

        {/* 검색 섹션 */}
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
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SearchOutlined style={{ color: "#1890ff", fontSize: "16px" }} />
              <Text strong style={{ fontSize: "16px" }}>
                문서 검색
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsUploadModalVisible(true)}
              style={{ borderRadius: "6px" }}
            >
              문서 추가하기
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Input.Search
                placeholder="시니어명, 문서 제목으로 검색하세요"
                value={searchText}
                onChange={handleSearchChange}
                style={{ width: "100%" }}
                size="large"
              />
            </Col>
            <Col xs={24} md={8}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <DatePicker
                  placeholder="특정 날짜 선택"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{ width: "100%" }}
                  size="large"
                  format="YYYY-MM-DD"
                  allowClear
                />
                <DatePicker.RangePicker
                  placeholder={["시작일", "종료일"]}
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: "100%" }}
                  size="large"
                  format="YYYY-MM-DD"
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} md={4}>
              <Button
                onClick={handleClearSearch}
                style={{ width: "100%" }}
                size="large"
              >
                초기화
              </Button>
            </Col>
          </Row>
        </div>

        {/* 문서 카드 그리드 */}
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {paginatedDocuments.map((document) => (
              <Card
                key={document.id}
                style={{
                  borderRadius: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                hoverable
                styles={{ body: { padding: "12px", textAlign: "center" } }}
                onClick={() => handleDocumentClick(document)}
              >
                <div
                  style={{
                    width: "100%",
                    height: "80px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "8px",
                  }}
                >
                  <img
                    src={document.imageUrl}
                    alt="문서"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement!.innerHTML = "📄";
                    }}
                  />
                </div>
                <div>
                  <Text strong style={{ fontSize: "12px" }}>
                    {document.documentName}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "10px" }}>
                    {document.uploadedAt}
                  </Text>
                </div>
              </Card>
            ))}
          </div>

          {/* 검색 결과가 없을 때 */}
          {filteredDocuments.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Text type="secondary">검색 결과가 없습니다.</Text>
            </div>
          )}

          {/* 펼치기 버튼 */}
          {!isExpanded && filteredDocuments.length > 9 && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Button
                type="text"
                size="large"
                icon={<DownOutlined />}
                onClick={handleExpand}
                style={{ color: "#1890ff" }}
              >
                더 보기 ({filteredDocuments.length - 9}개 더)
              </Button>
            </div>
          )}

          {/* 페이지네이션 */}
          {isExpanded && displayDocuments.length > pageSize && (
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <Pagination
                current={currentPage}
                total={displayDocuments.length}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} / ${total}개 문서`
                }
              />
            </div>
          )}
        </div>

        {/* 문서 상세 보기 모달 */}
        <Modal
          title={
            <Space>
              <EyeOutlined />
              문서 상세 보기
            </Space>
          }
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={[
            <Button key="download" type="primary" icon={<DownloadOutlined />}>
              다운로드
            </Button>,
            <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
              닫기
            </Button>,
          ]}
          width={800}
        >
          {selectedDocument && (
            <div style={{ marginTop: "16px" }}>
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <div
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <img
                      src={selectedDocument.imageUrl}
                      alt="문서"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: "4px",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML = "📄";
                      }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: "16px" }}>
                    <Title level={4} style={{ margin: "0 0 8px 0" }}>
                      {selectedDocument.documentName}
                    </Title>
                    <Space
                      direction="vertical"
                      size="small"
                      style={{ width: "100%" }}
                    >
                      <div>
                        <Text strong>시니어명:</Text>{" "}
                        {selectedDocument.patientName} (
                        {selectedDocument.patientId})
                      </div>
                      <div>
                        <Text strong>문서 유형:</Text>{" "}
                        {selectedDocument.documentType}
                      </div>
                      <div>
                        <Text strong>파일 크기:</Text>{" "}
                        {selectedDocument.fileSize}
                      </div>
                      <div>
                        <Text strong>업로드:</Text>{" "}
                        {selectedDocument.uploadedAt}
                      </div>
                      <div>
                        <Text strong>업로더:</Text>{" "}
                        {selectedDocument.uploadedBy}
                      </div>
                    </Space>
                  </div>
                  <div>
                    <Text strong>문서 내용:</Text>
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "12px",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                    >
                      {selectedDocument.content}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* 문서 업로드 모달 */}
        <Modal
          title="문서 업로드"
          open={isUploadModalVisible}
          onCancel={() => setIsUploadModalVisible(false)}
          footer={null}
          width={600}
        >
          <div style={{ marginTop: "16px" }}>
            <Upload {...uploadProps}>
              <Button
                icon={<UploadOutlined />}
                size="large"
                style={{ width: "100%", height: "100px" }}
                loading={uploading}
              >
                클릭하여 파일을 선택하거나 드래그하여 업로드하세요
              </Button>
            </Upload>
            <div style={{ marginTop: "16px", textAlign: "center" }}>
              <Text type="secondary">지원 형식: JPG, PNG, PDF (최대 50MB)</Text>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
