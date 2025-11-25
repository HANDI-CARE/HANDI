package com.handi.backend.dto.ai.document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "탐지된 엔티티 정보")
@Data
public class DetectedEntity {
    @Schema(description = "텍스트", example = "홍길동")
    private String word;
    @Schema(description = "엔티티", example = "PERSON")
    private String entity;
    @Schema(description = "엔티티 타입", example = "NAME")
    private String entity_type;
    @Schema(description = "엔티티 타입(한글)", example = "이름")
    private String entity_type_ko;
    @Schema(description = "신뢰도", example = "0.98")
    private double score;
}

