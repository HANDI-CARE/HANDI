import { CalendarOutlined, CheckOutlined } from "@ant-design/icons";
import { Button, Card, Typography } from "antd";
import React from "react";

import { gray, green } from "@ant-design/colors";
import { useNavigate } from "react-router";
import type { AllSchedules } from "~/features/hospital/domain/Hospital";

const { Text } = Typography;

interface ConsultationRecordCardProps {
  record: AllSchedules;
  onClick?: () => void;
  ellipsis?: boolean;
}

const ConsultationRecordCard: React.FC<ConsultationRecordCardProps> = ({
  record,
  onClick,
  ellipsis,
}) => {
  const navigate = useNavigate();

  // 예약 확정 상태일 때 현재 시간이 진료 시간대 내에 있는지 확인
  const isWithinConsultationTime =
    record.status === "CONDUCTED" &&
    record.startedAt <= new Date() &&
    record.endedAt >= new Date();

  const getCardStyles = () => {
    if (record.content !== null) {
      // 완료. 요약 내용이 있으면 완료된 것으로 간주
      return {
        backgroundColor: "white",
        border: `1px solid #f0f0f0`, // gray-4
      };
    } else if (record.status === "CONDUCTED") {
      // 확정, 아직 시간 안 됨
      return {
        backgroundColor: green[0],
        border: `1px solid ${green[3]}`,
      };
    }
    return {
      backgroundColor: "white",
      border: `1px solid #f0f0f0`, // gray-4
    };
  };

  const getIconClasses = () => {
    const baseClasses = "text-xl mr-4 flex-shrink-0";
    return baseClasses;
  };

  const getIconStyles = () => {
    if (record.content !== null) {
      // 완료. 요약 내용이 있으면 완료된 것으로 간주
      return { color: gray[4] };
    } else if (record.status === "CONDUCTED") {
      // 확정, 아직 시간 안 됨
      return { color: green[4] };
    }
    return { color: gray[4] };
  };

  const getIcon = () => {
    switch (record.status) {
      case "CONDUCTED":
        return (
          <CheckOutlined className={getIconClasses()} style={getIconStyles()} />
        );
      default:
        return (
          <CalendarOutlined
            className={getIconClasses()}
            style={getIconStyles()}
          />
        );
    }
  };

  const handleClickEnter = () => {
    navigate(`/video-call/${record.id}`);
  };

  return (
    <Card
      className={`${onClick ? "cursor-pointer" : ""}`}
      style={getCardStyles()}
      styles={{
        body: {
          padding: "16px",
          display: "flex",
          alignItems: "flex-start",
        },
      }}
      onClick={onClick}
    >
      <div className="flex items-center w-full">
        {getIcon()}
        <div className="flex flex-1 flex-col min-w-0 items-start">
          {record.content ? (
            <Text strong>
              {record.title ||
                `${
                  record.meetingType === "withEmployee"
                    ? "진료가 완료되었습니다."
                    : "상담이 완료되었습니다."
                } `}
            </Text>
          ) : (
            <Text strong>
              {record.title ||
                `${
                  record.meetingType === "withEmployee"
                    ? "진료가 예정되어 있습니다."
                    : "상담이 예정되어 있습니다."
                } `}
            </Text>
          )}
          <Text type="secondary">
            {record.meetingTime.toLocaleDateString()}{" "}
            {record.meetingTime.toLocaleTimeString()}
          </Text>
          {record.status === "PENDING" && isWithinConsultationTime && (
            <Button className="mt-2" size="small" onClick={handleClickEnter}>
              통화방 입장하기
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ConsultationRecordCard;
