package com.handi.backend.dto.ai.drug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "의약정보 요약 요청 DTO")
@Data
public class DrugSummaryRequest {
    @Schema(description = "요약할 항목 PK", example = "1")
    private int id;

    @Schema(description = "약물 요약 정보 목록")
    private List<DrugInfoSimple> drug_summary;

    @Schema(description = "시니어 관련 정보")
    private String note;
}
