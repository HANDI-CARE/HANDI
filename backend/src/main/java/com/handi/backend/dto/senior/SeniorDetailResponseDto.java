package com.handi.backend.dto.senior;

import com.handi.backend.enums.Gender;
import com.handi.backend.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Schema(description = "시니어 상세 응답 DTO")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SeniorDetailResponseDto {
    @Schema(description = "시니어 ID", example = "1")
    private Integer id;

    @Schema(description = "소속기관 ID", example = "1")
    private Integer organizationId;

    @Schema(description = "소속기관명", example = "하는대학요양원")
    private String organizationName;

    @Schema(description = "시니어 이름", example = "김할머니")
    private String name;

    @Schema(description = "생년월일", example = "19300101")
    private String birthDate;

    @Schema(description = "성별", example = "FEMALE")
    private Gender gender;

    @Schema(description = "입소일자", example = "20240101")
    private String admissionDate;

    @Schema(description = "퇴소일자", example = "20241231")
    private String dischargeDate;

    @Schema(description = "기타 메모", example = "특별한 주의사항")
    private String note;

    @Schema(description = "활성 상태", example = "true")
    private Boolean isActive;

    @Schema(description = "생성일자", example = "20250806123456")
    private String createdAt;

    @Schema(description = "수정일자", example = "20250806123456")
    private String updatedAt;

    @Schema(description = "나이 (계산된 값)", example = "95")
    private Integer age;

    @Schema(description = "관련 사용자 목록")
    private List<RelatedUserDto> relatedUsers;

    @Schema(description = "관련 사용자 정보")
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RelatedUserDto {
        @Schema(description = "사용자 ID", example = "10")
        private Integer userId;

        @Schema(description = "사용자 이름", example = "김간호사")
        private String userName;

        @Schema(description = "사용자 이메일", example = "nurse@example.com")
        private String userEmail;

        @Schema(description = "휴대폰 번호", example = "01012345678")
        private String phoneNumber;

        @Schema(description = "역할 (EMPLOYEE, GUARDIAN)", example = "EMPLOYEE")
        private Role role;

        @Schema(description = "프로필 이미지 URL", example = "https://example.com/profile.jpg")
        private String profileImageUrl;

        @Schema(description = "관계 생성일자", example = "20250806123456")
        private String relationCreatedAt;
    }
}