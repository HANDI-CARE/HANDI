package com.handi.backend.dto.admin;

import com.handi.backend.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Schema(description = "기관 발행 코드 전송 요청 DTO")
@Data
public class CodeSendRequestDto {
    @NotBlank(message = "휴대폰 번호는 필수입니다")
    @Pattern(regexp = "^01[0-9][0-9]{4}[0-9]{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다 (01012345678)")
    @Schema(description = "휴대폰 번호", example = "01012345678")
    private String phoneNumber;

    @NotNull(message = "사용자의 역할은 필수입니다")
    @Schema(description = "역할", example = "EMPLOYEE")
    private Role role;
}
