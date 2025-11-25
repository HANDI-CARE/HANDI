export type DrugDescriptionType =
  | "용법 및 용량"
  | "효능 및 효과"
  | "복약 시 주의 사항";

export interface DrugInfo {
  productName: string;
  extraInfo: string;
  dosage: string;
  manufacturer: string;
  appearance: string;
  dosageForm: string;
  description: {
    상세: {
      [key in DrugDescriptionType]: string;
    };
    키워드: {
      [key in DrugDescriptionType]: string;
    };
  } | null;
  image: string;
  category: string;
  formCodeName: string;
  thicknessMm: string;
  similarity_score: number;
}
