package com.handi.backend.dto.observation.record;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Schema(description = "보호자 정보")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Guardian {
    @Schema(description = "보호자 ID", example = "2")
    private Integer id;

    @Schema(description = "보호자 이름", example = "보호자김")
    private String name;

    @Schema(description = "이메일", example = "guardian.kim@test.com")
    private String email;

    @Schema(description = "전화번호", example = "01011111111")
    private String phoneNumber;
}
