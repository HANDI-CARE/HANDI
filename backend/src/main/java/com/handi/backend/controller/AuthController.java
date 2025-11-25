package com.handi.backend.controller;

import com.handi.backend.entity.Users;
import com.handi.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Auth Controller", description = "jwt 인증")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/refresh")
    @Operation(summary = "✅ Access Token 갱신", description = "Refresh Token을 사용하여 새로운 Access Token 발급")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "갱신 성공"),
        @ApiResponse(responseCode = "401", description = "인증 실패"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<Map<String, Object>> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        Map<String, Object> result = new HashMap<>();

        try {
            String newAccessToken = authService.refreshAccessToken(request, response);

            if (newAccessToken != null) {
                result.put("success", true);
                result.put("message", "Access Token이 성공적으로 갱신되었습니다.");
                return ResponseEntity.ok(result);
            } else {
                result.put("success", false);
                result.put("message", "토큰 갱신에 실패했습니다. 다시 로그인해주세요.");
                return ResponseEntity.status(401).body(result);
            }

        } catch (Exception e) {
            log.error("토큰 갱신 중 오류 발생: {}", e.getMessage());
            result.put("success", false);
            result.put("message", "서버 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(result);
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "✅ 로그아웃", description = "사용자를 로그아웃하고 모든 토큰을 무효화합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "로그아웃 성공"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<Map<String, Object>> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            @AuthenticationPrincipal Users user) {

        Map<String, Object> result = new HashMap<>();

        try {
            // Request에서 userId 가져오기 (JWT 필터에서 설정된 값)
            Integer oauthUserId = (Integer) request.getAttribute("oauthUserId");

            if (oauthUserId != null) {
                user.setFcmToken(null);  // 로그아웃시 FCM 토큰 제거
                authService.logout(oauthUserId, request, response);
                result.put("success", true);
                result.put("message", "성공적으로 로그아웃되었습니다.");
            } else {
                // userId가 없는 경우에도 쿠키는 삭제
                authService.clearAuthCookies(response);
                result.put("success", true);
                result.put("message", "로그아웃되었습니다.");
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("로그아웃 중 오류 발생: {}", e.getMessage());
            result.put("success", false);
            result.put("message", "로그아웃 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(result);
        }
    }



}
