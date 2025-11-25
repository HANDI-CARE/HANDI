package com.handi.backend.dto.ai.drug;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "약물 간단 정보")
@Data
public class DrugInfoSimple {
    @Schema(description = "약물 이름", example = "팜시버정")
    private String name;
    
    @Schema(description = "용량", example = "250mg")
    private String capacity;
}
