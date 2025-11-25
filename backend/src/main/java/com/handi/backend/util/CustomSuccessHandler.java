package com.handi.backend.util;

import com.handi.backend.service.AuthService;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Date;

// 인증 성공 후 프론트엔드로 리다이렉트
@Component
@Slf4j
@RequiredArgsConstructor
public class CustomSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @Value("${frontend.redirect-url}")
    private String redirectUrl;

    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws ServletException, IOException {
        // 실제 접속한 호스트 정보 추출 (ngrok 등을 위해)
        String scheme = request.getScheme(); // http 또는 https
        String host = request.getHeader("Host"); // 실제 접속한 도메인:포트

        String frontendUrl = scheme + "://" + host;

        // localhost나 127.0.0.1인 경우 스웨거로, 그 외에는 정적 페이지로 리다이렉트
        if (host.contains("localhost") || host.contains("127.0.0.1")) {
            frontendUrl += "/swagger-ui/index.html";
        } else {
            frontendUrl = redirectUrl;
        }

        String targetUrl = UriComponentsBuilder
                .fromUriString(frontendUrl)
                .build().toUriString();

        // 응답 이미 커밋 = 리다이렉트 불가
        if (response.isCommitted()) {
            return;
        }

        clearAuthenticationAttributes(request);

        // 쿠키 설정 (리다이렉트 전에)
        setCookies(response, authentication);

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    /**
     * 쿠키 설정하기
     */
    private void setCookies(HttpServletResponse response, Authentication authentication) {
        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

            Integer oauthUserId = (Integer) oAuth2User.getAttributes().get("oauthUserId");
            Integer userId = (Integer) oAuth2User.getAttributes().get("userId");
            String email = (String) oAuth2User.getAttributes().get("email");
            String name = (String) oAuth2User.getAttributes().get("name");
            String phoneNumber = (String) oAuth2User.getAttributes().get("phoneNumber");
            String profileImageUrl = (String) oAuth2User.getAttributes().get("profileImageUrl");
            Boolean needsAdditionalInfo = (Boolean) oAuth2User.getAttributes().get("needsAdditionalInfo");

            // 만료기한
            Date now = new Date();
            Date expiration = new Date(now.getTime() + jwtTokenProvider.getAccessTokenExpiration());

            // accessToken
            String accessToken = Jwts.builder()
                    .subject(email)                   // subject : JWT 토큰이 누구것인지 확인
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

            // redis에 저장
            authService.storeRefreshToken(refreshToken, oauthUserId);

            // 쿠키 설정
            cookieUtil.createAccessTokenCookie(response, accessToken);
            cookieUtil.createRefreshTokenCookie(response, refreshToken);

            log.info("[AUTH:COOKIES] 토큰 생성 및 Redis + 쿠키에 저장 완료 : oauthUserId={}", oauthUserId);
        } catch (Exception e) {
            log.error("쿠키 설정 중 오류 발생: {}", e.getMessage());
        }
    }
}