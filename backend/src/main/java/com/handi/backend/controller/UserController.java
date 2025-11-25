package com.handi.backend.controller;

import com.handi.backend.dto.organization.OrganizationResponseSimpleDto;
import com.handi.backend.dto.user.*;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.organization.OrganizationResponseDto;
import com.handi.backend.entity.Users;
import com.handi.backend.service.OrganizationService;
import com.handi.backend.service.UserService;
import com.handi.backend.service.VerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "✅ Users", description = "공통 사용자 기능")
public class UserController {

    private final UserService userService;
    private final VerificationService verificationService;
    private final OrganizationService organizationService;

    @GetMapping("/{id}")
    @Operation(summary = "기관 정보 조회", description = "기관의 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - 소속 기관이 설정되지 않음"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "사용자 또는 기관을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<OrganizationResponseSimpleDto>> getOrganization(
            @Parameter(description = "ID", example = "1")
            @PathVariable
            @Min(value = 1, message = "ID는 1 이상이어야 합니다")
            Integer id) {
        log.info("기관 정보 조회: id={}", id);
        OrganizationResponseSimpleDto org = organizationService.getSimpleOne(id);
        return ResponseEntity.ok().body(CommonResponseDto.success("소속 기관 정보가 성공적으로 조회되었습니다", org));
    }

    @GetMapping("/me")
    @Operation(summary = "✅ 내 정보 조회", description = "현재 로그인한 사용자의 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<UserResponseDto>> getUserMe(
            @RequestAttribute("oauthUserId") Integer oauthUserId,
            @RequestAttribute("email") String email) {
        log.info("내 정보 조회 요청: email={}", email);
        return ResponseEntity.ok().body(CommonResponseDto.success(userService.getUserMeByEmail(email)));
    }

    @PostMapping("/me")
    @Operation(summary = "✅ 내 정보 초기 설정", description = "현재 로그인한 사용자의 정보를 초기 설정합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "409", description = "이미 존재하는 사용자")
    })
    public ResponseEntity<CommonResponseDto<UserResponseDto>> createUserMe(
            @RequestAttribute("oauthUserId") Integer oauthUserId,
            @RequestAttribute("email") String email,
            @Parameter(description = "사용자 정보") @Valid @RequestBody UserCreateRequestDto requestDto) {
        log.info("내 정보 초기 설정 요청: email={}, requestDto={}", email, requestDto);
        UserResponseDto res = userService.createUserMe(oauthUserId, email, requestDto);
        return ResponseEntity.ok().body(CommonResponseDto.success("정보가 성공적으로 생성되었습니다", res));
    }

    @PutMapping("/me")
    @Operation(summary = "✅ 내 정보 수정", description = "현재 로그인한 사용자의 정보를 수정합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @PreAuthorize("hasRole('ADMIN') or hasRole('EMPLOYEE') or hasRole('GUARDIAN')")
    public ResponseEntity<CommonResponseDto<UserResponseDto>> updateUserMe(
            @AuthenticationPrincipal Users user,
            @Parameter(description = "사용자 수정 정보") @Valid @RequestBody UserCreateRequestDto requestDto) {
        log.info("내 정보 수정 요청: email={}, requestDto={}", user.getEmail(), requestDto);
        UserResponseDto res = userService.updateUserMe(user.getEmail(), requestDto);
        return ResponseEntity.ok().body(CommonResponseDto.success("정보가 성공적으로 수정되었습니다", res));
    }

    @PostMapping("/code/verify")
    @Operation(summary = "✅ 기관 발행 코드 확인 요청", description = "기관 발행 코드를 입력하여 검증을 진행하고, 소속기관과 역할을 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "인증 코드 확인 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "422", description = "인증 코드 불일치")
    })
    public ResponseEntity<CommonResponseDto<CodeVerificationResponseDto>> verifyOrgCode(
            @RequestAttribute("oauthUserId") Integer oauthUserId,
            @RequestAttribute("email") String email,
            @Parameter(description = "인증 코드 확인 정보") @Valid @RequestBody CodeVerificationRequestDto requestDto) {
        log.info("인증 코드 확인 요청");
        CodeVerificationResponseDto res = verificationService.verifyCode(requestDto.getUserInputCode());
        return ResponseEntity.ok().body(CommonResponseDto.success(res));
    }

    @GetMapping("/organization/info")
    @Operation(summary = "✅ 소속 기관 정보 조회", description = "현재 소속된 기관의 정보를 조회합니다. (직원, 보호자 공용)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "기관 정보를 찾을 수 없음")
    })
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('GUARDIAN')")
    public ResponseEntity<CommonResponseDto<OrganizationResponseDto>> getOrganizationInfo(@AuthenticationPrincipal UserDetails userDetails) {
        log.info("소속 기관 정보 조회: user={}", userDetails.getUsername());
        OrganizationResponseDto organizationInfo = userService.getOrganizationInfo(userDetails.getUsername());
        return ResponseEntity.ok(CommonResponseDto.success("소속 기관 정보가 성공적으로 조회되었습니다", organizationInfo));
    }

    @PostMapping("/me/token")
    @Operation(summary = "✅ 내 FCM 토큰 추가", description = "현재 로그인된 사용자의 FCM 토큰을 추가합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "추가 성공"),
            @ApiResponse(responseCode = "400", description = "FCM Token이 없음"),
            @ApiResponse(responseCode = "401", description = "인증 실패")
    })
    public ResponseEntity<CommonResponseDto<UserResponseDto>> updateUserFcmToken(
            @RequestBody UserTokenRequestDto userTokenRequestDto,
            @AuthenticationPrincipal Users user
    ) {
        log.info("내 FCM 토큰 수정 요청: email={}, requestDto={}", user.getEmail(), userTokenRequestDto);
        UserResponseDto response = userService.updateFcmToken(user, userTokenRequestDto);
        return ResponseEntity.ok().body(CommonResponseDto.success("토큰이 성공적으로 추가 되었습니다.", response));
    }

    @DeleteMapping("/me/token")
    @Operation(summary = "✅ 내 FCM 토큰 삭제", description = "현재 로그인된 사용자의 FCM 토큰을 삭제합니다.")
    public ResponseEntity<CommonResponseDto<?>> deleteUserFcmToken(
            @AuthenticationPrincipal Users user
    ) {
        log.info("내 FCM 토큰 삭제: email={}", user.getEmail());
        userService.deleteFcmToken(user);
        return ResponseEntity.ok().body(CommonResponseDto.success("토큰이 성공적으로 삭제되었습니다."));
    }

    @DeleteMapping("/me")
    @Operation(summary = "✅ 회원 탈퇴", description = "회원 탈퇴합니다.")
    public ResponseEntity<CommonResponseDto<?>> deleteUserMe(
            @AuthenticationPrincipal Users user
    ) {
        log.info("회원 탈퇴: email={}", user.getEmail());
        userService.deleteUserMe(user.getEmail());
        return ResponseEntity.ok().body(CommonResponseDto.success("회원 탈퇴가 처리되었습니다."));
    }
}
