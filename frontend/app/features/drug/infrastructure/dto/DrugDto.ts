export type DrugDescriptionTypeDto =
  | "용법 및 용량"
  | "효능 및 효과"
  | "복약 시 주의 사항";

export interface DrugInfoDto {
  productName: string;
  extraInfo: string;
  dosage: string;
  manufacturer: string;
  appearance: string;
  dosageForm: string;
  description: {
    상세: {
      [key in DrugDescriptionTypeDto]: string;
    };
    키워드: {
      [key in DrugDescriptionTypeDto]: string;
    };
  } | null;
  image: string;
  category: string;
  formCodeName: string;
  thicknessMm: string;
  similarity_score: number;
}

export interface DrugSummaryDto {
  name: string;
  capacity: string;
}

export interface DrugSearchRequestDto {
  query: string;
  limit?: number;
}

export interface DrugSearchResponseDto {
  query: string;
  results: DrugInfoDto[];
  total_found: number;
}

export interface DrugDetectResponseDto {
  drug_candidates: DrugInfoDto[];
  drug_summary: DrugSummaryDto[];
}

export interface CreateDrugRequestDto {
  medicationName: string;
  startDate: string;
  endDate: string;
  description: {
    drug_candidates: DrugInfoDto[];
  };
  medicationTimes: string[];
  drug_summary: DrugSummaryDto[];
}
