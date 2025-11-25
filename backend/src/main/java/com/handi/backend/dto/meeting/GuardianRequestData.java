package com.handi.backend.dto.meeting;

import com.handi.backend.enums.ConsultationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "보호자 미팅 요청 데이터")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GuardianRequestData {
    @Schema(description = "보호자 사용자 ID")
    private Integer userId;
    
    @Schema(description = "요청 가능한 시간 목록", example = "[ 20250605090000, 20250605100000 ]")
    private List<String> availableTime;

    @Schema(description = "요청 생성 시각", example = "[ 20250605090000, 20250605100000 ]")
    private String requestedAt;
    
    @Schema(description = "요청 상태", allowableValues = {"PENDING", "CONDUCTED", "CANCELED"})
    private ConsultationStatus status;
}