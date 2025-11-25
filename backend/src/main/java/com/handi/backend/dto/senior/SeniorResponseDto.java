package com.handi.backend.dto.senior;

import com.handi.backend.enums.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Schema(description = "시니어 응답 DTO")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SeniorResponseDto {
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
}