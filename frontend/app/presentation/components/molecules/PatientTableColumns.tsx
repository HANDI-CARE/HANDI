import { Tag } from "antd";
import { Link } from "react-router";
import type { PatientData } from "../../../features/patient/domain/Patient";
import PatientTableItem from "./PatientTableItem";

export const getPatientTableColumns = () => [
  {
    title: "시니어 정보",
    dataIndex: "name",
    key: "name",
    render: (name: string, record: PatientData) => (
      <PatientTableItem name={name} status={record.status} />
    ),
  },
  {
    title: "나이",
    dataIndex: "age",
    key: "age",
    render: (age: number) => `${age}세`,
  },
  {
    title: "진단",
    dataIndex: "diagnosis",
    key: "diagnosis",
  },
  {
    title: "최근 진료일",
    dataIndex: "lastVisit",
    key: "lastVisit",
  },
  {
    title: "상태",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const getStatusColor = (status: string) => {
        switch (status) {
          case "위험":
            return "red";
          case "주의":
            return "orange";
          case "양호":
            return "green";
          default:
            return "blue";
        }
      };
      return <Tag color={getStatusColor(status)}>{status}</Tag>;
    },
  },
  {
    title: "참고사항",
    dataIndex: "note",
    key: "note",
  },
  {
    title: "작업",
    key: "action",
    render: (record: PatientData) => (
      <Link
        to={`/nurse/patients/${record.id}`}
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        상세보기
      </Link>
    ),
  },
];
