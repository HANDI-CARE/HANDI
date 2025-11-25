import { Col, Empty, Pagination, Row, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useDocuments } from "~/features/document/application/hooks/useDocuments";
import type { OffsetPaginationInfo } from "~/shared/infrastructure/api/dto";
import DocumentItemCard from "../DocumentCard";

interface DocumentHistoryProps {
  patientId: number;
}

export default function DocumentHistory({ patientId }: DocumentHistoryProps) {
  const [pageInfo, setPageInfo] = useState<OffsetPaginationInfo>();

  const filters = useMemo(
    () => ({
      page: pageInfo?.page ?? 1,
      size: pageInfo?.size ?? 9,
    }),
    [pageInfo]
  );

  const { data, isLoading, isFetching } = useDocuments(patientId, filters);

  useEffect(() => {
    if (data?.pageInfo) {
      setPageInfo(data.pageInfo);
    }
  }, [data?.pageInfo]);

  const handlePageChange = (page: number, size: number) => {
    setPageInfo((prev) => {
      if (!prev) return undefined as unknown as OffsetPaginationInfo;
      return {
        ...prev,
        page,
        size,
      };
    });
  };

  return (
    <Spin size="large" spinning={isLoading || isFetching}>
      {!data?.data?.length ? (
        <Empty description="문서가 없어요." />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {data.data.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.documentId}>
                <DocumentItemCard document={item} />
              </Col>
            ))}
          </Row>
          <div className="flex justify-center mt-6">
            <Pagination
              current={pageInfo?.page ? pageInfo.page : 1}
              total={pageInfo?.totalElements || 0}
              pageSize={pageInfo?.size}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </Spin>
  );
}
