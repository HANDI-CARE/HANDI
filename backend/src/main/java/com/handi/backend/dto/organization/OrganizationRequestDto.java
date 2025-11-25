package com.handi.backend.dto.organization;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

@Schema(description = "소속기관 요청 DTO")
@Data
public class OrganizationRequestDto {
    @NotBlank(message = "기관명은 필수입니다.")
    @Size(min = 3, max = 25, message = "기관명은 3~25자여야 합니다.")
    @Valid()
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
}
