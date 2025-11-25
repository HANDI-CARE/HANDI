package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "미팅 참가 요청 DTO")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JoinMeetingRequest {
    @Schema(description = "미팅 코드", example = "MEET123456")
    private String meetingCode;
    @Schema(description = "사용자 ID", example = "1")
    private Integer userId;
    @Schema(description = "사용자 타입", example = "guardian")
    private String userType;
}
