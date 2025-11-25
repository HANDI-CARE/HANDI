package com.handi.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health", description = "헬스체크")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/health")
    @Operation(summary = "헬스체크", description = "애플리케이션 상태를 확인합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "상태 조회 성공")
    })
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Backend application is running successfully");
        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    @GetMapping("/health/db")
    @Operation(summary = "DB 헬스체크", description = "PostgreSQL 데이터베이스 연결 상태를 확인합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "연결 정상"),
        @ApiResponse(responseCode = "500", description = "연결 실패")
    })
    public Map<String, Object> healthDatabase() {
        Map<String, Object> response = new HashMap<>();

        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(5)) {
                response.put("status", "UP");
                response.put("database", "PostgreSQL");
                response.put("message", "Database connection is healthy");
            } else {
                response.put("status", "DOWN");
                response.put("database", "PostgreSQL");
                response.put("message", "Database connection is invalid");
            }
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("database", "PostgreSQL");
            response.put("message", "Database connection failed: " + e.getMessage());
        }

        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    @GetMapping("/health/all")
    @Operation(summary = "전체 헬스체크", description = "모든 서비스의 헬스체크 상태를 확인합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "상태 조회 성공")
    })
    public Map<String, Object> healthAll() {
        Map<String, Object> dbHealth = healthDatabase();

        Map<String, Object> response = new HashMap<>();
        response.put("application", "UP");
        response.put("database", dbHealth);

        boolean allHealthy = "UP".equals(dbHealth.get("status"));
        response.put("overall_status", allHealthy ? "UP" : "DOWN");
        response.put("timestamp", LocalDateTime.now());

        return response;
    }

    @GetMapping("/info")
    @Operation(summary = "애플리케이션 정보", description = "애플리케이션 기본 정보를 반환합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공")
    })
    public Map<String, Object> info() {
        Map<String, Object> response = new HashMap<>();
        response.put("name", "Backend API");
        response.put("version", "1.0.0");
        response.put("description", "Spring Boot Backend Application with PostgreSQL");
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
}
