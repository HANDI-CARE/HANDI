import { Card, Spin } from "antd";
import type { Dayjs } from "dayjs";
import DetailItem from "../molecules/DetailItem";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";

interface GenericDetailListProps {
  selectedDate: Dayjs;
  items: AllSchedules[];
  title: string;
  emptyMessage: string;
  emptyIcon: string;
  isLoading?: boolean;
  renderAdditionalInfo?: (item: AllSchedules) => React.ReactNode;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}

export default function GenericDetailList({
  selectedDate,
  items,
  title,
  emptyMessage,
  emptyIcon,
  isLoading = false,
  renderAdditionalInfo,
  primaryButtonText,
  secondaryButtonText
}: GenericDetailListProps) {
  return (
    <Card
      title={
        <span className="text-lg font-semibold">
          {selectedDate.format("YYYY-MM-DD")} {title}
        </span>
      }
      className="h-full"
      styles={{ body: { padding: "16px" } }}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <DetailItem
              key={item.id}
              item={item}
              renderAdditionalInfo={renderAdditionalInfo}
              primaryButtonText={primaryButtonText}
              secondaryButtonText={secondaryButtonText}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-3">{emptyIcon}</div>
          <p className="text-base">{emptyMessage}</p>
        </div>
      )}
    </Card>
  );
}
