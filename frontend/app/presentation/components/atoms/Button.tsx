import type { ButtonProps as AntButtonProps } from "antd";
import { Button as AntButton } from "antd";

interface ButtonProps extends Omit<AntButtonProps, "variant"> {
  variant?: "primary" | "secondary" | "text" | "link";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  ...props
}) => {
  const getButtonType = () => {
    switch (variant) {
      case "primary":
        return "primary";
      case "secondary":
        return "default";
      case "text":
        return "text";
      case "link":
        return "link";
      default:
        return "primary";
    }
  };

  return (
    <AntButton type={getButtonType()} {...props}>
      {children}
    </AntButton>
  );
};

export default Button;
