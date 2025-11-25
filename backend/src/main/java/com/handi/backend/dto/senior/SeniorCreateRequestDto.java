package com.handi.backend.dto.senior;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.handi.backend.enums.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Schema(description = "시니어 생성 요청 DTO")
@Data
public class SeniorCreateRequestDto {
    @NotNull(message = "소속기관 ID는 필수입니다")
    @Schema(description = "소속기관 ID", example = "1")
    private Integer organizationId;

    @NotBlank(message = "이름은 필수입니다")
    @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다")
    @Schema(description = "시니어 이름", example = "김할머니")
    private String name;

    @NotNull(message = "생년월일은 필수입니다")
    @Past(message = "생년월일은 과거 날짜여야 합니다")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(description = "생년월일", example = "1930-01-01")
    private LocalDate birthDate;

    @NotNull(message = "성별은 필수입니다")
    @Schema(description = "성별 (MALE, FEMALE)", example = "FEMALE")
    private Gender gender;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Schema(description = "입소일자", example = "2024-01-01")
    private LocalDate admissionDate;

    @Size(max = 1000, message = "메모는 1000자 이하여야 합니다")
    @Schema(description = "기타 메모", example = "특별한 주의사항")
    private String note;
}