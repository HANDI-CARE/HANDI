export interface ResponseDto<T> {
  success: boolean;
  message: string | null;
  result: T | null;
}

export interface OffsetPaginatedResponseDto<T> extends ResponseDto<T> {
  pageInfo: OffsetPaginationInfo;
}

export interface CursorPaginatedResponseDto<T> extends ResponseDto<T> {
  pageInfo: CursorPaginationInfo;
}

export interface OffsetPaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  empty: boolean;
}

export interface CursorPaginationInfo {
  size: number;
  nextCursor: string;
  hasNext: boolean;
}

export interface OffsetPaginatedRequestParams {
  page: number;
  size: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface CursorPaginatedRequestParams {
  cursor: number;
  size?: string;
}

export interface OffsetPaginatedWithDateRequestParams extends OffsetPaginatedRequestParams {
  startDate: string;
  endDate: string;
}

export interface OffsetPaginatedWithOptionalDateRequestParams extends OffsetPaginatedRequestParams {
  startDate?: string;
  endDate?: string;
}