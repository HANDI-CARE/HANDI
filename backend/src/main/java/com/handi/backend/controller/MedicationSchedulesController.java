package com.handi.backend.controller;


import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.medicationSchedules.CreateMedicationSchedulesRequestDto;
import com.handi.backend.dto.medicationSchedules.UpdateMedicationSchedulesRequestDto;
import com.handi.backend.dto.medicationSchedules.MedicationSchedulesResponseDto;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.MedicationSchedulesService;
import com.handi.backend.util.PageableUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medicationSchedules")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Medication Schedules", description = "투약 스케줄")
public class MedicationSchedulesController {

    private final MedicationSchedulesService medicationSchedulesService;

    @GetMapping("/senior/{seniorId}")
    @Operation(summary = "✅ 특정 환자 투약 스케줄 조회", description = "특정 환자 투약 스케줄 조회 API")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<List<MedicationSchedulesResponseDto>>> getMedicationSchedules(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable("seniorId") Integer seniorId) {

        log.info("환자 투약 스케줄 조회 요청 : {}", seniorId);

        List<MedicationSchedulesResponseDto> medicationSchedule = medicationSchedulesService.findBySeniorId(seniorId);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 스케줄 조회 성공", medicationSchedule));
    }

    @PostMapping("/senior/{seniorId}")
    @Operation(summary = "✅ 특정 환자 투약 스케줄 생성", description = "특정 환자 투약 스케줄 생성 API")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "생성 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<MedicationSchedulesResponseDto>> createMedicationSchedule(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "요청 데이터")
            @RequestBody CreateMedicationSchedulesRequestDto requestDto){

        log.info("투약 스케줄 생성 요청 : seniorId = {}", seniorId);

        MedicationSchedulesResponseDto medicationSchedule = medicationSchedulesService.createBySeniorId(seniorId, requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 스케줄 생성 완료", medicationSchedule));
    }

    @PutMapping("/{id}")
    @Operation(summary = "✅ 특정 투약 스케줄 수정", description = "수정은 제목, 주의사항, 약품정보 만 가능하도록 구현")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "수정 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "401", description = "인증 실패"), @ApiResponse(responseCode = "403", description = "권한 없음"), @ApiResponse(responseCode = "404", description = "투약 스케줄을 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<MedicationSchedulesResponseDto>> updateMedicationSchedule(
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id,
            @Parameter(description = "요청 데이터")
            @RequestBody UpdateMedicationSchedulesRequestDto requestDto) {

        log.info("투약 스케줄 수정 요청 : {}", id);

        MedicationSchedulesResponseDto medicationSchedule = medicationSchedulesService.updateBySeniorId(id, requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 스케줄 수정 완료", medicationSchedule));
    }

    @GetMapping("/{id}")
    @Operation(summary = "✅ 특정 투약 스케줄 조회", description = "특정 투약 스케줄 조회")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "투약 스케줄을 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<MedicationSchedulesResponseDto>> getMedicationSchedule(
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id) {

        log.info("투약 스케줄 조회 요청 : {}", id);

        MedicationSchedulesResponseDto medicationSchedule = medicationSchedulesService.findById(id);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 스케줄 조회 완료", medicationSchedule));
    }

    @GetMapping("/seniors/{seniorId}/range")
    @Operation(summary = "✅ 특정 날짜 투약 스케줄 조회", description = "date = yyyyMMdd 형식으로 기재")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public  ResponseEntity<PageResponseDto<MedicationSchedulesResponseDto>> getMedicationSchedulesByDate(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "시작 날짜 (yyyyMMdd)", example = "20250801")
            @RequestParam (defaultValue = "") String startDate,
            @Parameter(description = "종료 날짜 (yyyyMMdd)", example = "20250831")
            @RequestParam (defaultValue = "")String endDate,
            @PageableDefault(size = 10, page = 1) Pageable pageable,
            @Parameter(description = "정렬 기준 필드 (createdAt: 생성일시)", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "정렬 방향", example = "asc") @RequestParam(defaultValue = "asc") SortDirection sortDirection) {


        log.info("환자 투약일정 특정날짜 목록 조회 요청: pageable={}, sortBy={}, sortDirection={}", pageable, sortBy, sortDirection);

        PageResponseDto<MedicationSchedulesResponseDto> response = medicationSchedulesService.getListByDate(seniorId, startDate, endDate, PageableUtils.addSort(pageable, sortBy, sortDirection));


        return ResponseEntity.ok().body(response);

    }


    @DeleteMapping("/{id}")
    @Operation(summary = "✅ 특정 투약 스케줄 삭제", description = "특정 투약 스케줄 삭제")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청"), @ApiResponse(responseCode = "404", description = "투약 스케줄을 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<?>> deleteMedicationSchedule(
            @Parameter(description = "ID", example = "1")
            @PathVariable Integer id) {

        log.info("투약 스케줄 삭제 요청 : {}", id);
        medicationSchedulesService.deleteById(id);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 스케줄 삭제 완료", null));
    }



}
