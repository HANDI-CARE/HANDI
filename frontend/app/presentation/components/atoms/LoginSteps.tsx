import { Steps } from "antd";
import React from "react";

const { Step } = Steps;

interface StepItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface LoginStepsProps {
  steps?: StepItem[];
  current: number;
  size?: "default" | "small";
  direction?: "horizontal" | "vertical";
  className?: string;
  onChange?: (current: number) => void;
}

// 기본 로그인 스텝 문구들
const defaultLoginSteps: StepItem[] = [
  {
    title: "역할 선택",
    description: "역할(근로자 / 보호자)을 선택해주세요.",
  },
  {
    title: "기관코드",
    description: "원하시는 기관 코드를 입력하세요",
  },
  {
    title: "추가 정보",
    description: "필수 개인 정보를 입력해주세요.",
  },
  // {
  //   title: '프로필 설정',
  //   description: '프로필을 완성하세요',
  // },
];

export const LoginSteps: React.FC<LoginStepsProps> = ({
  steps = defaultLoginSteps,
  current,
  size = "default",
  direction = "horizontal",
  className,
  onChange,
}) => {
  return (
    <Steps
      current={current}
      size={size}
      direction={direction}
      className={className}
      onChange={onChange}
    >
      {steps.map((step, index) => (
        <Step
          key={index}
          title={step.title}
          description={step.description}
          icon={step.icon}
        />
      ))}
    </Steps>
  );
};
