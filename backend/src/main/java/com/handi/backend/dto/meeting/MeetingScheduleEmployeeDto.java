package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "미팅 스케줄 요청 DTO")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MeetingScheduleEmployeeDto {
    @Schema(description = "체크한 시간 목록", example = "[ 20250605090000, 20250605100000 ]")
    private List<String> checkedTime;
}