package com.handi.backend.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Getter
public class CookieUtil {

    private String cookieDomain;

    private final Integer accessTokenExpiration = 60 * 60 * 24;  // 30분
    private final Integer refreshTokenExpiration = 60 * 60 * 24 * 7; // 7일

    // Access Token Cookie 생성
    public void createAccessTokenCookie(HttpServletResponse response, String accessToken) {
        Cookie cookie = new Cookie("accessToken", accessToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(accessTokenExpiration);
        response.addCookie(cookie);
    }

    // Refresh Token Cookie 생성
    public void createRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refreshToken", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(refreshTokenExpiration);
        response.addCookie(cookie);
    }

    // Cookie 가져오기
    public Optional<String> getCookieValue(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();

        if(cookies!=null){
            for(Cookie cookie : cookies){
                if(cookieName.equals(cookie.getName())){
                    return Optional.of(cookie.getValue());
                }
            }
        }

        return Optional.empty();
    }


    // Access Token Cookie 삭제
    public void deleteAccessTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("accessToken", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
    }

    // Refresh Token Cookie 삭제
    public void deleteRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);

        response.addCookie(cookie);
    }

    public void deleteAllAuthCookies(HttpServletResponse response) {
        deleteAccessTokenCookie(response);
        deleteRefreshTokenCookie(response);
    }
}
