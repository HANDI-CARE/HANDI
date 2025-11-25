package com.handi.backend.dto.organization;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Schema(description = "소속기관 응답 DTO")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationResponseSimpleDto {
    @Schema(description = "소속기관 ID", example = "1")
    private Integer id;

    @Schema(description = "소속기관명", example = "하는대학요양원")
    private String name;

    @Schema(description = "생성일자")
    private String createdAt;

    @Schema(description = "수정일자")
    private String updatedAt;
}
