package com.handi.backend.dto.user;

import com.handi.backend.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Schema(description = "유저 응답 DTO")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDto {
    @Schema(description = "유저 ID", example = "1")
    private Integer id;

    @Schema(description = "유저 OAuth ID", example = "1")
    private Integer oauthUserId;

    @Schema(description = "소속기관 ID", example = "1")
    private Integer organizationId;

    @Schema(description = "역할", example = "ADMIN")
    private Role role;

    @Schema(description = "이름", example = "고관리자")
    private String name;

    @Schema(description = "이메일", example = "admin@example.com")
    private String email;

    @Schema(description = "휴대폰 번호", example = "01012345678")
    private String phoneNumber;

    @Schema(description = "프로필 이미지 URL", example = "https://example.com/profile.jpg")
    private String profileImageUrl;

    @Schema(description = "주소", example = "서울시 강남구")
    private String address;

    @Schema(description = "FCM Token", example = "fcm_token_example")
    private String fcmToken;

    @Schema(description = "생성일자", example = "20250806123456")
    private String createdAt;

    @Schema(description = "수정일자", example = "20250806123456")
    private String updatedAt;

    @Schema(description = "추가 정보 기입이 필요한 경우", example = "false")
    private Boolean needsAdditionalInfo;
}
