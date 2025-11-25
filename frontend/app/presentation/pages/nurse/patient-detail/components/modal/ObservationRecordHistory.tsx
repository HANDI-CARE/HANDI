import { FileTextOutlined } from "@ant-design/icons";
import { Empty, Modal, Pagination, Spin, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { usePatientObservationRecords } from "~/features/patient/application/hooks/usePatients";
import type { ObservationRecord } from "~/features/patient/domain/ObservationRecord";
import type { OffsetPaginationInfo } from "~/shared/infrastructure/api/dto";
import ObservationRecordCard from "../ObservationRecordCard";
import ObservationRecordDetail from "./ObservationRecordDetail";

const { Title, Text } = Typography;

interface ObservationRecordHistoryProps {
  patientId: number;
  onCancel?: () => void;
}

export default function ObservationRecordHistory({
  patientId,
  onCancel,
}: ObservationRecordHistoryProps) {
  const [pageInfo, setPageInfo] = useState<OffsetPaginationInfo>();
  const [selectedRecord, setSelectedRecord] =
    useState<ObservationRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filters = useMemo(
    () => ({
      page: pageInfo?.page ?? 1,
      size: pageInfo?.size ?? 7,
      startDate: new Date(1990, 0, 1),
      endDate: new Date(2100, 0, 0),
    }),
    [pageInfo]
  );

  const { data, isLoading, isFetching } = usePatientObservationRecords(
    patientId,
    filters
  );

  useEffect(() => {
    setPageInfo(data?.pageInfo);
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

  const handleRecordClick = (record: ObservationRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  };

  // 최초 모달 실행 시 데이터
  // useEffect(() => {
  //   handlePageChange(1);
  // }, []);

  return (
    <Spin size="large" spinning={isLoading || isFetching}>
      <div className="w-full">
        {/* 관찰 일지 목록 */}
        <div className="space-y-4">
          {/* 관찰 일지 카드 목록 */}
          {!data?.data?.length ? (
            <Empty />
          ) : (
            <div className="flex flex-col gap-4">
              {data?.data?.map((record) => (
                <ObservationRecordCard
                  key={record.id}
                  record={record}
                  onClick={() => handleRecordClick(record)}
                  ellipsis={true}
                />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-6">
            <Pagination
              current={pageInfo?.page}
              total={pageInfo?.totalElements || 0}
              pageSize={pageInfo?.size}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </div>
        {/* 상세 보기 모달 */}
        <Modal
          title={
            <div className="flex items-center space-x-2">
              <FileTextOutlined className="text-blue-500" />
              <span>관찰 일지 상세</span>
            </div>
          }
          open={isDetailModalOpen}
          onCancel={handleCloseDetail}
          footer={null}
          width={600}
          destroyOnHidden
        >
          {selectedRecord && (
            <ObservationRecordDetail
              patientId={patientId}
              record={selectedRecord}
              onClose={handleCloseDetail}
            />
          )}
        </Modal>
      </div>
    </Spin>
  );
}
