package com.handi.backend.controller;

import com.handi.backend.entity.OauthUsers;
import com.handi.backend.entity.Organizations;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.Role;
import com.handi.backend.enums.SocialProvider;
import com.handi.backend.repository.OauthUsersRepository;
import com.handi.backend.repository.OrganizationsRepository;
import com.handi.backend.repository.UsersRepository;
import com.handi.backend.service.AuthService;
import com.handi.backend.util.CookieUtil;
import com.handi.backend.util.JwtTokenProvider;
import io.jsonwebtoken.Jwts;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Date;

@RestController
@RequestMapping("/mock-oauth")
@RequiredArgsConstructor
@Slf4j
@Tag(name="Mock OAuth", description = "가짜 OAuth 계정을 만들어 테스트를 진행할 수 있습니다.")
public class MockAuthController {

    private final OrganizationsRepository organizationsRepository;
    private final OauthUsersRepository oauthUsersRepository;
    private final UsersRepository usersRepository;
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    /**
     * Mock OAuth 로그인 - 이메일만으로 간단 인증
     * /mock-oauth?email=test@example.com&name=김예시&profileImageUrl
     * redirectUri가 없으면 접속한 도메인으로 자동 설정
     */
    @GetMapping
    @Operation(summary = "Mock OAuth 로그인", description = "email만으로 OAuth 로그인 플로우를 모의합니다. 선택적으로 name, phoneNumber, profileImageUrl, redirectUri를 제공할 수 있습니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "302", description = "리다이렉트 성공"),
            @ApiResponse(responseCode = "500", description = "로그인 실패")
    })
    public void mockOAuthLogin(
            @Parameter(description = "사용자 이메일", example = "test@example.com", required = true)
            @RequestParam String email,
            @Parameter(description = "사용자 이름(선택)", example = "김예시")
            @RequestParam(required = false) String name,
            @Parameter(description = "휴대폰 번호(선택)", example = "01012345678")
            @RequestParam(required = false) String phoneNumber,
            @Parameter(description = "프로필 이미지 URL(선택)", example = "https://example.com/profile.jpg")
            @RequestParam(required = false) String profileImageUrl,
            @Parameter(description = "로그인 후 리다이렉트할 URI(선택)", example = "http://localhost:5173")
            @RequestParam(required = false) String redirectUri,
            HttpServletRequest request,
            HttpServletResponse response) {

        try {
            // 1. 기존 사용자 조회 또는 생성
            Object userOrOAuthUser = findOrCreateMockUser(email, name, phoneNumber, profileImageUrl);

            log.info("email={}", email);

            // 2. 토큰 생성 및 쿠키 설정
            setMockAuthCookies(response, userOrOAuthUser);

            // 3. redirectUri가 없으면 접속한 도메인으로 설정
            String targetUrl;
            if (redirectUri != null && !redirectUri.isEmpty()) {
                targetUrl = redirectUri;
            } else {
                // 실제 접속한 호스트 정보 추출 (ngrok 등을 위해)
                String scheme = request.getScheme();
                String host = request.getHeader("Host");
                targetUrl = scheme + "://" + host;

                targetUrl += "/mock-oauth/index.html";
            }

            response.sendRedirect(targetUrl);

            log.info("Mock OAuth 로그인 성공: email={}", email);

        } catch (Exception e) {
            log.error("Mock OAuth 로그인 실패: email={}, error={}", email, e.getMessage());
            try {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "로그인 실패");
            } catch (Exception ex) {
                log.error("에러 응답 전송 실패", ex);
            }
        }
    }

    /**
     * 기존 사용자 조회 또는 Mock 사용자 생성
     */
    private Object findOrCreateMockUser(String email, String name, String phoneNumber, String profileImageUrl) {
        // 1. OAuthUser 테이블에서 이메일로 조회
        OauthUsers existingOAuthUser = oauthUsersRepository.findByEmail(email).orElse(null);

        // 2. 신규 사용자 생성
        if (existingOAuthUser == null) {
            log.info("Mock 사용자 생성: email={}", email);
            OauthUsers oauthUser = new OauthUsers();
            oauthUser.setSocialProvider(SocialProvider.MOCK);
            oauthUser.setProviderUserId("mock_" + email.hashCode());
            oauthUser.setEmail(email);
            oauthUser.setName(name != null ? name : ("MOCK USER " + email.split("@")[0]));
            oauthUser.setPhoneNumber(phoneNumber != null ? phoneNumber : "01012341234");
            oauthUser.setProfileImageUrl(profileImageUrl != null ? profileImageUrl : "https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");
            oauthUsersRepository.save(oauthUser);
            return oauthUser;
        }

        // 3. Users 테이블에서 완전한 사용자 조회
        Users existingUser = usersRepository.findByOauthUser(existingOAuthUser).orElse(null);

        if (existingUser == null) {
            log.info("임시 사용자 로그인: email={}", email);
            return existingOAuthUser;
        }

        log.info("완전한 사용자 로그인: email={}", email);
        return existingUser;
    }

    /**
     * Mock 인증 쿠키 설정 (기존 CustomSuccessHandler 로직 재사용)
     */
    private void setMockAuthCookies(HttpServletResponse response, Object userOrOAuthUser) {
        try {
            Integer oauthUserId;
            Integer userId;
            String email;
            String name;
            String phoneNumber;
            String profileImageUrl;
            boolean needsAdditionalInfo;

            if (userOrOAuthUser instanceof OauthUsers oauthUser) {
                // 임시 사용자
                oauthUserId = oauthUser.getId();
                userId = null;
                email = oauthUser.getEmail();
                name = oauthUser.getName();
                phoneNumber = oauthUser.getPhoneNumber();
                profileImageUrl = oauthUser.getProfileImageUrl();
                needsAdditionalInfo = true;
            } else {
                // 완전한 사용자
                Users user = (Users) userOrOAuthUser;
                oauthUserId = user.getOauthUser().getId();
                userId = user.getId();
                email = user.getEmail();
                name = user.getName();
                phoneNumber = user.getPhoneNumber();
                profileImageUrl = user.getProfileImageUrl();
                needsAdditionalInfo = user.getRole() == null;
            }

            // 토큰 생성 (CustomSuccessHandler와 동일한 로직)
            Date now = new Date();
            Date expiration = new Date(now.getTime() + jwtTokenProvider.getAccessTokenExpiration());

            String accessToken = Jwts.builder()
                                     .subject(email)
                                     .claim("type", "access")
                                     .claim("oauthUserId", oauthUserId)
                                     .claim("userId", userId)
                                     .claim("name", name)
                                     .claim("phoneNumber", phoneNumber)
                                     .claim("profileImageUrl", profileImageUrl)
                                     .claim("needsAdditionalInfo", needsAdditionalInfo)
                                     .issuedAt(now)
                                     .expiration(expiration)
                                     .signWith(jwtTokenProvider.getSecretKey())
                                     .compact();

            String refreshToken = jwtTokenProvider.generateRefreshToken(oauthUserId);

            // Redis에 저장
            authService.storeRefreshToken(refreshToken, oauthUserId);

            // 쿠키 설정
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(false);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(cookieUtil.getAccessTokenExpiration());
            response.addCookie(accessTokenCookie);

            cookieUtil.createRefreshTokenCookie(response, refreshToken);

            log.info("Mock 토큰 생성 및 쿠키 설정 완료: oauthUserId={}", oauthUserId);

        } catch (Exception e) {
            log.error("Mock 쿠키 설정 중 오류: {}", e.getMessage());
            throw new RuntimeException("토큰 생성 실패: " + e.getMessage());
        }
    }

    /**
     * Mock 사용자 목록 조회 (테스트용)
     */
    @GetMapping("/users")
    @Operation(summary = "Mock 사용자 로그인 링크 페이지", description = "현재 도메인 기준으로 샘플 로그인 링크를 제공하는 HTML 페이지를 반환합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "페이지 반환 성공")
    })
    public String getMockUsers(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getHeader("Host");
        String baseUrl = scheme + "://" + host;

        return String.format("""  
                <h2>Mock OAuth 테스트</h2>
                <p>아래 링크를 클릭하여 테스트하세요 (현재 도메인: %s):</p>
                <ul>
                    <li><a href="%s/mock-oauth?email=test1@example.com">test1@example.com 로그인</a></li>
                    <li><a href="%s/mock-oauth?email=test2@example.com">test2@example.com 로그인</a></li>
                    <li><a href="%s/mock-oauth?email=admin@example.com">admin@example.com 로그인</a></li>
                </ul>
                <p>커스텀 이메일: <code>%s/mock-oauth?email=your@email.com</code></p>
                <p>redirectUri 지정: <code>%s/mock-oauth?email=your@email.com&redirectUri=http://example.com</code></p>
                """, host, baseUrl, baseUrl, baseUrl, baseUrl, baseUrl);
    }

    @PostMapping("/create-admin")
    @Operation(summary = "Admin 계정 생성", description = "ADMIN 계정을 생성합니다. DB초기화 후 관리자 복구용입니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Admin 계정 생성 성공"),
            @ApiResponse(responseCode = "400", description = "이미 존재하는 계정"),
            @ApiResponse(responseCode = "500", description = "생성 실패")
    })
    public String createAdminAccount() {
        try {
            String adminEmail = "admin@test.com";

            // 기존 계정 확인
            if (oauthUsersRepository.findByEmail(adminEmail).isPresent()) {
                return "이미 admin@test.com 계정이 존재합니다.";
            }

            Organizations org = new Organizations();
            org.setName("한디요양원");
            org.setCreatedAt(LocalDateTime.now());
            org.setUpdatedAt(LocalDateTime.now());
            org.setIsDeleted(false);
            org.setBreakfastTime(LocalTime.of(8,0,0));
            org.setLunchTime(LocalTime.of(12,0,0));
            org.setDinnerTime(LocalTime.of(18,0,0));
            org.setSleepTime(LocalTime.of(22,0,0));
            organizationsRepository.save(org);

            Organizations nowOrg = organizationsRepository.findByName(org.getName());

            // OAuthUser 생성
            OauthUsers oauthUser = new OauthUsers();
            oauthUser.setSocialProvider(SocialProvider.MOCK);
            oauthUser.setProviderUserId("mock_admin_" + System.currentTimeMillis());
            oauthUser.setEmail(adminEmail);
            oauthUser.setName("시스템 관리자");
            oauthUser.setPhoneNumber("01000000000");
            oauthUser.setProfileImageUrl(null);
            oauthUser = oauthUsersRepository.save(oauthUser);

            // Users 생성
            Users user = new Users();
            user.setOauthUser(oauthUser);
            user.setOrganizationId(nowOrg.getId());
            user.setRole(Role.ADMIN);
            user.setEmail(adminEmail);
            user.setName("시스템 관리자");
            user.setPhoneNumber("01000000000");
            user.setProfileImageUrl(null);
            user.setAddress("시스템 관리자 주소");
            user.setFcmToken(null);
            user.setIsDeleted(false);
            usersRepository.save(user);

            log.info("Admin 계정 생성 완료: {}", adminEmail);
            return "Admin 계정이 성공적으로 생성되었습니다: " + adminEmail;

        } catch (Exception e) {
            log.error("Admin 계정 생성 실패: {}", e.getMessage());
            return "Admin 계정 생성 실패: " + e.getMessage();
        }
    }
}