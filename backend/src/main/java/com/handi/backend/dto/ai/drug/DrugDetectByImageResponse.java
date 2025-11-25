package com.handi.backend.dto.ai.drug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "이미지에서 의약품 탐지 응답 DTO")
@Data
public class DrugDetectByImageResponse {
    @Schema(description = "탐지된 약 후보 목록")
    private List<DrugInfoBasic> drug_candidates;
    @Schema(description = "탐지된 약 요약 정보 목록")
    private List<DrugInfoSimple> drug_summary;
}
