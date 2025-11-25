package com.handi.backend.dto.organization;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Schema(description = "소속기관 응답 DTO")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationResponseDto {
    @Schema(description = "소속기관 ID", example = "1")
    private Integer id;

    @Schema(description = "소속기관명", example = "하는대학요양원")
    private String name;

    @Schema(description = "아침시간", example = "080000")
    private String breakfastTime;

    @Schema(description = "점심시간", example = "123000")
    private String lunchTime;

    @Schema(description = "저녁시간", example = "180000")
    private String dinnerTime;

    @Schema(description = "취침시간", example = "213000")
    private String sleepTime;

    @Schema(description = "생성일자", example = "20220202020202")
    private String createdAt;

    @Schema(description = "수정일자", example = "20220202020202")
    private String updatedAt;
}
