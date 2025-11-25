package com.handi.backend.dto.observation.record;

import com.handi.backend.enums.Level;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "관찰 일지 전체 정보 응답 DTO")
public class ObservationRecordResponseFullDto {
    
    @Schema(description = "관찰 일지 ID", example = "1")
    private Integer id;

    @Schema(description = "시니어 정보")
    private Senior senior;

    @Schema(description = "관찰 내용", example = "김시니어님이 어지러움을 호소하시며 혈압이 평소보다 높게 측정되었습니다. 즉시 담당의와 상담이 필요합니다.")
    private String content;

    @Schema(description = "중요도 (HIGH:위험, MEDIUM:경고, LOW:안전)", example = "HIGH")
    private Level level;

    @Schema(description = "생성 시각", example = "20250806235001")
    private String createdAt;

    @Schema(description = "수정 시각", example = "20250806235001")
    private String updatedAt;

    @Schema(description = "삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "간호사 정보")
    private Nurse nurse;

    @Schema(description = "보호자 정보")
    private Guardian guardian;
}
