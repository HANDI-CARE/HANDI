import { UserOutlined } from "@ant-design/icons";

interface PatientTableItemProps {
  name: string;
  status: "위험" | "주의" | "양호";
}

export default function PatientTableItem({
  name,
  status,
}: PatientTableItemProps) {
  return (
    <div className="flex items-center gap-2">
      <UserOutlined />
      <span className="font-medium">{name}</span>
    </div>
  );
}
