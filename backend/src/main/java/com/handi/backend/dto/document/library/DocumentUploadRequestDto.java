package com.handi.backend.dto.document.library;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;


@Schema(description = "문서 업로드 요청")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadRequestDto {
    @Schema(description = "파일명", example = "혈액검사결과_2025년8월")
    private String fileName;
    
    @Schema(description = "업로드할 파일")
    private MultipartFile file;
    
    @Schema(description = "워드 박스 JSON 데이터", example = "{\"text\": \"string\", \"bounding_box\": {\"x1\": 0, \"y1\": 0, \"x2\": 0, \"y2\": 0}, \"detected_entity\": {\"word\": \"string\", \"entity\": \"string\", \"entity_type\": \"string\", \"entity_type_ko\": \"string\", \"score\": 0.1}}")
    private String word_boxes;
}
