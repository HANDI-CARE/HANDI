package com.handi.backend.service;

import com.handi.backend.entity.Users;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.UsersRepository;
import com.handi.backend.util.CookieUtil;
import com.handi.backend.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final UsersRepository usersRepository;
    private final RedisService redisService;
    private final CookieUtil cookieUtil;

    // Access Token 이 없을 때, 쿠키에서 Refresh Token 가져와서 Access Token 발급하기
    public String refreshAccessToken(HttpServletRequest request, HttpServletResponse response) {
        try {

            String refreshToken = cookieUtil.getCookieValue(request, "refreshToken").orElseThrow(() -> new IllegalArgumentException("[AUTH] refreshToken 쿠키에 없음"));

            // 2. Refresh Token 유효성 검증
            if (!jwtTokenProvider.validateToken(refreshToken)) {
                throw new IllegalArgumentException("[AUTH] 유효하지 않은 토큰");
            }

            // 3. Refresh Token 에서 사용자 ID 추출
            String refreshId = jwtTokenProvider.getRefreshIdFromToken(refreshToken);
            Integer oauthUserId = jwtTokenProvider.getOauthUserIdFromToken(refreshToken);
            if (oauthUserId == null) {
                throw new IllegalArgumentException("[AUTH] Refresh Token에서 oauthUserId 없음");
            }

            // 4. Redis에서 해당 사용자의 Refresh Token 유효성 확인
            if (!redisService.validateRefreshTokenInRedis(refreshToken, oauthUserId)) {
                throw new IllegalArgumentException("[AUTH] 만료된 refresh token");
            }

            // 5. 사용자 정보 조회
            Users user = usersRepository.findByOauthUserId(oauthUserId).orElseThrow(() -> new NotFoundException("[AUTH] 사용자 없음"));

            // 6. 새로운 Access Token 생성
            // oauthUserId
            String newAccessToken = jwtTokenProvider.generateAccessToken(oauthUserId, user.getId(), user.getName(), user.getEmail());

            // 7. 새로운 Access Token 쿠키에 저장
            cookieUtil.createAccessTokenCookie(response, newAccessToken);

            log.info("[AUTH] Access Token 재발급 성공");
            return newAccessToken;
        } catch (Exception e) {
            log.error("[AUTH] Access Token 재발급 실패: {}", e.getMessage());
            return null;
        }
    }

    // logout ( 쿠키 + Redis 삭제 )
    public void logout(Integer oauthUserId, HttpServletRequest request, HttpServletResponse response) {
        try {
            String refreshToken = cookieUtil.getCookieValue(request, "refreshToken").orElse(null);

            // Redis에서 refresh 삭제
            if (refreshToken != null) {
                redisService.deleteRefreshTokenFromRedis(oauthUserId, refreshToken);
            }

            // 쿠키 삭제
            cookieUtil.deleteAccessTokenCookie(response);
            cookieUtil.deleteRefreshTokenCookie(response);

            log.info("로그아웃 완료 : oauthUserId={}", oauthUserId);

        } catch (Exception e) {
            log.info("로그아웃 에러 : oauthUserId={}", oauthUserId);
            throw new RuntimeException(e.getMessage());
        }
    }

    // Redis에 Refresh Token 저장
    public void storeRefreshToken(String refreshToken, Integer oauthUserId) {
        redisService.storeRefreshToken(refreshToken, oauthUserId);
    }

    // 쿠키 삭제: Access & Refresh
    public void clearAuthCookies(HttpServletResponse response) {
        try {
            cookieUtil.deleteAllAuthCookies(response);
            log.info("인증 쿠키 정리 완료");
        } catch (Exception e) {
            log.error("쿠키 정리 실패: {}", e.getMessage());
            throw new RuntimeException("쿠키 정리 중 오류가 발생했습니다.");
        }
    }

}
