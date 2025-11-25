package com.handi.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "기관 발행 코드 검증 요청 DTO")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeVerificationRequestDto {
    @Schema(description = "입력된 코드", example = "123456")
    private String userInputCode;
}
