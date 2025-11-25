import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Calendar as AntCalendar } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Card } from "../atoms/Card";
import CalendarItem from "../molecules/CalendarItem";
import type { AllSchedules } from "../../../features/hospital/domain/Hospital";


interface GenericCalendarProps {
  items: AllSchedules[];
  selectedDate: Dayjs;
  onDateSelect: (date: Dayjs) => void;
  className?: string;
}

export default function GenericCalendar({
  items,
  selectedDate,
  onDateSelect,
  className,
}: GenericCalendarProps) {
  // 년도 옵션 생성 (2010년부터 현재 년도까지)
  const currentYear = dayjs().year();
  const yearOptions = Array.from(
    { length: currentYear - 2009 },
    (_, i) => 2010 + i,
  );

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
      <AntCalendar
        value={selectedDate}
        onSelect={onDateSelect}
        headerRender={({
          value,
          onChange,
        }: {
          value: Dayjs;
          onChange?: (date: Dayjs) => void;
        }) => {
          const start = 0;
          const current = value.month();
          const months = [...Array(12)].map((_, index) => {
            const month = (index + start) % 12;
            return {
              label: `${month + 1}월`,
              value: month,
            };
          });

          return (
            <div className="p-4">
              {/* 화살표로 년도 월 선택 */}
              <div className="flex items-center justify-between mb-2">
                <button
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={() => {
                    const newValue = value.clone().subtract(1, "month");
                    onChange?.(newValue);
                    onDateSelect(newValue);
                  }}
                >
                  <ArrowLeftOutlined />
                </button>

                <span className="text-lg font-semibold">
                  {value.format("YYYY년 MM월")}
                </span>

                <button
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={() => {
                    const newValue = value.clone().add(1, "month");
                    onChange?.(newValue);
                    onDateSelect(newValue);
                  }}
                >
                  <ArrowRightOutlined />
                </button>
              </div>

              {/* 년도 월 선택 드롭다운 */}
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <select
                    value={value.year()}
                    onChange={(e) => {
                      const newValue = value.year(Number(e.target.value));
                      onChange?.(newValue);
                      onDateSelect(newValue);
                    }}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                  <select
                    value={value.month() + 1}
                    onChange={(e) => {
                      const newValue = value.month(Number(e.target.value) - 1);
                      onChange?.(newValue);
                      onDateSelect(newValue);
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {month}월
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        }}
        // headerRender 끝

        // cellRender 시작
        cellRender={(current, info) => {
          if (info.type !== "date") return null;

          const dateStr = current.format("YYYY-MM-DD");
          const dayItems =
            items?.filter((item) => {
              const itemDate =
                item.meetingTime
              return (
                itemDate && dayjs(itemDate).format("YYYY-MM-DD") === dateStr
              );
            }) || [];

          const isSelected = selectedDate.format("YYYY-MM-DD") === dateStr;

          if (dayItems.length > 0) {
            return (
              <div className="space-y-1.5">
                {dayItems.map((item, index) => (
                  <CalendarItem
                    key={index}
                    item={item}
                    isSelected={isSelected}
                  />
                ))}
              </div>
            );
          }
          return null;
        }}
      />
  );
}
