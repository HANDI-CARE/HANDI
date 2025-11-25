import type { CardProps as AntCardProps } from "antd";
import { Card as AntCard } from "antd";

export interface CardProps extends AntCardProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <AntCard
      className={`shadow-sm hover:shadow-md transition-shadow ${className}`}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default Card;
