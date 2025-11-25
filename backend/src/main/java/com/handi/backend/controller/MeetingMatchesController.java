package com.handi.backend.controller;

import com.handi.backend.entity.MeetingMatches;
import com.handi.backend.entity.Users;
import com.handi.backend.entity.Seniors;
import com.handi.backend.enums.ConsultationStatus;
import com.handi.backend.repository.MeetingMatchesRepository;
import com.handi.backend.repository.UsersRepository;
import com.handi.backend.repository.SeniorsRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/meeting/matches")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Meeting Matches", description = "미팅 매칭 결과 조회 API")
public class MeetingMatchesController {

    private final MeetingMatchesRepository meetingMatchesRepository;
    private final UsersRepository usersRepository;
    private final SeniorsRepository seniorsRepository;

    @GetMapping("/employee/{employeeId}")
    @Operation(
        summary = "간호사별 매칭 결과 조회", 
        description = "특정 간호사의 모든 매칭 결과를 조회합니다."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "404", description = "간호사를 찾을 수 없음"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<Map<String, Object>> getMatchesByEmployee(
            @Parameter(description = "간호사 사용자 ID") 
            @PathVariable Integer employeeId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Users employee = usersRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("간호사를 찾을 수 없습니다: " + employeeId));
            
            List<MeetingMatches> matches = meetingMatchesRepository.findByEmployee(employee);
            
            response.put("status", "success");
            response.put("employeeId", employeeId);
            response.put("employeeName", employee.getUsername());
            response.put("totalMatches", matches.size());
            response.put("matches", matches);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("간호사 매칭 결과 조회 실패: employeeId={}", employeeId, e);
            response.put("status", "error");
            response.put("message", "조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/guardian/{guardianId}")
    @Operation(
        summary = "보호자별 매칭 결과 조회", 
        description = "특정 보호자의 모든 매칭 결과를 조회합니다."
    )
    public ResponseEntity<Map<String, Object>> getMatchesByGuardian(
            @Parameter(description = "보호자 사용자 ID") 
            @PathVariable Integer guardianId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Users guardian = usersRepository.findById(guardianId)
                    .orElseThrow(() -> new RuntimeException("보호자를 찾을 수 없습니다: " + guardianId));
            
            List<MeetingMatches> matches = meetingMatchesRepository.findByGuardian(guardian);
            
            response.put("status", "success");
            response.put("guardianId", guardianId);
            response.put("guardianName", guardian.getUsername());
            response.put("totalMatches", matches.size());
            response.put("matches", matches);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("보호자 매칭 결과 조회 실패: guardianId={}", guardianId, e);
            response.put("status", "error");
            response.put("message", "조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/senior/{seniorId}")
    @Operation(
        summary = "시니어별 매칭 결과 조회", 
        description = "특정 시니어의 모든 매칭 결과를 조회합니다."
    )
    public ResponseEntity<Map<String, Object>> getMatchesBySenior(
            @Parameter(description = "시니어 ID") 
            @PathVariable Integer seniorId) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Seniors senior = seniorsRepository.findById(seniorId)
                    .orElseThrow(() -> new RuntimeException("시니어를 찾을 수 없습니다: " + seniorId));
            
            List<MeetingMatches> matches = meetingMatchesRepository.findBySenior(senior);
            
            response.put("status", "success");
            response.put("seniorId", seniorId);
            response.put("seniorName", senior.getName());
            response.put("totalMatches", matches.size());
            response.put("matches", matches);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("시니어 매칭 결과 조회 실패: seniorId={}", seniorId, e);
            response.put("status", "error");
            response.put("message", "조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/date-range")
    @Operation(
        summary = "날짜 범위별 매칭 결과 조회", 
        description = "특정 날짜 범위의 모든 매칭 결과를 조회합니다."
    )
    public ResponseEntity<Map<String, Object>> getMatchesByDateRange(
            @Parameter(description = "시작 날짜", example = "2025-06-01") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "종료 날짜", example = "2025-06-07") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
            
            List<MeetingMatches> matches = meetingMatchesRepository.findByMeetingTimeBetween(startDateTime, endDateTime);
            
            response.put("status", "success");
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("totalMatches", matches.size());
            response.put("matches", matches);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("날짜 범위 매칭 결과 조회 실패: startDate={}, endDate={}", startDate, endDate, e);
            response.put("status", "error");
            response.put("message", "조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/status/{status}")
    @Operation(
        summary = "상태별 매칭 결과 조회", 
        description = "특정 상태의 모든 매칭 결과를 조회합니다."
    )
    public ResponseEntity<Map<String, Object>> getMatchesByStatus(
            @Parameter(description = "매칭 상태", example = "SCHEDULED") 
            @PathVariable ConsultationStatus status) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<MeetingMatches> matches = meetingMatchesRepository.findByStatus(status);
            
            response.put("status", "success");
            response.put("matchStatus", status);
            response.put("totalMatches", matches.size());
            response.put("matches", matches);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("상태별 매칭 결과 조회 실패: status={}", status, e);
            response.put("status", "error");
            response.put("message", "조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/statistics")
    @Operation(
        summary = "매칭 통계 조회", 
        description = "날짜별 매칭 통계를 조회합니다."
    )
    public ResponseEntity<Map<String, Object>> getMatchingStatistics(
            @Parameter(description = "시작 날짜", example = "2025-06-01") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "종료 날짜", example = "2025-06-07") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
            
            List<Object[]> statistics = meetingMatchesRepository.getMatchingStatsByDateRange(startDateTime, endDateTime);
            
            response.put("status", "success");
            response.put("startDate", startDate);
            response.put("endDate", endDate);
            response.put("dailyStatistics", statistics);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("매칭 통계 조회 실패: startDate={}, endDate={}", startDate, endDate, e);
            response.put("status", "error");
            response.put("message", "통계 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }



}