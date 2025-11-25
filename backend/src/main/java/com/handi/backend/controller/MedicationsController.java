package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.medication.MedicationOneResponseDto;
import com.handi.backend.dto.medication.MedicationTodayResponseDto;
import com.handi.backend.dto.medication.MedicationUploadRequestDto;
import com.handi.backend.dto.medication.MedicationsResponseDto;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.MedicationsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("api/v1/medications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Medications", description = "투약 스케줄 1개에 대한 투약 내역")
public class MedicationsController {

    private final MedicationsService medicationsService;

    @GetMapping("schedules/{schedulesId}")
    @Operation(summary = "✅ 투약 내역 전체 조회 API", description = "투약 스케줄 Id로 해당 투약 내역 전체 조회")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "404", description = "투약 스케줄을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<MedicationsResponseDto>> getMedications(
            @Parameter(description = "투약 스케줄 ID", example = "1") @PathVariable("schedulesId") Integer schedulesId) {

        log.info("투약 내역 전체 조회 : schedulesId = {}", schedulesId);

        MedicationsResponseDto result = medicationsService.findBySchedulesId(schedulesId);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 내역 전체 조회 성공", result));
    }


    // 사진 파일 올리면 MiniO 에 저장 및 투약 이미지 URL 저장
    @PutMapping(consumes = "multipart/form-data", path = "/{id}")
    @Operation(summary = "✅ 특정 투약 내역 사진 업로드", description = "해당 시간에 투약 내역 이미지를 업로드 한다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "업로드 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 - 파일 없음"),
        @ApiResponse(responseCode = "401", description = "인증 실패"),
        @ApiResponse(responseCode = "403", description = "권한 없음"),
        @ApiResponse(responseCode = "404", description = "투약 내역을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<?>> uploadMedicationImage(
            @Parameter(description = "투약 내역 ID", example = "1") @PathVariable Integer id,
            @Parameter(description = "업로드할 알약 사진") @ModelAttribute MedicationUploadRequestDto medicationUploadRequestDto) throws Exception{
        log.info("투약 이미지 업로드 요청 : {}", id);

        medicationsService.uploadFileById(id, medicationUploadRequestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 사진 업로드 성공"));
    }


    // 각 투약 내역별 조회
    @GetMapping("/{id}")
    @Operation(summary = "✅ 투약 내역 조회", description = "투약 내역 id로 조회")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "404", description = "투약 내역을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<MedicationOneResponseDto>> getMedicationById(
            @Parameter(description = "투약 내역 ID", example = "1") @PathVariable Integer id){

        log.info("투약 내역 조회 요청 : {}", id);

        MedicationOneResponseDto medications = medicationsService.findById(id);

        return ResponseEntity.ok().body(CommonResponseDto.success("투약 내역 조회 성공", medications));
    }

    @GetMapping("/today")
    @Operation(summary = "✅ 담당 환자의 당일 모든 복약 내역 조회", description = "로그인한 사용자 담당의 환자들의 모든 복약 내역을 조회한다.")
    public ResponseEntity<PageResponseDto<MedicationTodayResponseDto>> getTodayMedications(
            @PageableDefault(size = 10, page = 1) Pageable pageable,
            @Parameter(description = "정렬 기준 필드 (createdAt: 생성일시)", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "정렬 방향", example = "asc") @RequestParam(defaultValue = "asc") SortDirection sortDirection,
            @AuthenticationPrincipal Users user
    ){
        PageResponseDto<MedicationTodayResponseDto> response = medicationsService.getTodayMedications(user, pageable);

        return ResponseEntity.ok(response);
    }

}
