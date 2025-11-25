import { Empty, Pagination, Spin, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useAllSchedules } from "~/features/hospital/application/hooks/useHospitals";
import type { AllSchedules } from "~/features/hospital/domain/Hospital";
import type { OffsetPaginationInfo } from "~/shared/infrastructure/api/dto";
import ConsultationRecordCard from "../ConsultationRecordCard";
import ConsultationDetailModal from "./ConsultationDetailModal";

const { Title, Text } = Typography;

interface ConsultationRecordHistoryProps {
  patientId: number;
  meetingType?: "withDoctor" | "withEmployee";
  onCancel?: () => void;
}

export default function ConsultationRecordHistory({
  patientId,
  meetingType = "withDoctor",
  onCancel,
}: ConsultationRecordHistoryProps) {
  const [pageInfo, setPageInfo] = useState<OffsetPaginationInfo>();
  const [selectedConsultation, setSelectedConsultation] =
    useState<AllSchedules | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filters = useMemo(
    () => ({
      page: pageInfo?.page ?? 1,
      size: pageInfo?.size ?? 10,
    }),
    [pageInfo]
  );

  const { data, isLoading, isFetching } = useAllSchedules(
    { meetingType },
    filters
  );

  useEffect(() => {
    if (data?.pageInfo) {
      setPageInfo(data.pageInfo);
    }
  }, [data?.pageInfo]);

  const handlePageChange = (page: number, size: number) => {
    setPageInfo((prev) => {
      if (!prev) return undefined;
      return {
        ...prev,
        page,
        size,
      };
    });
  };

  const handleConsultationClick = (consultation: AllSchedules) => {
    if (consultation.content !== null) {
      setSelectedConsultation(consultation);
      setIsDetailModalOpen(true);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedConsultation(null);
  };

  return (
    <Spin size="large" spinning={isLoading || isFetching}>
      <div className="w-full">
        {/* 진료 내역 목록 */}
        <div className="space-y-4">
          {/* 진료 내역 카드 목록 */}
          {!data?.result?.length ? (
            <Empty description="진료 내역이 없습니다." />
          ) : (
            <div className="flex flex-col gap-4">
              {data?.result?.map((record) => (
                <ConsultationRecordCard
                  key={record.id}
                  record={record}
                  onClick={() => handleConsultationClick(record)}
                  ellipsis={true}
                />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-6">
            <Pagination
              current={pageInfo?.page ? pageInfo.page : 1}
              total={pageInfo?.totalElements || 0}
              pageSize={pageInfo?.size}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </div>

        {/* 진료 상세 보기 모달 */}
        <ConsultationDetailModal
          consultation={selectedConsultation}
          open={isDetailModalOpen}
          onCancel={handleCloseDetail}
        />
      </div>
    </Spin>
  );
}
