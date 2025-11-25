package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.senior.SeniorResponseDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.dto.organization.OrganizationResponseDto;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.EmployeeService;
import com.handi.backend.service.UserService;
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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "✅ Employees", description = "기관 직원 전용 기능")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final UserService userService;

    @GetMapping("/colleagues")
    @Operation(summary = "✅ 동료 직원 목록 조회", description = "같은 기관의 다른 직원들을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음 - 승인된 직원만 접근 가능"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    public ResponseEntity<PageResponseDto<UserResponseDto>> getColleagues(
            @AuthenticationPrincipal Users user,
            Pageable pageable,
            @Parameter(description = "검색 키워드 (직원명에 포함된 문자열 검색)", example = "김철수")
            @RequestParam(required = false)
            String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 직원명, createdAt: 입사일)", example = "name")
            @RequestParam(defaultValue = "name")
            String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc")
            SortDirection sortDirection
    ) {
        log.info("동료 직원 목록 조회: requestUser={}, keyword={}", user.getEmail(), keyword);

        Page<UserResponseDto> colleagues = employeeService.getColleagues(
                user.getEmail(),
                keyword,
                PageableUtils.addSort(pageable, sortBy, sortDirection)
        );

        return ResponseEntity.ok().body(PageResponseDto.success("동료 직원 목록이 성공적으로 조회되었습니다", colleagues));
    }

    @GetMapping("/colleagues/{id}")
    @Operation(summary = "✅ 동료 직원 상세 조회", description = "같은 기관의 특정 직원 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - 같은 기관 직원이 아님"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "직원을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<UserResponseDto>> getColleague(
            @AuthenticationPrincipal Users user,
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("동료 직원 상세 조회: requestUser={}, targetId={}", user.getEmail(), id);
        UserResponseDto colleague = employeeService.getColleague(user.getEmail(), id);
        return ResponseEntity.ok(CommonResponseDto.success(colleague));
    }

    @GetMapping("/seniors")
    @Operation(summary = "✅ 담당 환자 목록 조회", description = "담당하고 있는 환자들의 목록을 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음 - 승인된 직원만 접근 가능"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    public ResponseEntity<PageResponseDto<SeniorResponseDto>> getAssignedSeniors(
            @AuthenticationPrincipal Users user,
            Pageable pageable,
            @Parameter(description = "검색 키워드 (환자명에 포함된 문자열 검색)", example = "김할머니")
            @RequestParam(required = false)
            String keyword,
            @Parameter(description = "정렬 기준 필드 (name: 환자명, createdAt: 등록일)", example = "name")
            @RequestParam(defaultValue = "name")
            String sortBy,
            @Parameter(description = "정렬 방향", example = "asc")
            @RequestParam(defaultValue = "asc")
            SortDirection sortDirection
    ) {
        log.info("담당 환자 목록 조회: employee={}, keyword={}", user.getEmail(), keyword);

        PageResponseDto<SeniorResponseDto> seniors = employeeService.getAssignedSeniors(
                user.getEmail(),
                keyword,
                PageableUtils.addSort(pageable, sortBy, sortDirection)
        );

        return ResponseEntity.ok().body(seniors);
    }

    // TODO Organization 옮기기
    @GetMapping("/organization/info")
    @Operation(summary = "✅ 소속 기관 정보 조회", description = "현재 소속된 기관의 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - 소속 기관이 설정되지 않음"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "사용자 또는 기관을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<OrganizationResponseDto>> getOrganizationInfo(@AuthenticationPrincipal Users user) {
        log.info("소속 기관 정보 조회: employee={}", user.getEmail());
        OrganizationResponseDto organizationInfo = userService.getOrganizationInfo(user.getEmail());
        return ResponseEntity.ok(CommonResponseDto.success("소속 기관 정보가 성공적으로 조회되었습니다", organizationInfo));
    }

    // TODO 소속 기관 정보 등록 ex) 아침, 점심 등


}