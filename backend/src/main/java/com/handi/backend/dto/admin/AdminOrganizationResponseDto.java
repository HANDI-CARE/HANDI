package com.handi.backend.dto.admin;

import com.handi.backend.dto.organization.OrganizationResponseSimpleDto;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Schema(description = "ADMIN 모든 기관 조회 요청 DTO")
@Data
public class AdminOrganizationResponseDto {
    @Schema(description = "기관 목록")
    public List<OrganizationResponseSimpleDto> organizations;
}
