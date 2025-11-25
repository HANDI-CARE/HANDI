package com.handi.backend.dto.senior;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Schema(description = "시니어-직원 관계 요청 DTO")
@Data
public class SeniorEmployeeRelationRequestDto {
    @NotEmpty(message = "직원 ID 목록은 필수입니다")
    @Schema(description = "직원 ID 목록", example = "[1, 2, 3]")
    private List<Integer> employeeIds;
}