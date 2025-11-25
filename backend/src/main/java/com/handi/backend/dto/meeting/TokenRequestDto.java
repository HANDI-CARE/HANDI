package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "LiveKit 토큰 요청 DTO")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TokenRequestDto {
    @Schema(description = "룸 이름", example = "123")
    private String roomName;

    @Schema(description = "참가자 이름", example = "guardian_1")
    private String participantName;
}
