import { MedicineBoxOutlined } from "@ant-design/icons";
import { Card } from "../atoms";
import { Button } from "../atoms/Button";

interface TaskItemProps {
  title: string;
  patientName: string;
  time: string;
  type: string;
  onComplete?: () => void;
}

export default function TaskItem({
  title,
  patientName,
  time,
  type,
  onComplete,
}: TaskItemProps) {
  return (
    <Card
      className="mb-2 h-[120px] transition-colors"
      styles={{ body: { backgroundColor: "#f9fafb", height: "100%" } }}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start flex-1">
          <div className="flex items-start gap-2">
            <MedicineBoxOutlined style={{ fontSize: "20px", marginTop: 4 }} />
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-gray-500 text-sm">{patientName}</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <div>{time}</div>
            <div className="text-gray-500">{type}</div>
          </div>
        </div>
        <div className="mt-2">
          <Button size="small" block onClick={onComplete}>
            완료 처리
          </Button>
        </div>
      </div>
    </Card>
  );
}
