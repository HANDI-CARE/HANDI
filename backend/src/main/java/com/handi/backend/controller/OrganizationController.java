package com.handi.backend.controller;

import com.handi.backend.dto.admin.*;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.organization.OrganizationRequestDto;
import com.handi.backend.dto.organization.OrganizationResponseDto;
import com.handi.backend.dto.organization.OrganizationResponseSimpleDto;
import com.handi.backend.dto.senior.SeniorResponseDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.Role;
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
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "Organizations", description = "소속기관 관리")
public class OrganizationController {

    private final AdminService adminService;
    private final OrganizationService organizationService;
    private final VerificationService verificationService;

    @GetMapping("/{id}")
    @Operation(summary = "기관 정보 조회", description = "기관의 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - 소속 기관이 설정되지 않음"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "사용자 또는 기관을 찾을 수 없음")
    })
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('GUARDIAN')")
    public ResponseEntity<CommonResponseDto<OrganizationResponseSimpleDto>> getOrganization(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("기관 정보 조회: id={}", id);
        OrganizationResponseSimpleDto org = organizationService.getSimpleOne(id);
        return ResponseEntity.ok().body(CommonResponseDto.success("소속 기관 정보가 성공적으로 조회되었습니다", org));
    }


    @GetMapping("/info")
    @Operation(summary = "소속 기관 정보 조회", description = "현재 소속된 기관의 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - 소속 기관이 설정되지 않음"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "사용자 또는 기관을 찾을 수 없음")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonResponseDto<OrganizationResponseDto>> getSelfOrganization(@AuthenticationPrincipal Users user) {
        log.info("소속 기관 정보 조회: id={}", user.getOrganizationId());
        OrganizationResponseDto org = organizationService.getOne(user.getOrganizationId());
        return ResponseEntity.ok().body(CommonResponseDto.success("소속 기관 정보가 성공적으로 조회되었습니다", org));
    }

    @PutMapping("/info")
    @Operation(summary = "소속 기관 정보 수정", description = "기관 정보(이름, 식사시간, 취침시간)를 수정합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "수정 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "관리자 권한 필요"), @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonResponseDto<OrganizationResponseDto>> updateOrganization(
            @AuthenticationPrincipal Users user,
            @Parameter(description = "요청 데이터")
            @Valid
            @RequestBody
            OrganizationRequestDto requestDto) {
        log.info("기관 수정 요청: id={}, requestDto={}", user.getOrganizationId(), requestDto);
        OrganizationResponseDto org = organizationService.updateOne(user.getOrganizationId(), requestDto);
        return ResponseEntity.ok().body(CommonResponseDto.success("기관 정보가 성공적으로 수정되었습니다", org));
    }

    @PostMapping("/users/code/send")
    @Operation(summary = "기관 발행 코드 전송", description = "소속기관, 역할, 휴대폰 번호를 입력하면 인증 번호가 SMS로 전송됩니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "인증 코드 전송 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")
    })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonResponseDto<CodeSendResponseDto>> sendCode(
            @AuthenticationPrincipal Users user,
            @Parameter(description = "기관 발행 코드 요청 정보")
            @Valid
            @RequestBody
            CodeSendRequestDto requestDto
    ) {
        log.info("기관 발행 코드 요청: organizationId={}, phoneNumber={}, role={}", user.getOrganizationId(), requestDto.getPhoneNumber(), requestDto.getRole());

        CodeSendResponseDto dto = verificationService.sendOrgCode(
                user.getOrganizationId(),
                requestDto.getPhoneNumber(),
                requestDto.getRole()
        );

        return ResponseEntity.ok().body(CommonResponseDto.success("기관 발행 코드가 성공적으로 전송되었습니다.", dto));
    }

    @GetMapping("/users")
    @Operation(summary = "소속 기관 사용자 목록 조회", description = "로그인 유저 소속 기관의 사용자 목록을 페이징하여 조회합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponseDto<UserResponseDto>> getSpecificOrganizationUsers(
            @AuthenticationPrincipal Users user,
            Pageable pageable,
            @Parameter(description = "검색 키워드 (사용자명에 포함된 문자열 검색)", example = "김철수")
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
            boolean includeDeleted,
            @Parameter(description = "사용자 역할 ( EMPLOYEE, GUARDIAN, null )", example = "EMPLOYEE")
            @RequestParam(defaultValue = "EMPLOYEE")
            Role role
    ) {
        log.info("소속 기관 사용자 목록 조회 요청: pageable={}, keyword={}, sortBy={}, sortDirection={}, includeDeleted={}", pageable, keyword, sortBy, sortDirection, includeDeleted);

        Page<UserResponseDto> usersPage = organizationService.getUserList(user.getOrganizationId(), keyword, PageableUtils.addSort(pageable, sortBy, sortDirection), includeDeleted, role);

        return ResponseEntity.ok().body(PageResponseDto.success(usersPage));
    }

    @GetMapping("/seniors")
    @Operation(summary = "소속 기관 환자 목록 조회", description = "로그인 유저 소속 기관의 환자 목록을 페이징하여 조회합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponseDto<SeniorResponseDto>> getOrganizationSeniors(
            @AuthenticationPrincipal Users user,
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
        log.info("기관 환자 목록 조회 요청: pageable={}, keyword={}, sortBy={}, sortDirection={}, includeDeleted={}", pageable, keyword, sortBy, sortDirection, includeDeleted);

        Page<SeniorResponseDto> seniorsPage = organizationService.getSeniorList(user.getOrganizationId(), keyword, PageableUtils.addSort(pageable, sortBy, sortDirection), includeDeleted);

        return ResponseEntity.ok().body(PageResponseDto.success(seniorsPage));
    }


    @PostMapping("/users")
    @Operation(summary = "사용자 생성", description = "로그인 유저 소속 기관에 새로운 사용자를 생성합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "등록 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음")})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonResponseDto<AdminUserResponseDto>> createUser(
            @AuthenticationPrincipal Users user,
            @Parameter(description = "요청 데이터")
            @Valid
            @RequestBody
            AdminUserCreateRequestDto requestDto) {
        log.info("관리자 사용자 생성 요청: {}", requestDto);

        AdminUserResponseDto savedUser = adminService.createUser(requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("사용자가 성공적으로 생성되었습니다", savedUser));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "사용자 상세 조회", description = "특정 사용자의 상세 정보를 조회합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE')")
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
    @Operation(summary = "사용자 정보 수정", description = "특정 사용자 정보를 수정합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "수정 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('GUARDIAN')")
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
    @Operation(summary = "사용자 삭제", description = "관리자가 사용자를 삭제합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "삭제 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CommonResponseDto<?>> deleteUser(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("관리자 사용자 삭제 요청: id={}", id);
        adminService.deleteUser(id);
        return ResponseEntity.ok().body(CommonResponseDto.success("사용자가 성공적으로 삭제되었습니다"));
    }

    @PutMapping("/users/{id}/restore")
    @Operation(summary = "삭제된 사용자 복구", description = "삭제된 사용자를 복구합니다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "복구 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")})
    @PreAuthorize("hasRole('ADMIN')")
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
