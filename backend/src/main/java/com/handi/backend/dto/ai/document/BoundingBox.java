package com.handi.backend.dto.ai.document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "단어 위치 박스")
@Data
public class BoundingBox {
    @Schema(description = "좌상단 X", example = "12")
    private int x1;
    @Schema(description = "좌상단 Y", example = "45")
    private int y1;
    @Schema(description = "우하단 X", example = "210")
    private int x2;
    @Schema(description = "우하단 Y", example = "98")
    private int y2;
}
