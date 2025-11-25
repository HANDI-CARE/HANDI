import { geekblue, lime, orange, volcano } from "@ant-design/colors";
import BedtimeIcon from "@mui/icons-material/Bedtime";
import HotelIcon from "@mui/icons-material/Hotel";
import SunnyIcon from "@mui/icons-material/Sunny";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import { Card, Space, Typography } from "antd";
import React, { useCallback } from "react";
import type { MedicationScheduleTime } from "~/features/patient/domain/MedicationItem";

const { Text } = Typography;

interface MedicationCheckTagProps {
  timing: MedicationScheduleTime;
  isEnabled?: boolean;
  className?: string;
}

const timingConfigs = {
  BEFORE_BREAKFAST: {
    icon: <WbTwilightIcon style={{ color: lime[5] }} />,
    beforeColor: "#1890ff",
    afterColor: "#fa8c16",
    displayText: "아침식사 전",
  },
  AFTER_BREAKFAST: {
    icon: <WbTwilightIcon style={{ color: lime[5] }} />,
    beforeColor: "#1890ff",
    afterColor: "#fa8c16",
    displayText: "아침식사 후",
  },
  BEFORE_LUNCH: {
    icon: <SunnyIcon style={{ color: orange[4] }} />,
    beforeColor: "#1890ff",
    afterColor: "#fa8c16",
    displayText: "점심식사 전",
  },
  AFTER_LUNCH: {
    icon: <SunnyIcon style={{ color: orange[4] }} />,
    beforeColor: "#1890ff",
    afterColor: "#fa8c16",
    displayText: "점심식사 후",
  },
  BEFORE_DINNER: {
    icon: <BedtimeIcon style={{ color: volcano[5] }} />,
    beforeColor: "#1890ff",
    afterColor: "#fa8c16",
    displayText: "저녁식사 전",
  },
  AFTER_DINNER: {
    icon: <BedtimeIcon style={{ color: volcano[5] }} />,
    beforeColor: "#1890ff",
    afterColor: "#fa8c16",
    displayText: "저녁식사 후",
  },
  BEDTIME: {
    icon: <HotelIcon style={{ color: geekblue[4] }} />,
    beforeColor: "#1890ff",
    afterColor: "#fa8c16",
    displayText: "취침 전",
  },
};

const MedicationCheckTag: React.FC<MedicationCheckTagProps> = ({
  timing,
  isEnabled = false,
  className,
}) => {
  // 타이밍에 따른 아이콘과 색상 설정
  const getTimingConfig = useCallback((timing: MedicationScheduleTime) => {
    return timingConfigs[timing];
  }, []);

  // 타이밍 텍스트 렌더링 (전/후 강조)
  const renderTimingText = useCallback(
    (timing: MedicationScheduleTime) => {
      const config = getTimingConfig(timing);
      const displayText = config.displayText;

      if (displayText.includes("전")) {
        const [prefix, suffix] = displayText.split("전");
        return (
          <span>
            {prefix}
            <span
              style={{
                fontWeight: "bold",
                color: config.beforeColor,
              }}
            >
              전
            </span>
            {suffix}
          </span>
        );
      } else if (displayText.includes("후")) {
        const [prefix, suffix] = displayText.split("후");
        return (
          <span>
            {prefix}
            <span
              style={{
                fontWeight: "bold",
                color: config.afterColor,
              }}
            >
              후
            </span>
            {suffix}
          </span>
        );
      }

      return displayText;
    },
    [getTimingConfig],
  );

  const config = getTimingConfig(timing);

  return (
    <Card
      className={className}
      style={{
        backgroundColor: "#fafafa",
        opacity: isEnabled ? 1 : 0.5,
      }}
      styles={{
        body: {
          padding: "4px 16px",
        },
      }}
      size="small"
    >
      <Space
        align="center"
        style={{
          width: "100%",
          justifyContent: "space-between",
          display: "inline-flex",
          // gap: "48px",
        }}
      >
        <Space align="center">
          <div>{config.icon}</div>
          <Text strong>{renderTimingText(timing)}</Text>
        </Space>
      </Space>
    </Card>
  );
};

export default MedicationCheckTag;
