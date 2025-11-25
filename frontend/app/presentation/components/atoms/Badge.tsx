import type { BadgeProps } from "antd";
import { Badge as AntBadge } from "antd";

interface CustomBadgeProps extends BadgeProps {
  status?: "success" | "error" | "default" | "processing" | "warning";
  text?: React.ReactNode;
  className?: string;
}

export default function Badge({
  status = "default",
  text,
  className = "",
  ...props
}: CustomBadgeProps) {
  return (
    <AntBadge status={status} text={text} className={className} {...props} />
  );
}
