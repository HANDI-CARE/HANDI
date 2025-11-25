package com.handi.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import com.handi.backend.service.RedisService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/redis")
@RequiredArgsConstructor
@Tag(name = "Redis Health", description = "Redis connection health check")
public class RedisHealthController {

    private final RedisService redisService;

    @GetMapping("/health")
    @Operation(summary = "Redis Health Check", description = "Check Redis connection status")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Redis 연결 정상"),
        @ApiResponse(responseCode = "503", description = "서비스 불가")
    })
    public ResponseEntity<Map<String, Object>> checkRedisHealth() {
        Map<String, Object> response = new HashMap<>();

        try {
            if (redisService.performHealthCheck()) {
                response.put("status", "UP");
                response.put("message", "Redis connection is healthy");
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "DOWN");
                response.put("message", "Redis connection failed");
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
            }
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("message", "Redis connection failed: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    @GetMapping("/ping")
    @Operation(summary = "Redis Ping", description = "Simple Redis ping test")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "PONG"),
        @ApiResponse(responseCode = "503", description = "서비스 불가")
    })
    public ResponseEntity<Map<String, Object>> pingRedis() {
        Map<String, Object> response = new HashMap<>();

        if (redisService.isRedisHealthy()) {
            response.put("status", "UP");
            response.put("ping", "PONG");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "DOWN");
            response.put("error", "Redis ping failed");
            response.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }
}