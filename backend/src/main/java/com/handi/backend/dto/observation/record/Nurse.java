package com.handi.backend.dto.observation.record;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Schema(description = "간호사 정보")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Nurse {
    @Schema(description = "간호사 ID", example = "1")
    private Integer id;

    @Schema(description = "간호사 이름", example = "간호사김")
    private String name;

    @Schema(description = "이메일", example = "nurse@test.com")
    private String email;

    @Schema(description = "전화번호", example = "01099999999")
    private String phoneNumber;
}
