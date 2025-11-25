package com.handi.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Schema(description = "기관 발행 코드 생성 응답 DTO")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeSendResponseDto {
    @Schema(description = "기관 ID", example = "1")
    private Integer organizationId;

    @Schema(description = "만료 기한", example = "1800")
    private Integer expiresIn;

    // ISO 8601 형식
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Schema(description = "만료 시각", example = "2025-08-06T12:39:56")
    private LocalDateTime expiresAt;

    @Schema(description = "보조 유저 메시지", example = "카카오톡으로 초대 링크를 확인해주세요")
    private String userMessage;
}
