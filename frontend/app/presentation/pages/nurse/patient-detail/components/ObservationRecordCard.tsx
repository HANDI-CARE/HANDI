import {
  ExclamationCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Card, Typography } from "antd";
import React from "react";

import { gray, orange, red } from "@ant-design/colors";
import type { ObservationRecord } from "~/features/patient/domain/ObservationRecord";

const { Text } = Typography;

interface ObservationRecordCardProps {
  record: ObservationRecord;
  onClick?: () => void;
  ellipsis?: boolean;
}

const ObservationRecordCard: React.FC<ObservationRecordCardProps> = ({
  record,
  onClick,
  ellipsis,
}) => {
  const getCardStyles = () => {
    switch (record.level) {
      case "LOW":
        return {
          backgroundColor: "white",
          border: `1px solid #f0f0f0`, // gray-4
        };
      case "MEDIUM":
        return {
          backgroundColor: orange[0],
          border: `1px solid ${orange[3]}`,
        };
      case "HIGH":
        return {
          backgroundColor: red[0],
          border: `1px solid ${red[3]}`,
        };
      default:
        return {
          backgroundColor: "white",
          border: `1px solid #f0f0f0`, // gray-4
        };
    }
  };

  const getIconClasses = () => {
    const baseClasses = "text-xl mr-4 flex-shrink-0";
    return baseClasses;
  };

  const getIconStyles = () => {
    switch (record.level) {
      case "LOW":
        return { color: gray[4] };
      case "MEDIUM":
        return { color: orange[4] };
      case "HIGH":
        return { color: red[4] };
      default:
        return { color: gray[4] };
    }
  };

  const getIcon = () => {
    switch (record.level) {
      case "LOW":
        return (
          <FileTextOutlined
            className={getIconClasses()}
            style={getIconStyles()}
          />
        );
      case "MEDIUM":
        return (
          <WarningOutlined
            className={getIconClasses()}
            style={getIconStyles()}
          />
        );
      case "HIGH":
        return (
          <ExclamationCircleOutlined
            className={getIconClasses()}
            style={getIconStyles()}
          />
        );
      default:
        return (
          <FileTextOutlined
            className={getIconClasses()}
            style={getIconStyles()}
          />
        );
    }
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
        <div className="flex flex-1 flex-col min-w-0">
          <Text ellipsis={ellipsis}>{record.content}</Text>
          <Text type="secondary">{record.createdAt.toLocaleString()}</Text>
        </div>
      </div>
    </Card>
  );
};

export default ObservationRecordCard;
