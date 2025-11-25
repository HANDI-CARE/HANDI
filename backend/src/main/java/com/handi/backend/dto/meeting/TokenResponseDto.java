package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "LiveKit 토큰 응답 DTO")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponseDto {
    @Schema(description = "발급된 토큰", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;
}
