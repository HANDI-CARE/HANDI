package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "녹화 관련 요청 DTO")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecordingRequest {
    @Schema(description = "상담 ID", example = "100")
    private Integer meetingId;
    @Schema(description = "미팅 코드", example = "MEET123456")
    private String meetingCode;
}
