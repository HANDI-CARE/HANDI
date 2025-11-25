import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useNavigate } from "react-router";

interface BackToDashboardButtonProps {
  className?: string;
}

export default function BackToDashboardButton({
  className = "",
}: BackToDashboardButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      type="primary"
      icon={<ArrowLeftOutlined />}
      onClick={() => navigate("/nurse/dashboard")}
      className={`flex items-center gap-2 ${className}`}
    >
      대시보드로 돌아가기
    </Button>
  );
}
