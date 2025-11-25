import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import weekOfYear from "dayjs/plugin/weekOfYear";

// dayjs 플러그인 확장
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

/**
 * 이번주 시작날짜를 구합니다 (월요일)
 * @returns 이번주 시작날짜 (Date 객체)
 */
export const getThisWeekStart = (): Date => {
  return dayjs().startOf("week").toDate();
};

/**
 * 이번주 마지막날짜를 구합니다 (일요일)
 * @returns 이번주 마지막날짜 (Date 객체)
 */
export const getThisWeekEnd = (): Date => {
  return dayjs().endOf("week").toDate();
};

/**
 * 이번주 시작날짜와 마지막날짜를 함께 구합니다
 * @returns { start: Date, end: Date } 이번주 시작날짜와 마지막날짜
 */
export const getThisWeekRange = (): { start: Date; end: Date } => {
  return {
    start: getThisWeekStart(),
    end: getThisWeekEnd(),
  };
};

/**
 * 특정 날짜의 주 시작날짜를 구합니다 (월요일)
 * @param date 기준 날짜
 * @returns 해당 주의 시작날짜 (Date 객체)
 */
export const getWeekStart = (date: Date): Date => {
  return dayjs(date).startOf("week").toDate();
};

/**
 * 특정 날짜의 주 마지막날짜를 구합니다 (일요일)
 * @param date 기준 날짜
 * @returns 해당 주의 마지막날짜 (Date 객체)
 */
export const getWeekEnd = (date: Date): Date => {
  return dayjs(date).endOf("week").toDate();
};

/**
 * 특정 날짜의 주 시작날짜와 마지막날짜를 함께 구합니다
 * @param date 기준 날짜
 * @returns { start: Date, end: Date } 해당 주의 시작날짜와 마지막날짜
 */
export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: getWeekStart(date),
    end: getWeekEnd(date),
  };
};

/**
 * 최근 7일의 시작날짜를 구합니다 (7일 전)
 * @returns 최근 7일 시작날짜 (Date 객체)
 */
export const getLast7DaysStart = (): Date => {
  return dayjs().subtract(6, "day").startOf("day").toDate();
};

/**
 * 최근 7일의 마지막날짜를 구합니다 (오늘)
 * @returns 최근 7일 마지막날짜 (Date 객체)
 */
export const getLast7DaysEnd = (): Date => {
  return dayjs().endOf("day").toDate();
};

/**
 * 최근 7일의 시작날짜와 마지막날짜를 함께 구합니다
 * @returns { start: Date, end: Date } 최근 7일 시작날짜와 마지막날짜
 */
export const getLast7DaysRange = (): { start: Date; end: Date } => {
  return {
    start: getLast7DaysStart(),
    end: getLast7DaysEnd(),
  };
};
