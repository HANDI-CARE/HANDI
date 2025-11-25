package com.handi.backend.dto.user;

import com.handi.backend.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "기관 발행 코드 검증 응답 DTO")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeVerificationResponseDto {
    @Schema(description = "휴대폰 번호", example = "01012341234")
    private String phoneNumber;

    @Schema(description = "기관 ID", example = "1")
    private Integer organizationId;

    @Schema(description = "역할", example = "EMPLOYEE")
    private Role role;

    @Schema(description = "기관 이름", example = "한디요양원")
    private String organizationName;
}
