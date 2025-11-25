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
@Schema(description = "관찰 일지 간단 정보 응답 DTO")
public class ObservationRecordResponseSimpleDto {
    
    @Schema(description = "관찰 일지 ID", example = "1")
    private Integer id;

    @Schema(description = "관찰 내용", example = "환자분이 오늘 컨디션이 좋아 보이시고 식사량도 늘었습니다.")
    private String content;

    @Schema(description = "중요도 (HIGH:위험, MEDIUM:경고, LOW:안전)", example = "LOW")
    private Level level;
}
