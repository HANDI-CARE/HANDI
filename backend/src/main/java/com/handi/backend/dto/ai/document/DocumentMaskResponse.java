package com.handi.backend.dto.ai.document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class DocumentMaskResponse {
    @Schema(description = "마스킹된 이미지 바이너리")
    private byte[] imageData;
    @Schema(description = "파일명", example = "masked_20250807_100000.png")
    private String filename;
    @Schema(description = "콘텐츠 타입", example = "image/png")
    private String contentType;
}
