import { Typography } from "antd";

interface SubHeaderProps {
  userName: string;
  date: string;
  title?: string;
}

export default function SubHeader({
  userName,
  date,
  title = "간호사 대시보드",
}: SubHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <Typography.Title level={3}>{title}</Typography.Title>
        <Typography.Text>{userName}님, 안녕하세요</Typography.Text>
      </div>
      <div className="text-right">
        <Typography.Text>{date}</Typography.Text>
      </div>
    </div>
  );
}
