import { FileTextOutlined } from "@ant-design/icons";
import { Card, Image, Typography } from "antd";
import React, { useState } from "react";

import { gray } from "@ant-design/colors";
import type { PatientDocument } from "~/features/document/domain/PatientDocument";

const { Text } = Typography;

interface DocumentItemCardProps {
  document: PatientDocument;
  /**
   * 별도로 지정하지 않으면 클릭 시 이미지가 표시됨
   */
  onClick?: () => void;
}

const DocumentItemCard: React.FC<DocumentItemCardProps> = ({
  document,
  onClick,
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const getCardStyles = () => {
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
    return { color: gray[4] };
  };

  const getIcon = () => {
    return (
      <FileTextOutlined className={getIconClasses()} style={getIconStyles()} />
    );
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsImageModalOpen(true);
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer"
        style={getCardStyles()}
        styles={{
          body: {
            padding: "16px",
            display: "flex",
            alignItems: "flex-start",
          },
        }}
        onClick={handleClick}
      >
        <div className="flex items-center w-full">
          {getIcon()}
          <div className="flex flex-1 flex-col min-w-0">
            <Text strong>{document.documentName}</Text>
            <Text type="secondary">
              {document.uploadedAt.toLocaleDateString()}
            </Text>
          </div>
        </div>

        <Image
          src={document.originalPhotoPaths}
          className="hidden"
          preview={{
            visible: isImageModalOpen,
            onVisibleChange: setIsImageModalOpen,
          }}
        />
      </Card>
    </>
  );
};

export default DocumentItemCard;
