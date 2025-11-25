import { drugApi } from "../../infrastructure/api/drugApi";
import type {
  DrugDetectResponseDto,
  DrugSearchRequestDto,
  DrugSearchResponseDto,
} from "../../infrastructure/dto/DrugDto";
import type { DrugInfo } from "../domain/DrugInfo";
import type { DrugSummary } from "../domain/DrugSummary";

export interface DrugDetectResult {
  drugCandidates: DrugInfo[];
  drugSummary: DrugSummary[];
}

export class DrugService {
  private static instance: DrugService | null = null;

  static getInstance(): DrugService {
    if (!DrugService.instance) {
      DrugService.instance = new DrugService();
    }
    return DrugService.instance;
  }

  private constructor() {}

  async searchByName(query: string, limit = 5): Promise<DrugInfo[]> {
    try {
      const params: DrugSearchRequestDto = { query, limit };
      const res: DrugSearchResponseDto = await drugApi.searchByName(params);
      return res.results.map((r) => ({ ...r }));
    } catch (error) {
      // fallback: 빈 결과
      return [];
    }
  }

  async detectByImage(file: File): Promise<DrugDetectResult> {
    try {
      const res: DrugDetectResponseDto = await drugApi.detectByImage(file);
      return {
        drugCandidates: res.drug_candidates.map((r) => ({ ...r })),
        drugSummary: res.drug_summary.map((s) => ({
          name: s.name,
          capacity: s.capacity,
        })),
      };
    } catch (error) {
      // fallback: 빈 결과
      return { drugCandidates: [], drugSummary: [] };
    }
  }
}
