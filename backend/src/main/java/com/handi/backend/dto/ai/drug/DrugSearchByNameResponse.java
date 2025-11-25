package com.handi.backend.dto.ai.drug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "의약품 이름 검색 응답 DTO")
@Data
public class DrugSearchByNameResponse {
    @Schema(description = "검색어", example = "타이레놀")
    private String query;
    @Schema(description = "검색 결과 목록")
    private List<DrugInfoBasic> results;
    @Schema(description = "전체 검색 결과 수", example = "23")
    private int total_found;
}
