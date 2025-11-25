import type { SelectProps } from "antd";
import { Select as AntSelect } from "antd";

interface CustomSelectProps extends SelectProps {
  className?: string;
  options?: Array<{ label: string; value: any }>;
}

export default function Select({
  className = "",
  options = [],
  ...props
}: CustomSelectProps) {
  return <AntSelect className={className} options={options} {...props} />;
}
