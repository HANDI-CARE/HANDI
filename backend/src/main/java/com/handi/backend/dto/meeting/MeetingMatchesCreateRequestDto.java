package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingMatchesCreateRequestDto {

    @Schema(description = "간호사 PK", example = "1")
    private Integer employeeId;

    @Schema(description = "보호자 PK", example = "2")
    private Integer guardianId;

    @Schema(description = "환자 PK", example = "3")
    private Integer seniorId;

    @Schema(description = "생성 미팅 시간", example = "20250101121212")
    @Pattern(regexp = "^\\d{14}$", message = "미팅 시간은 yyyyMMddHHmmss 형식이어야 합니다")
    private String meetingTime;

    @Schema(description = "상담 제목", example =  "정기 상담")
    private String title;

    @Schema(description = "상담 분류", example = "withEmployee")
    @Pattern(regexp = "^(withEmployee|withDoctor)$", message = "상담 분류는 withEmployee 또는 withDoctor만 가능합니다")
    private String meetingType;

}
