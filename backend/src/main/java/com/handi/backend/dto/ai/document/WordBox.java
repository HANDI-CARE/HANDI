package com.handi.backend.dto.ai.document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "단어 박스 + 엔티티 정보")
@Data
public class WordBox {
    @Schema(description = "텍스트", example = "홍길동")
    private String text;
    @Schema(description = "바운딩 박스")
    private BoundingBox bounding_box;
    @Schema(description = "탐지된 엔티티")
    private DetectedEntity detected_entity;
}
