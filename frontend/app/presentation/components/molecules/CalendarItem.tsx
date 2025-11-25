import type { AllSchedules } from "../../../features/hospital/domain/Hospital";

interface CalendarItemProps {
  item: AllSchedules;
  isSelected?: boolean;
}

export default function CalendarItem({
  item,
  isSelected
}: CalendarItemProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
      <span className="text-xs text-gray-700 truncate">{item.senior.name}</span>
    </div>
  );
}
