import { WarningOutlined } from "@ant-design/icons";
import { Alert, Button, ConfigProvider, Empty, Typography } from "antd";
import { useState } from "react";
import type { DrugInfo } from "~/features/drug/application/domain/DrugInfo";

const { Text, Title } = Typography;

interface DrugInfoItemProps {
  drugInfo: DrugInfo;
  showInfo?: "all" | "important";
}

export default function DrugInfoItem({
  drugInfo,
  showInfo,
}: DrugInfoItemProps) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="flex flex-col align xl:flex-row gap-4">
      {/* 약물 사진과 이름, 제조사 정보 등 */}
      <div className="min-w-0 flex flex-row basis-0 flex-grow-4 gap-4 items-start">
        <img
          src={drugInfo.image}
          alt={drugInfo.productName}
          className="w-30 md:w-36 lg:w-42 rounded-lg"
        />
        <div className="flex flex-col">
          <Title level={5}>{drugInfo.productName}</Title>
          {drugInfo.dosage ? (
            <Text>{drugInfo.dosage}</Text>
          ) : (
            <Text type="secondary">용량 미상</Text>
          )}
          {drugInfo.manufacturer ? (
            <Text>{drugInfo.manufacturer}</Text>
          ) : (
            <Text type="secondary">제조사 미상</Text>
          )}
        </div>
      </div>
      {/* 약품 복용 정보 */}
      {showInfo && (
        <div className="min-w-0 flex flex-row basis-0 flex-grow-6 justify-center gap-2">
          {drugInfo.description ? (
            <>
              <div className="flex flex-col flex-1 gap-2 items-end">
                <div
                  className={`w-full flex flex-1 ${
                    showDetail ? "flex-col" : "flex-row"
                  } gap-2`}
                >
                  {showInfo === "all" && (
                    <>
                      <Alert
                        type="success"
                        className="flex flex-col flex-1 flex-shrink-0 gap-2 !items-start"
                        message={
                          <div className="flex flex-col gap-2">
                            <Text strong>용법 및 용량</Text>
                            <Text>
                              {
                                drugInfo.description?.[
                                  showDetail ? "상세" : "키워드"
                                ]["용법 및 용량"]
                              }
                            </Text>
                          </div>
                        }
                      />
                      <Alert
                        type="warning"
                        className="flex flex-col flex-1 flex-shrink-0 gap-2 !items-start"
                        message={
                          <div className="flex flex-col gap-2">
                            <Text strong>효능 및 효과</Text>
                            <Text>
                              {
                                drugInfo.description?.[
                                  showDetail ? "상세" : "키워드"
                                ]["효능 및 효과"]
                              }
                            </Text>
                          </div>
                        }
                      />
                    </>
                  )}

                  <Alert
                    type="error"
                    className="flex flex-col flex-1 flex-shrink-0 gap-2 !items-start"
                    message={
                      <div className="flex flex-col gap-2">
                        <Text strong>복약 시 주의 사항</Text>
                        <Text>
                          {
                            drugInfo.description?.[
                              showDetail ? "상세" : "키워드"
                            ]["복약 시 주의 사항"]
                          }
                        </Text>
                      </div>
                    }
                  />
                </div>
                <Button type="link" onClick={() => setShowDetail(!showDetail)}>
                  {showDetail ? "간략히" : "자세히"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <ConfigProvider renderEmpty={() => <WarningOutlined />}>
                <Empty
                  description={
                    <>
                      <Text type="secondary">약품 정보를 받아오고 있어요.</Text>
                      <br />
                      <Text type="secondary">잠시 후에 다시 시도해보세요.</Text>
                    </>
                  }
                />
              </ConfigProvider>
            </>
          )}
        </div>
      )}
    </div>
  );
}
