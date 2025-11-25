package com.handi.backend.dto.senior;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SeniorMemoRequestDto {
    @Schema(description = "메모 내용", example = "당뇨 환자이므로 혈당 관리에 특별히 주의가 필요함. 매일 오후 2시경 산책을 선호하심.")
    private String note;
}
