package com.handi.backend.dto.document.library;


import com.handi.backend.dto.observation.record.Senior;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "문서 응답")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponseDto {
    @Schema(description = "문서 ID", example = "3")
    private Integer documentId;

    @Schema(description = "환자 정보")
    private Senior senior;

    @Schema(description = "문서 이름", example = "처방전 - 당뇨약")
    private String documentName;

    @Schema(description = "원본 사진 경로", example = "http://localhost:9000/handi-documents/senior_1/documents_68/20250806_214959_travi_1.png")
    private String originalPhotoPaths;

    @Schema(description = "업로드 시간", example = "20250803015245")
    private String uploadedAt;

    @Schema(description = "생성일자", example = "20250803015245")
    private String createdAt;

    @Schema(description = "수정일자", example = "20250803015245")
    private String updatedAt;
}
