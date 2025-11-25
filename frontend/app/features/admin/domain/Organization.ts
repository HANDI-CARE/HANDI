export interface Organization {
  id: number;
  name: string;
  breakfastTime: string; // HHmmss
  lunchTime: string; // HHmmss
  dinnerTime: string; // HHmmss
  sleepTime: string; // HHmmss
  createdAt: Date;
  updatedAt: Date;
}
