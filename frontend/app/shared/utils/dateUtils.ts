import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// 문자열 → Date
export const parseDate = (str: string) => {
  return dayjs(str, "YYYYMMDD").toDate();
};
export const parseDateTime = (str: string) => {
  return dayjs(str, "YYYYMMDDHHmmss").toDate();
};
export const parseTime = (str: string) => {
  return dayjs(str, "HHmmss").toDate();
};

// Date → 문자열
export const formatDate = (date: Date) => {
  return dayjs(date).format("YYYYMMDD");
};
export const formatDateTime = (date: Date) => {
  return dayjs(date).format("YYYYMMDDHHmmss");
};
export const formatTime = (date: Date) => {
  return dayjs(date).format("HHmmss");
};