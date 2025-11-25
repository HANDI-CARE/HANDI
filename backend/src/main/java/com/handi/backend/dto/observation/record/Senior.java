package com.handi.backend.dto.observation.record;

import com.handi.backend.enums.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "환자 정보")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Senior {
    @Schema(description = "환자 ID", example = "1")
    private Integer id;
    
    @Schema(description = "환자 이름", example = "이할머니")
    private String name;
    
    @Schema(description = "성별", example = "FEMALE")
    private Gender gender;
    
    @Schema(description = "메모", example = "당뇨 관리 중인 환자")
    private String note;
    
    @Schema(description = "나이", example = "78")
    private Integer age;
}
