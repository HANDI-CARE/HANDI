package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "매칭된 미팅 정보")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchedMeeting {
    @Schema(description = "간호사 사용자 ID")
    private Integer employeeId;
    
    @Schema(description = "보호자 사용자 ID")
    private Integer guardianId;
    
    @Schema(description = "시니어 ID")
    private Integer seniorId;
    
    @Schema(description = "매칭된 미팅 시간", example = "20250605100000")
    private String meetingTime;
    
    @Schema(description = "매칭된 시각", example = "20250605090000")
    private String matchedAt;
}