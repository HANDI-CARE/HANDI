import { Tooltip, Typography } from "antd";
import { useMemo, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { VitalSign } from "~/features/patient/domain/VitalSign";

type VitalSignDataKey =
  | "systolic"
  | "diastolic"
  | "bloodGlucose"
  | "temperature";

interface VitalSignCardProps {
  records: VitalSign[];
  dataKey: VitalSignDataKey[];
  title: string | ReactNode;
  lineColor?: string;
}

const VitalSignCard: React.FC<VitalSignCardProps> = ({
  records,
  dataKey,
  title,
  lineColor = "#1890ff",
}) => {
  const range = useMemo(() => {
    // 여러 dataKey의 값들 중 제일 큰 것과 작은 것으로 계산
    const allValues = records.flatMap((record) =>
      dataKey.map((key) => record[key])
    );
    const min = Math.min(
      ...allValues.filter((value) => value !== undefined && value !== null)
    );
    const max = Math.max(
      ...allValues.filter((value) => value !== undefined && value !== null)
    );
    const diff = max - min;
    const margin = diff * 0.8;
    return { min: min - margin, max: max + margin };
  }, [records, dataKey]);

  const chartData = useMemo(
    () =>
      records.map((record) => ({
        ...record,
        updatedAtTs: record.measuredDate.getTime(),
      })),
    [records]
  );

  const xTicks = useMemo(
    () => records.map((record) => record.measuredDate.getTime()),
    [records]
  );

  return (
    <div className="text-center outline-none">
      {typeof title === "string" ? (
        <Typography.Title level={4} className="mb-2 ">
          {title}
        </Typography.Title>
      ) : (
        title
      )}
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={chartData} style={{ outline: "none" }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="updatedAtTs"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number, index: number) => {
              // 첫 번째만 n월 n일 표시
              if (index === 0) {
                const date = new Date(value);
                return `${date.getMonth() + 1}월 ${date.getDate()}일`;
              }
              return new Date(value).getDate().toString() + "일";
            }}
            ticks={xTicks}
            interval="preserveStartEnd"
            stroke="#8c8c8c"
            strokeWidth={0.5}
          />
          <YAxis
            domain={[range.min, range.max]}
            stroke="#8c8c8c"
            strokeWidth={0.5}
            tickFormatter={(value: number) =>
              typeof value === "number" ? value.toFixed(1) : value
            }
          />
          <Tooltip />
          {dataKey.map((key) => (
            <Line
              key={key}
              dataKey={key}
              stroke={lineColor}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalSignCard;
