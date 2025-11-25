package com.handi.backend.controller;

import com.handi.backend.dto.admin.*;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.organization.OrganizationRequestDto;
import com.handi.backend.dto.organization.OrganizationResponseDto;
import com.handi.backend.dto.senior.SeniorResponseDto;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.AdminService;
import com.handi.backend.service.OrganizationService;
import com.handi.backend.service.VerificationService;
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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "✅ Admin", description = "한디 운영자 전용 기능")
public class AdminController {

    private final AdminService adminService;
    private final OrganizationService organizationService;


    @PostMapping
    @Operation(summary = "✅ 기관 생성 (관리자 전용)", description = "기관을 생성합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "등록 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "관리자 권한 필요")})
    public ResponseEntity<CommonResponseDto<OrganizationResponseDto>> createOrganization(
            @Parameter(description = "요청 데이터")
            @Valid
            @RequestBody
            OrganizationRequestDto requestDto) {
        log.info("기관 생성 요청: {}", requestDto);

        OrganizationResponseDto savedOrganization = organizationService.createOne(requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("기관이 성공적으로 생성되었습니다", savedOrganization));
    }

    @GetMapping("/{id}")
    @Operation(summary = "✅ 기관 정보 조회 (by id)", description = "기관 정보(이름, 식사시간, 취침시간)를 조회합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<OrganizationResponseDto>> getOrganization(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("기관 조회 요청: {}", id);
        OrganizationResponseDto org = organizationService.getOne(id);
        return ResponseEntity.ok(CommonResponseDto.success(org));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "✅ 기관 삭제 (관리자 전용)", description = "기관을 삭제합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "삭제 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "관리자 권한 필요"), @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음"), @ApiResponse(responseCode = "409", description = "삭제할 수 없음 (관련 데이터 존재)")})

    public ResponseEntity<CommonResponseDto<Integer>> deleteOrganization(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("기관 삭제 요청: id={}", id);
        organizationService.deleteOne(id);
        return ResponseEntity.ok().body(CommonResponseDto.success("기관이 성공적으로 삭제되었습니다", id));
    }

    @GetMapping
    @Operation(summary = "✅ 기관 목록 조회", description = "전체 기관 목록을 페이징하여 조회합니다. 키워드로 기관명 검색이 가능합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "500", description = "서버 오류")})
    public ResponseEntity<PageResponseDto<OrganizationResponseDto>> getOrganizations(
            Pageable pageable,
            @Parameter(description = "검색 키워드 (기관명에 포함된 문자열 검색)", example = "대한병원")
            @RequestParam(required = false)
            String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 기관명, createdAt: 생성일시)", example = "name")
            @RequestParam(defaultValue = "name")
            String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc")
            SortDirection sortDirection
    ) {
        log.info("기관 목록 조회 요청: pageable={}, keyword={}, sortBy={}, sortDirection={}", pageable, keyword, sortBy, sortDirection);

        Page<OrganizationResponseDto> organizationsPage = organizationService.getList(keyword, PageableUtils.addSort(pageable, sortBy, sortDirection));

        return ResponseEntity.ok().body(PageResponseDto.success("기관 목록이 성공적으로 조회되었습니다", organizationsPage));
    }

    @PostMapping("/users")
    @Operation(summary = "✅ 사용자 생성", description = "관리자가 새로운 사용자를 생성합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "등록 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음")})
    public ResponseEntity<CommonResponseDto<AdminUserResponseDto>> createUser(
            @Parameter(description = "요청 데이터")
            @Valid
            @RequestBody
            AdminUserCreateRequestDto requestDto) {
        log.info("관리자 사용자 생성 요청: {}", requestDto);

        AdminUserResponseDto savedUser = adminService.createUser(requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("사용자가 성공적으로 생성되었습니다", savedUser));
    }

    @GetMapping("/users")
    @Operation(summary = "✅ 전체 사용자 목록 조회", description = "관리자가 전체 사용자 목록을 조회합니다. 삭제된 사용자도 포함됩니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음")})
    public ResponseEntity<PageResponseDto<AdminUserResponseDto>> getAllUsers(
            Pageable pageable,
            @Parameter(description = "검색 키워드 (사용자명 또는 이메일에 포함된 문자열 검색)", example = "김철수")
            @RequestParam(required = false)
            String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 사용자명, email: 이메일, createdAt: 생성일시)", example = "name")
            @RequestParam(defaultValue = "name")
            String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc")
            SortDirection sortDirection,
            @Parameter(description = "삭제된 사용자 포함 여부", example = "false")
            @RequestParam(defaultValue = "false")
            boolean includeDeleted
    ) {
        log.info("관리자 전체 사용자 목록 조회 요청: pageable={}, keyword={}, sortBy={}, sortDirection={}, includeDeleted={}",
                pageable, keyword, sortBy, sortDirection, includeDeleted);

        Page<AdminUserResponseDto> usersPage = adminService.getAllUsers(keyword, PageableUtils.addSort(pageable, sortBy, sortDirection), includeDeleted);

        return ResponseEntity.ok().body(PageResponseDto.success("전체 사용자 목록이 성공적으로 조회되었습니다", usersPage));
    }

    @GetMapping("/{id}/seniors")
    @Operation(summary = "✅ 기관 환자 목록 조회", description = "해당 기관에 소속된 환자 목록을 페이징하여 조회합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")})
    public ResponseEntity<PageResponseDto<SeniorResponseDto>> getOrganizationSeniors(
            @Parameter(description = "기관 ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id,
            Pageable pageable,
            @Parameter(description = "검색 키워드 (환자명에 포함된 문자열 검색)", example = "이영희")
            @RequestParam(required = false)
            String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 이름, createdAt: 생성일시)", example = "name")
            @RequestParam(defaultValue = "name")
            String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc")
            SortDirection sortDirection,
            @Parameter(description = "삭제된 사용자 포함 여부", example = "false")
            @RequestParam(defaultValue = "false")
            boolean includeDeleted
    ) {
        log.info("기관 환자 목록 조회 요청: pageable={}, keyword={}, sortBy={}, sortDirection={}", pageable, keyword, sortBy, sortDirection);

        Page<SeniorResponseDto> seniorsPage = organizationService.getSeniorList(id, keyword, PageableUtils.addSort(pageable, sortBy, sortDirection), includeDeleted);

        return ResponseEntity.ok().body(PageResponseDto.success(seniorsPage));
    }


    @GetMapping("/users/{id}")
    @Operation(summary = "✅ 사용자 상세 조회", description = "관리자가 특정 사용자의 상세 정보를 조회합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<AdminUserResponseDto>> getUserById(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("관리자 사용자 상세 조회 요청: {}", id);
        AdminUserResponseDto user = adminService.getUserById(id);
        return ResponseEntity.ok(CommonResponseDto.success(user));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "✅ 사용자 정보 수정", description = "관리자가 사용자 정보를 수정합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "수정 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<AdminUserResponseDto>> updateUser(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id,
            @Parameter(description = "요청 데이터")
            @Valid
            @RequestBody
            AdminUserUpdateRequestDto requestDto) {
        log.info("관리자 사용자 수정 요청: id={}, requestDto={}", id, requestDto);
        AdminUserResponseDto user = adminService.updateUser(id, requestDto);
        return ResponseEntity.ok().body(CommonResponseDto.success("사용자 정보가 성공적으로 수정되었습니다", user));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "✅ 사용자 삭제", description = "관리자가 사용자를 삭제합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "삭제 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<?>> deleteUser(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("관리자 사용자 삭제 요청: id={}", id);
        adminService.deleteUser(id);
        return ResponseEntity.ok().body(CommonResponseDto.success("사용자가 성공적으로 삭제되었습니다"));
    }


    @GetMapping("/users/organization/{organizationId}")
    @Operation(summary = "✅ 기관별 사용자 목록 조회", description = "관리자가 특정 기관의 사용자 목록을 조회합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")})
    public ResponseEntity<PageResponseDto<AdminUserResponseDto>> getUsersByOrganization(
            @Parameter(description = "기관 ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "기관 ID는 1 이상이어야 합니다")
            Integer organizationId,
            Pageable pageable,
            @Parameter(description = "검색 키워드 (사용자명에 포함된 문자열 검색)", example = "김철수")
            @RequestParam(required = false)
            String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 사용자명, createdAt: 생성일시)", example = "name")
            @RequestParam(defaultValue = "name")
            String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc")
            SortDirection sortDirection
    ) {
        log.info("관리자 기관별 사용자 목록 조회 요청: organizationId={}, pageable={}, keyword={}, sortBy={}, sortDirection={}",
                organizationId, pageable, keyword, sortBy, sortDirection);

        Page<AdminUserResponseDto> usersPage = adminService.getUsersByOrganization(organizationId, keyword, PageableUtils.addSort(pageable, sortBy, sortDirection));

        return ResponseEntity.ok().body(PageResponseDto.success("기관별 사용자 목록이 성공적으로 조회되었습니다", usersPage));
    }

    @PutMapping("/users/{id}/restore")
    @Operation(summary = "✅ 삭제된 사용자 복구", description = "관리자가 삭제된 사용자를 복구합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "복구 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<AdminUserResponseDto>> restoreUser(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("관리자 사용자 복구 요청: id={}", id);
        AdminUserResponseDto user = adminService.restoreUser(id);
        return ResponseEntity.ok().body(CommonResponseDto.success("사용자가 성공적으로 복구되었습니다", user));
    }

}
