import type { StatisticProps } from "antd";
import { Statistic as AntStatistic } from "antd";

interface CustomStatisticProps extends StatisticProps {
  title?: React.ReactNode;
  value?: number | string;
  valueStyle?: React.CSSProperties;
  className?: string;
}

export default function Statistic({
  title,
  value,
  valueStyle,
  className = "",
  ...props
}: CustomStatisticProps) {
  return (
    <AntStatistic
      title={title}
      value={value}
      valueStyle={valueStyle}
      className={className}
      {...props}
    />
  );
}
