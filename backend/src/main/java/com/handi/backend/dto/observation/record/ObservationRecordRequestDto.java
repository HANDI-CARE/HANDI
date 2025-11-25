package com.handi.backend.dto.observation.record;

import com.handi.backend.enums.Level;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "관찰 일지 생성 / 수정 요청 DTO")
public class ObservationRecordRequestDto {
    @NotBlank(message = "관찰 내용은 필수입니다.")
    @Size(max = 5000, message = "관찰 내용은 5000자를 초과할 수 없습니다.")
    @Schema(description = "관찰 내용", example = "김시니어님이 어지러움을 호소하시며 혈압이 평소보다 높게 측정되었습니다. 즉시 담당의와 상담이 필요합니다.")
    private String content;

    @NotNull(message = "중요도는 필수입니다.")
    @Schema(description = "중요도 (HIGH:위험, MEDIUM:경고, LOW:안전)", example = "HIGH")
    private Level level;
}
