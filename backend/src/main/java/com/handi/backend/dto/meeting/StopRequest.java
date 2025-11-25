package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "녹화 종료 요청 DTO")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StopRequest {
    @Schema(description = "룸 이름", example = "123")
    private String roomName;
}
