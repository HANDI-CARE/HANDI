export interface Organization {
  id: number;
  name: string;
  breakfastTime: string; // HHmmss (기관 기준 고정 문자열)
  lunchTime: string;
  dinnerTime: string;
  sleepTime: string;
  createdAt: Date;
  updatedAt: Date;
}
