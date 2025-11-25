import { UserOutlined } from "@ant-design/icons";
import type { Patient } from "../../../features/patient/domain/Patient";
import { Card } from "../atoms";

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export default function PatientCard({ patient, onClick }: PatientCardProps) {
  return (
    <Card
      hoverable
      onClick={onClick}
      className="cursor-pointer"
      title={
        <div className="flex items-center gap-2">
          <UserOutlined />
          <span className="font-semibold">{patient.name}</span>
          <span className="text-sm text-gray-500">
            ({patient.age}세, {patient.gender === "MALE" ? "남성" : "여성"})
          </span>
        </div>
      }
    >
      <></>
      {/* 실제로 전화번호와 주소가 없어 사용하기 힘든 컴포넌트. 혹시 몰라서 남겨 놓음. */}
      {/* <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <PhoneOutlined className="text-gray-400" />
          <span>{patient.phoneNumber}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <HomeOutlined className="text-gray-400" />
          <span>{patient.address}</span>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          등록일: {new Date(patient.createdAt).toLocaleDateString("ko-KR")}
        </div>
      </div> */}
    </Card>
  );
}
