package com.handi.backend.dto.medication;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "투약 내역 전체 조회 응답")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MedicationsResponseDto {
    @Schema(description = "투약 스케줄 ID", example = "1")
    private Integer schedulesId;

    @Schema(description = "환자 ID", example = "1")
    private Integer seniorId;

    @Schema(description = "환자 이름", example = "김할머니")
    private String seniorName;

    @Schema(description = "약물 이름", example = "아스피린")
    private String medicationName;

    @Schema(description = "투약 내역 배열")
    private List<MedicationsDto> medications = new ArrayList<>();
}
