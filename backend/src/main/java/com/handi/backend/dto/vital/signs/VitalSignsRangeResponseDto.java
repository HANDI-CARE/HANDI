package com.handi.backend.dto.vital.signs;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "활력징후 범위 조회 응답")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VitalSignsRangeResponseDto {

    @Schema(description = "환자 ID", example = "1")
    private Integer seniorId;

    @Schema(description = "환자 이름", example = "김할머니")
    private String seniorName;

    @Schema(description = "활력징후 배열")
    private List<VitalSignsDto> signs = new ArrayList<>();

}
