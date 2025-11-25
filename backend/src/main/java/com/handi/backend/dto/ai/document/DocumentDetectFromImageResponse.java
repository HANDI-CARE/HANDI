package com.handi.backend.dto.ai.document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "문서 이미지 분석 응답 DTO")
@Data
public class DocumentDetectFromImageResponse {
    @Schema(description = "탐지된 워드 박스 목록")
    private List<WordBox> word_boxes;
}
