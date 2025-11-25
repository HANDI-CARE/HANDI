package com.handi.backend.dto.ai.document;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Schema(description = "문서 마스킹 요청 DTO")
@Data
@AllArgsConstructor
public class DocumentMaskRequest {
    @Schema(description = "이미지 파일")
    private MultipartFile file;
    @Schema(description = "워드 박스 JSON", example = "{...}")
    private String word_boxes;
}
