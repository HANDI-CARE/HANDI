package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Schema(description = "간호사 스케줄 데이터")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeScheduleData {
    @Schema(description = "담당 시니어 ID 목록")
    private List<Integer> seniors;
    
    @Schema(description = "가능한 시간 목록", example = "[ 20250605090000, 20250605100000 ]")
    private List<String> availableTime;
    
    @Schema(description = "생성 시각")
    private String createdAt;
    
    @Schema(description = "만료 시각")
    private String expiresAt;
}