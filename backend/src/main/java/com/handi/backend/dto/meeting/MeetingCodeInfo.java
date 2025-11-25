package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "미팅 코드 정보")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingCodeInfo {
    @Schema(description = "미팅 ID", example = "100")
    private Integer meetingId;

    @Schema(description = "간호사 사용자 ID", example = "1")
    private Integer employeeId;

    @Schema(description = "보호자 사용자 ID", example = "2")
    private Integer guardianId;

    @Schema(description = "시니어 ID", example = "10")
    private Integer seniorId;

    @Schema(description = "시니어 이름", example = "김할머니")
    private String seniorName;
}
