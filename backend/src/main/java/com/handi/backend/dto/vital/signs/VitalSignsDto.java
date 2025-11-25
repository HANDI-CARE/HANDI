package com.handi.backend.dto.vital.signs;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Schema(description = "활력징후 정보")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VitalSignsDto {
    @Schema(description = "활력징후 ID", example = "1")
    private Integer id;

    @Schema(description = "측정 날짜", example = "2025-08-06")
    private String date;

    @Schema(description = "수축기 혈압 (mmHg)", example = "120", nullable = true)
    private Integer systolic;

    @Schema(description = "이완기 혈압 (mmHg)", example = "80", nullable = true)
    private Integer diastolic;

    @Schema(description = "혈당 (mg/dL)", example = "100", nullable = true)
    private Integer bloodGlucose;

    @Schema(description = "체온 (°C)", example = "36.5", nullable = true)
    private BigDecimal temperature;

    @Schema(description = "키 (cm)", example = "160.0", nullable = true)
    private BigDecimal height;

    @Schema(description = "몸무게 (kg)", example = "60.0", nullable = true)
    private BigDecimal weight;
}
