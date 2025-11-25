package com.handi.backend.dto.ai.drug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Schema(description = "의약품 이름 검색 요청 DTO")
@Data
public class DrugSearchRequest {
    @NotBlank(message = "query는 필수입니다")
    @Schema(description = "검색어", example = "타이레놀")
    private String query;

    @Min(value = 1, message = "limit은 1 이상이어야 합니다")
    @Max(value = 20, message = "limit은 20 이하여야 합니다")
    @Schema(description = "최대 결과 수", example = "10")
    private int limit = 5;

}
