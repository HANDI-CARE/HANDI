import type {
  CursorPaginationInfo,
  OffsetPaginationInfo,
} from "../infrastructure/api/dto";

export interface OffsetPaginated<T> {
  pageInfo: OffsetPaginationInfo;
  data: T;
}

export interface CursorPaginated<T> {
  pageInfo: CursorPaginationInfo;
  data: T;
}
