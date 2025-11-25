package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.senior.SeniorResponseDto;
import com.handi.backend.dto.user.UserCreateRequestDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.GuardianService;
import com.handi.backend.util.PageableUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/guardians")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "✅ Guardians", description = "보호자 전용 기능")
@PreAuthorize("hasRole('GUARDIAN')")
public class GuardianController {

    private final GuardianService guardianService;

    @GetMapping("/family-members")
    @Operation(summary = "✅ 가족 구성원 조회", description = "보호하고 있는 가족 구성원(환자)들을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음 - 승인된 보호자만 접근 가능"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    public ResponseEntity<PageResponseDto<Object>> getFamilyMembers(
            @AuthenticationPrincipal Users user,
            Pageable pageable,
            @Parameter(description = "검색 키워드 (가족 구성원명에 포함된 문자열 검색)", example = "이보호자")
            @RequestParam(required = false)
            String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 이름, createdAt: 등록일)", example = "name")
            @RequestParam(defaultValue = "name")
            String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc")
            SortDirection sortDirection
    ) {
        log.info("가족 구성원 조회: guardian={}, keyword={}", user.getEmail(), keyword);

        Page<Object> familyMembers = guardianService.getFamilyMembers(
                user.getEmail(),
                keyword,
                PageableUtils.addSort(pageable, sortBy, sortDirection)
        );

        return ResponseEntity.ok().body(PageResponseDto.success("가족 구성원이 성공적으로 조회되었습니다", familyMembers));
    }

    @GetMapping("/seniors/{guardianId}")
    @Operation(summary = "✅ 보호자 시니어 목록 조회", description = "보호자가 담당하고 있는 시니어 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "보호자를 찾을 수 없음")
    })
    public ResponseEntity<PageResponseDto<SeniorResponseDto>> getGuardianSeniors(
            @AuthenticationPrincipal Users user,
            @Parameter(description = "보호자 ID", example = "1")
            @PathVariable @Min(value = 1, message = "ID는 1 이상이어야 합니다") Integer guardianId,
            Pageable pageable,
            @Parameter(description = "검색 키워드 (시니어명에 포함된 문자열 검색)", example = "김할머니")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 시니어명, admissionDate: 입소일)", example = "name")
            @RequestParam(defaultValue = "name") String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc") SortDirection sortDirection) {

        log.info("보호자 시니어 목록 조회: requestUser={}, guardianId={}, keyword={}", 
                user.getEmail(), guardianId, keyword);

        PageResponseDto<SeniorResponseDto> seniors = guardianService.getGuardianSeniors(
                user.getEmail(),
                guardianId,
                keyword,
                PageableUtils.addSort(pageable, sortBy, sortDirection)
        );

        return ResponseEntity.ok().body(seniors);
    }

    @GetMapping("/family-members/{seniorId}")
    @Operation(summary = "✅ 가족 구성원 상세 조회", description = "특정 가족 구성원의 상세 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음 - 승인된 보호자만 접근 가능"),
            @ApiResponse(responseCode = "404", description = "사용자 또는 시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<Object>> getFamilyMember(
            @AuthenticationPrincipal Users user,
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer seniorId) {
        log.info("가족 구성원 상세 조회: guardian={}, seniorId={}", user.getEmail(), seniorId);
        Object familyMember = guardianService.getFamilyMember(user.getEmail(), seniorId);
        return ResponseEntity.ok(CommonResponseDto.success(familyMember));
    }

}