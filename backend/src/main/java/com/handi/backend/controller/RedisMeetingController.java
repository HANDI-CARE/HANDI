package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.meeting.MeetingScheduleEmployeeDto;
import com.handi.backend.dto.meeting.MeetingScheduleGuardiantDto;
import com.handi.backend.entity.Users;
import com.handi.backend.service.RedisMeetingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/meeting/redis")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Redis Meeting Management", description = "Redis 기반 미팅 데이터 관리")
public class RedisMeetingController {

    private final RedisMeetingService redisMeetingService;

    @PostMapping("/schedule/register/employee")
    @Operation(summary = "✅ 간호사 미팅 스케줄 등록", description = "간호사의 상담 가능 시간을 Redis에 저장합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<CommonResponseDto<?>> insertEmployeeMeetingSchedule(
            @Parameter(description = "상담 가능 시간대 ", required = true) @RequestBody MeetingScheduleEmployeeDto requestDto,
            @AuthenticationPrincipal Users user
    ) {

        log.info("미팅 스케줄 등록 요청: userId={}, userType={}", user.getId(), user.getRole());

        // Redis에 저장
        redisMeetingService.insertEmployeeMeetingSchedule(user, requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("미팅 스케줄 등록을 성공했습니다.", null));
    }

    @PostMapping("/schedule/register/guardian")
    @Operation(summary = "✅ 보호자 미팅 스케줄 등록", description = "보호자의 상담 가능 시간을 Redis에 저장합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "등록 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 데이터"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<CommonResponseDto<?>> insertGuardianMeetingSchedule(
            @Parameter(description = "상담 가능 시간대 ", required = true) @RequestBody MeetingScheduleGuardiantDto requestDto,
            @AuthenticationPrincipal Users user
    ) {

        log.info("미팅 스케줄 등록 요청: userId={}, userType={}", user.getId(), user.getRole());

        // Redis에 저장
        redisMeetingService.insertGuardianMeetingSchedule(user, requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("미팅 스케줄 등록을 성공했습니다.", null));
    }


    @GetMapping("/schedule/employee")
    @Operation(summary = "✅ 간호사 스케줄 데이터 조회", description = "Redis에 저장된 간호사 일정을 가져옵니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<CommonResponseDto<MeetingScheduleEmployeeDto>> getEmployeeMeetingSchedule(
        @AuthenticationPrincipal Users user){

        log.info("간호사 스케줄 조회 : email : {}", user.getEmail());

        MeetingScheduleEmployeeDto result = redisMeetingService.getEmployeeScheduleData(user);

        return ResponseEntity.ok().body(CommonResponseDto.success("간호사 스케줄 데이터 조회가 완료되었습니다.", result));
    }


    @GetMapping("/schedule/guardian/{seniorId}")
    @Operation(summary = "✅ 보호자 스케줄 데이터 조회", description = "Redis에 저장된 보호자 일정을 가져옵니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<CommonResponseDto<MeetingScheduleGuardiantDto>> getGuardianMeetingSchedule(
            @PathVariable Integer seniorId,
            @AuthenticationPrincipal Users user){

        log.info("보호자 스케줄 조회 : email : {}, seniorId : {}, ", user.getEmail(), seniorId);

        MeetingScheduleGuardiantDto result = redisMeetingService.getGuardianScheduleData(user, seniorId);

        return ResponseEntity.ok().body(CommonResponseDto.success("보호자 스케줄 데이터 조회 완료", result));
    }

    @GetMapping("/schedule/guardian")
    @Operation(summary = "✅ 모든 보호자 관련 스케줄 데이터 조회", description = "Redis에 저장된 모든 보호자 일정을 가져옵니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<CommonResponseDto<List<MeetingScheduleGuardiantDto>>> getAllGuardianMeetingSchedule(
            @AuthenticationPrincipal Users user){

        log.info("보호자 담당 모든 환자 스케줄 조회 : email : {} ", user.getEmail());

        List<MeetingScheduleGuardiantDto> result = redisMeetingService.getAllGuardianScheduleData(user);

        return ResponseEntity.ok().body(CommonResponseDto.success("보호자 스케줄 데이터 조회 완료", result));
    }



    @GetMapping("/health")
    @Operation(
        summary = "Redis 헬스체크",
        description = "Redis 연결 상태를 확인합니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "정상"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<Map<String, Object>> checkRedisHealth() {
        Map<String, Object> response = new HashMap<>();

        try {
            boolean isHealthy = redisMeetingService.isRedisHealthy();

            response.put("status", isHealthy ? "UP" : "DOWN");
            response.put("service", "Redis Meeting Service");
            response.put("timestamp", java.time.LocalDateTime.now());
            response.put("message", isHealthy ? "Redis 연결 정상" : "Redis 연결 실패");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Redis 헬스체크 실패", e);
            response.put("status", "ERROR");
            response.put("message", "헬스체크 중 오류 발생: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}