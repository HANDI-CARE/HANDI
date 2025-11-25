package com.handi.backend.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Slf4j
@Component
@Getter
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration = 1000 * 60 * 60 * 24;  // 30분 ( 임시 24시간 )
    private final long refreshTokenExpiration = 1000 * 60 * 60 * 24 * 7; // 7일

    public JwtTokenProvider(
            @Value("${JWT_SECRET}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // Access Token 생성
    public String generateAccessToken(Integer oauthUserId, Integer userId, String name, String email) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + getAccessTokenExpiration());

        return Jwts.builder()
                .subject(email)                   // subject : JWT 토큰이 누구것인지 확인
                .claim("type", "access")
                .claim("oauthUserId", oauthUserId)
                .claim("userId", userId)
                .claim("name", name)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSecretKey())
                .compact();
    }

    // Refresh Token 생성 (사용자 정보 포함 X , 랜덤 문자열)
    public String generateRefreshToken(Integer oauthUserId) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + getRefreshTokenExpiration());

        // 랜덤 ID 생성 (개인정보 대신 랜덤값 사용)
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        String tokenId = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        return Jwts.builder()
                .subject("refresh")           // 고정값 (개인정보 아님)
                .claim("type", "refresh")     // 토큰 타입
                .claim("oauthUserId", oauthUserId)
                .claim("refreshId", tokenId)        // JWT ID (랜덤값)
                .issuedAt(now)               // 발급 시간
                .expiration(expiration)       // 만료 시간
                .signWith(getSecretKey())         // 서명
                .compact();
    }

    // Refrsh Token에서 refreshId 추출
    public String getRefreshIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.get("refreshId", String.class);
        } catch (Exception e) {
            log.error("토큰에서 refreshId 추출 실패: {}", e.getMessage());
            return null;
        }
    }


    // 토큰에서 이메일 추출
    public String getEmailFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (Exception e) {
            log.error("토큰에서 이메일 추출 실패: {}", e.getMessage());
            return null;
        }
    }

    // 토큰에서 역할 추출
    public String getNameFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.get("name", String.class);
        } catch (Exception e) {
            log.error("토큰에서 이름 추출 실패: {}", e.getMessage());
            return null;
        }
    }

    // 토큰에서 OAuth User ID 추출
    public Integer getOauthUserIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.get("oauthUserId", Integer.class);
        } catch (Exception e) {
            log.error("토큰에서 OAuth User ID 추출 실패: {}", e.getMessage());
            return null;
        }
    }

    // 토큰에서 type 추출
    public String getTokenType(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.get("type", String.class);
        } catch (Exception e) {
            log.error("토큰에서 타입 추출 실패: {}", e.getMessage());
            return null;
        }
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (MalformedJwtException ex) {
            log.error("잘못된 JWT 토큰: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("만료된 JWT 토큰: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("지원되지 않는 JWT 토큰: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT 클레임이 비어있음: {}", ex.getMessage());
        } catch (Exception ex) {
            log.error("JWT 토큰 검증 실패: {}", ex.getMessage());
        }
        return false;
    }

    // 너 RefreshToken 이니?
    public boolean isRefreshToken(String token) {
        String tokenType = getTokenType(token);
        return "refresh".equals(tokenType);
    }

    // Refresh Token 유효성 검사
    public boolean validateRefreshToken(String refreshToken) {
        try {
            if (!validateToken(refreshToken)) {  // 토큰 유효성 검증 통과 여부
                return false;
            }

            // Refresh Token 타입 확인
            if (!isRefreshToken(refreshToken)) {
                log.error("토큰이 Refresh Token이 아님");
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Refresh Token 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    // 토큰 만료 시간 확인
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSecretKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true; // 이미 만료됨
        } catch (Exception e) {
            log.error("토큰 만료 시간 확인 실패: {}", e.getMessage());
            return true;
        }
    }

}