package com.handi.backend.util;

import com.handi.backend.entity.Users;
import com.handi.backend.service.AuthService;
import com.handi.backend.service.RedisService;
import com.handi.backend.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;
    private final AuthService authService;
    private final UserService userService;
    private final RedisService redisService;

    // Public 주소 : 인증 / 인가가 필요하지 않은 주소
    // SecurityContext에 인증 정보 없음
    // Controller에서 @AuthenticationPrincipal 사용 불
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/swagger-ui",
            "/api-docs",
            "/login",
            "/oauth2",
            "/auth/refresh",
            "/error",
            "/mock-oauth",
            "/api/v1/video",
            "/api/v1/mock"
    );

    private boolean isExcludedPath(String requestURI) {
        return EXCLUDED_PATHS.stream()
                .anyMatch(requestURI::startsWith);
    }

    // 임시 사용자가 접근 가능한 경로들
    private static final List<String> TEMP_USER_ALLOWED_PATHS = Arrays.asList(
            "/api/v1/auth/",
            "/api/v1/users/me",
            "/api/v1/users/code",
            "/api/v1/organizations"
    );

    private boolean isAllowedPathForTempUser(String requestURI) {
        return TEMP_USER_ALLOWED_PATHS.stream()
                .anyMatch(requestURI::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        log.debug("JWT 필터 처리 중: {}", requestURI);

        // 제외 경로 확인
        if (isExcludedPath(requestURI)) {
            log.info("제외 경로이므로 인증 과정 스킵: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String accessToken = cookieUtil.getCookieValue(request, "accessToken").orElse(null);
            String refreshToken = cookieUtil.getCookieValue(request, "refreshToken").orElse(null);

            // 1. Access Token 확인
            if (accessToken != null && jwtTokenProvider.validateToken(accessToken)) {
                if (setAuthenticationContext(request, response, accessToken, refreshToken)) {
                    filterChain.doFilter(request, response);
                    return;
                }

            }

            // 2. Access Token이 없거나 만료된 경우 - Refresh Token 확인
            if (refreshToken != null && jwtTokenProvider.validateRefreshToken(refreshToken)) {
                // 새로운 Access Token 발급
                String newAccessToken = authService.refreshAccessToken(request, response);
                if (newAccessToken != null && setAuthenticationContext(request, response, newAccessToken, refreshToken)) {
                    if (!response.isCommitted()) {
                        filterChain.doFilter(request, response);
                    }
                }

                return;
            }

            // 3. 모든 토큰이 유효하지 않은 경우 - 인증 실패
            log.debug("인증 실패 - 로그인 필요");
            handleAuthenticationFailure(response);
        } catch (Exception e) {
            log.error("JWT 필터 처리 중 오류 발생: {}", e.getMessage());
            handleAuthenticationFailure(response);
        }
    }


    // 사용자 조회 및 인증 컨텍스트 설정 (성공시 true, 실패시 false 반환하며 응답 처리함)
    private boolean setAuthenticationContext(HttpServletRequest request, HttpServletResponse response,
                                             String accessToken, String refreshToken) throws IOException {
        Integer oauthUserId = jwtTokenProvider.getOauthUserIdFromToken(accessToken);
        String name = jwtTokenProvider.getNameFromToken(accessToken);
        String email = jwtTokenProvider.getEmailFromToken(accessToken);

        // 임시 사용자를 위한
        request.setAttribute("oauthUserId", oauthUserId); // 지우지 말 것
        request.setAttribute("email", email); // 지우지 말 것
        request.setAttribute("userEmail", email);
        request.setAttribute("userName", name);

        Object user;

        if (oauthUserId == null) {
            user = userService.getByEmail(email);
        } else {
            user = userService.getByOauthUserId(oauthUserId);
        }

        if (user == null) {
            cookieUtil.deleteAllAuthCookies(response);
            redisService.deleteRefreshTokenFromRedis(oauthUserId, refreshToken);
            handleAuthenticationFailure(response);
            return false;
        }

        if (user instanceof Users) {
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(user, null, ((Users) user).getAuthorities()));
            return true;
        } else {
            // 임시사용자
            if (isExcludedPath(request.getRequestURI()) || isAllowedPathForTempUser(request.getRequestURI())) {
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(user, null,
                                List.of(new SimpleGrantedAuthority("ROLE_TEMP_USER"))));
                return true;
            } else {
                handleTempUserRestricted(response);
                return false;
            }
        }
    }

    private void handleAuthenticationFailure(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"success\": false,\"message\":\"로그인이 필요합니다.\"}");
    }

    private void handleTempUserRestricted(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"TEMP_USER_RESTRICTED\", \"success\": false, \"message\":\"권한이 없습니다.\", \"result\": null}");
    }

}