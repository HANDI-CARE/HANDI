package com.handi.backend.dto.vital.signs;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.math.BigDecimal;

@Schema(description = "활력징후 응답")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VitalSignsResponseDto {
    @Schema(description = "활력징후 ID", example = "1")
    private Integer id;

    @Schema(description = "환자 ID", example = "1")
    private Integer seniorId;

    @Schema(description = "환자 이름", example = "김할머니")
    private String seniorName;

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

    @Schema(description = "업데이트 시간", example = "20250806230538")
    private String updatedAt;

    @Schema(description = "생성일자", example = "20250806100000")
    private String createdAt;

    @Schema(description = "측정일자", example = "20250101")
    private String measuredDate;


}
