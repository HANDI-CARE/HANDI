package com.handi.backend.dto.user;

import com.handi.backend.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

@Schema(description = "사용자 생성 요청 DTO")
@Data
public class UserCreateRequestDto {
    @Schema(description = "소속기관 ID", example = "1")
    private Integer organizationId;

    @Schema(description = "역할", example = "EMPLOYEE")
    private Role role;

    @NotBlank(message = "이름은 필수입니다")
    @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다")
    @Schema(description = "이름", example = "최요양사")
    private String name;

    @NotBlank(message = "휴대폰 번호는 필수입니다")
    @Pattern(regexp = "^01[0-9][0-9]{4}[0-9]{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다 (01012345678)")
    @Schema(description = "휴대폰 번호", example = "01012345678")
    private String phoneNumber;

    @Schema(description = "프로필 이미지 URL", example = "https://example.com/profile.jpg")
    private String profileImageUrl;

    @Schema(description = "주소", example = "서울시 강남구")
    private String address;

}
