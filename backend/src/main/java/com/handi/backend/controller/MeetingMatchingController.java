package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.meeting.MatchedMeeting;
import com.handi.backend.service.MeetingMatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/meeting/matching")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Meeting Matching", description = "간호사-보호자 미팅 매칭 시스템")
public class MeetingMatchingController {

    private final MeetingMatchingService meetingMatchingService;

    @PostMapping("/execute")
    @Operation(
        summary = "미팅 매칭 실행", 
        description = "특정 날짜에 대해 간호사와 보호자 간의 최적 매칭을 수행합니다. 백트래킹 알고리즘을 사용하여 최대 매칭 수를 찾습니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "매칭 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 날짜 형식"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<CommonResponseDto<?>> executeMatching(
            @Parameter(description = "매칭할 날짜 ( YYYYMMDD 형식 )", example = "20250605", required = true)
            @RequestParam String targetDate) {

        log.info("미팅 매칭 실행 시작: 날짜={}", targetDate);

        // 매칭 실행
        List<MatchedMeeting> matchedMeetings = meetingMatchingService.performMatching(targetDate);

        log.info("미팅 매칭 실행 완료: 날짜={}, 매칭 수={}", targetDate, matchedMeetings.size());

        return ResponseEntity.ok(CommonResponseDto.success("미팅 매칭 실행 완료"));
    }

    @GetMapping("/status")
    @Operation(
        summary = "매칭 시스템 상태 조회", 
        description = "현재 Redis에 저장된 매칭 대기 데이터의 상태를 조회합니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "상태 조회 성공"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<Map<String, Object>> getMatchingStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // TODO: Redis에서 현재 대기 중인 간호사/보호자 데이터 통계 조회
            response.put("status", "success");
            response.put("message", "매칭 시스템이 정상 동작 중입니다.");
            response.put("timestamp", java.time.LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("매칭 상태 조회 중 오류 발생", e);
            response.put("status", "error");
            response.put("message", "매칭 상태 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }


}