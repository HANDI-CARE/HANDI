package com.handi.backend.dto.senior;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Schema(description = "시니어-보호자 관계 요청 DTO")
@Data
public class SeniorGuardianRelationRequestDto {
    @NotEmpty(message = "보호자 ID 목록은 필수입니다")
    @Schema(description = "보호자 ID 목록", example = "[4, 5, 6]")
    private List<Integer> guardianIds;
}