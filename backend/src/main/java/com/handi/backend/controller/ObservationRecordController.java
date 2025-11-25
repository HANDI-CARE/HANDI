package com.handi.backend.controller;

import com.handi.backend.dto.observation.record.*;
import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.ObservationRecordService;
import com.handi.backend.util.PageableUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/v1/observation-records")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Observation Record", description = "관찰일지")
public class ObservationRecordController {

    private final ObservationRecordService observationRecordService;

    // 전체 관찰일지 조회
    @GetMapping("/seniors/{seniorId}")
    @Operation(summary = "✅ 시니어의 관찰일지 전체조회", description = "특정 환자의 모든 관찰일지 조회")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<PageResponseDto<ObservationRecordResponseFullDto>> getSeniorObservationRecords(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @PageableDefault(size = 10, page = 1) Pageable pageable,
            @Parameter(description = "정렬 기준 필드 (createdAt: 생성일시)", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "정렬 방향", example = "asc") @RequestParam(defaultValue = "asc") SortDirection sortDirection) {

        log.info("환자 관찰일지 전체 목록 조회 요청: pageable={}, sortBy={}, sortDirection={}", pageable, sortBy, sortDirection);

        PageResponseDto<ObservationRecordResponseFullDto> response = observationRecordService.getList(seniorId, PageableUtils.addSort(pageable, sortBy, sortDirection));

        return ResponseEntity.ok().body(response);
    }

    // 생성
    @PostMapping("/seniors/{seniorId}")
    @Operation(summary = "✅ 시니어의 관찰일지 생성", description = "시니어의 당일 관찰일지 생성")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "생성 완료"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<ObservationRecordResponseFullDto>> createSeniorObservationRecord(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "요청 데이터")
            @RequestBody ObservationRecordRequestDto createSeniorObservationRecordRequest,
            @AuthenticationPrincipal Users user) {

        log.info("관찰일지 생성 요청 {}", createSeniorObservationRecordRequest);

        ObservationRecordResponseFullDto savedSeniorObservationRecord = observationRecordService.createOne(seniorId, createSeniorObservationRecordRequest, user);

        return ResponseEntity.ok().body(CommonResponseDto.success("관찰일지가 생성되었습니다.", savedSeniorObservationRecord));
    }

    // 조회
    @GetMapping("/{id}")
    @Operation(summary = "✅ 관찰일지 조회", description = "관찰일지 조회")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "관찰일지를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<ObservationRecordResponseFullDto>> getObservationRecord(
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id) {

        log.info("관찰일지 수정 요청. id={}", id);

        ObservationRecordResponseFullDto result = observationRecordService.getOne(id);

        return ResponseEntity.ok().body(CommonResponseDto.success("관찰일지가 조회되었습니다.", result));
    }


    // 수정
    @PutMapping("/{id}")
    @Operation(summary = "✅ 관찰일지 수정", description = "관찰일지 수정")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "수정 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "관찰일지를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<ObservationRecordResponseSimpleDto>> updateObservationRecord(
            @Parameter(description = "요청 데이터")
            @RequestBody ObservationRecordRequestDto observationRecordUpdateRequestDto,
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id) {

        log.info("관찰일지 수정 요청. id={} , {}", id, observationRecordUpdateRequestDto);

        ObservationRecordResponseSimpleDto result = observationRecordService.updateOne(id, observationRecordUpdateRequestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("관찰일지가 수정되었습니다.", result));
    }

    // 삭제
    @DeleteMapping("/{id}")
    @Operation(summary = "✅ 관찰일지 삭제", description = "관찰일지 삭제")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "삭제 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "관찰일지를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<?>> deleteObservationRecord(
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id) {

        log.info("관찰일지 삭제 요청. id={}", id);

        observationRecordService.deleteOne(id);

        return ResponseEntity.ok().body(CommonResponseDto.success("관찰일지가 삭제되었습니다.", null));
    }


    @GetMapping("/recent")
    @Operation(summary = "✅ 최근 7일 위험 관찰일지 조회", description = "현재 간호사 담당 환자의 관찰일지 중 최근 7일의 관찰일지 중 가장 위험한 1개의 관찰일지을 조회한다.")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "401", description = "인증 실패 - 로그인 필요"), @ApiResponse(responseCode = "403", description = "권한 없음")})
    public ResponseEntity<CommonResponseDto<List<RecentObservationRecordResponseDto>>> getRecentObservationRecord(
            @AuthenticationPrincipal Users user
    ) {

        log.info("자신 담당 환자의 최근 7일 중 위험 관찰일지 1개씩 조회 : userId={}", user.getId());

        List<RecentObservationRecordResponseDto> recentObservationRecord = observationRecordService.getRecentList(user);

        return ResponseEntity.ok().body(CommonResponseDto.success("최근 환자별 관찰일지 조회 완료", recentObservationRecord));
    }


    @GetMapping("/seniors/{seniorId}/range")
    @Operation(summary = "✅ 특정 날짜 관찰일지 조회", description = "date = yyyyMMdd 형식으로 기재")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청 - 날짜 형식 오류"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<PageResponseDto<ObservationRecordResponseFullDto>> getObservationRecordByDate(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "시작 날짜 (yyyyMMdd)", example = "20250805")
            @RequestParam(defaultValue = "") String startDate,
            @Parameter(description = "종료 날짜 (yyyyMMdd)", example = "20250807")
            @RequestParam(defaultValue = "") String endDate,
            @PageableDefault(size = 10, page = 1) Pageable pageable,
            @Parameter(description = "정렬 기준 필드 (createdAt: 생성일시)", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "정렬 방향", example = "asc") @RequestParam(defaultValue = "asc") SortDirection sortDirection) {

        log.info("환자 관찰일지 특정날짜 목록 조회 요청: pageable={}, sortBy={}, sortDirection={}", pageable, sortBy, sortDirection);

        PageResponseDto<ObservationRecordResponseFullDto> response = observationRecordService.getListByDate(seniorId, startDate, endDate, PageableUtils.addSort(pageable, sortBy, sortDirection));

        return ResponseEntity.ok().body(response);

    }
}
