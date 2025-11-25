package com.handi.backend.dto.senior;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Schema(description = "시니어 수정 요청 DTO")
@Data
public class SeniorUpdateRequestDto {
    @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다")
    @Schema(description = "시니어 이름", example = "김할머니")
    private String name;

    @Schema(description = "퇴소일자", example = "20241231")
    private String dischargeDate;
    
    @Size(max = 1000, message = "메모는 1000자 이하여야 합니다")
    @Schema(description = "기타 메모", example = "특별한 주의사항")
    private String note;

    @Schema(description = "활성 상태 (true: 재원, false: 퇴소)", example = "true")
    private Boolean isActive;
}