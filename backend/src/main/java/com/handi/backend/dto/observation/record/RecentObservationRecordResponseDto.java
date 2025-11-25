package com.handi.backend.dto.observation.record;

import com.handi.backend.enums.Level;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "최근 관찰 일지 응답 DTO")
public class RecentObservationRecordResponseDto {
    
    @Schema(description = "관찰 일지 ID", example = "1")
    private Integer id;

    @Schema(description = "시니어 정보")
    private Senior senior;

    @Schema(description = "관찰 내용", example = "박할아님이 갑자기 기침을 많이 하시고 숨가쁨을 호소하셨습니다. 호흡기 검사가 필요할 것 같습니다.")
    private String content;

    @Schema(description = "중요도 (HIGH:위험, MEDIUM:경고, LOW:안전)", example = "HIGH")
    private Level level;

    @Schema(description = "생성 시각", example = "20250806171406")
    private String createdAt;

    @Schema(description = "수정 시각", example = "20250806171406")
    private String updatedAt;

    @Schema(description = "삭제 여부", example = "false")
    private Boolean isDeleted;

    @Schema(description = "간호사 정보")
    private Nurse nurse;

    @Schema(description = "보호자 정보")
    private Guardian guardian;

    @Schema(description = "마지막 병원 방문일자", example = "20250730171406")
    private String lastHospitalVisit;
}
