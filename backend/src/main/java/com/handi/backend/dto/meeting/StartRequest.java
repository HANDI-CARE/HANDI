package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Schema(description = "녹화 시작 요청 DTO")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StartRequest {
    @Schema(description = "룸 이름", example = "123")
    private String roomName;
}
