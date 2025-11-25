package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.meeting.*;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.SortDirection;
import com.handi.backend.service.MeetingMatchesService;
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

@RestController
@RequestMapping("/api/v1/meetings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Meeting", description = "화상 상담 일정 API")
public class MeetingController {

    private final MeetingMatchesService meetingMatchesService;

    @GetMapping("/{id}")

    @Operation(summary = "✅ 상담 상세정보 조회", description = "고유 id로 상담 정보 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "상담 정보를 찾을 수 없음"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<CommonResponseDto<MeetingMatchesResponseDto>> getMatchById(
            @Parameter(description = "상담 ID", example = "1") @PathVariable Integer id,
            @AuthenticationPrincipal Users user) {

        log.info("상담 상세정보 조회 : id={}", id);

        MeetingMatchesResponseDto meetingMatches = meetingMatchesService.findById(id, user);

        return ResponseEntity.ok().body(CommonResponseDto.success("상담 정보가 조회되었습니다.", meetingMatches));
    }

    // 상담 생성
    @PostMapping()
    @Operation(summary = "✅ 상담 생성", description = "자동 매칭이 아닌 의사와의 상담은 직접 상담 일정 생성")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - 필수 필드 누락 또는 중복 상담"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "간호사, 보호자, 또는 환자를 찾을 수 없음"),
            @ApiResponse(responseCode = "409", description = "해당 시간에 이미 상담이 존재"),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류")
    })
    public ResponseEntity<CommonResponseDto<MeetingMatchesResponseDto>> createMatch(
            @RequestBody MeetingMatchesCreateRequestDto meetingMatchesCreateRequestDto){

        log.info("상담 직접 생성 요청");

        MeetingMatchesResponseDto result = meetingMatchesService.createMeetingMatches(meetingMatchesCreateRequestDto);


        return ResponseEntity.ok().body(CommonResponseDto.success("상담이 생성되었습니다.", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "✅ 상담 정보 수정", description = "특정 상담 정보 내용 추가 및 수정")
    public ResponseEntity<CommonResponseDto<MeetingMatchesResponseDto>> updateMatchById(
            @Parameter(description = "상담 ID", example = "1") @PathVariable Integer id,
            @RequestBody MeetingUpdateRequestDto meetingUpdateRequestDto){

        log.info("상담 정보 추가 및 수정 : id={}", id);

        MeetingMatchesResponseDto result = meetingMatchesService.updateById(id, meetingUpdateRequestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("상담 정보가 수정되었습니다.", result));
    }


    @PutMapping("/{id}/status")
    @Operation(summary = "✅ 매칭 상태 수정", description = "상담 매칭 상태 수정")
    public ResponseEntity<CommonResponseDto<MeetingMatchesStatusDto>> updateMatchStatus(
            @Parameter(description = "상담 ID", example = "1") @PathVariable Integer id,
            @RequestBody MeetingMatchesStatusDto requestDto){

        log.info("상담 상태 수정 id={}", id);

        MeetingMatchesStatusDto response = meetingMatchesService.updateStatusById(id, requestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("상담 상태가 수정되었습니다.", response));

    }


    @PutMapping("/{id}/doctor")
    @Operation(summary = "✅ 병원 진료 내용 수정", description = "병원 상담만 추가해야할 내용을 추가 및 수정 합니다.")
    public ResponseEntity<CommonResponseDto<?>> updateClassificationById(
            @Parameter(description = "상담 ID", example = "1") @PathVariable Integer id,
            @RequestBody UpdateMeetingMatchesDoctorRequestDto updateMeetingMatchesDoctorRequestDto){

        log.info("진료 분류 수정 요청 id={}", id);

        meetingMatchesService.updateClassificationById(id, updateMeetingMatchesDoctorRequestDto);

        return ResponseEntity.ok().body(CommonResponseDto.success("병원 진료 내용이 수정되었습니다.", null));
    }


    @GetMapping("/meeting-type")
    @Operation(summary = "✅ 상담 분류에 따른 상담 조회", description = "병원상담, 간호상담 으로 오늘 이후 모든 데이터를 조회합니다")
    public ResponseEntity<PageResponseDto<MeetingMatchesResponseDto>> getMeetingByMeetingType(
            @Parameter(description = "상담 분류 (withDoctor 또는 withEmployee)", example = "withDoctor") @RequestParam @Pattern(regexp = "^(withDoctor|withEmployee)$", message = "meetingType은 withDoctor 또는 withEmployee만 가능합니다") String meetingType,
            @PageableDefault(size = 10, page = 1) Pageable pageable,
            @Parameter(description = "정렬 기준 필드 (createdAt: 생성일시)", example = "createdAt") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "정렬 방향", example = "asc") @RequestParam(defaultValue = "asc") SortDirection sortDirection,
            @Parameter(description = "시작 날짜 (yyyyMMdd)", example = "20250801")
            @RequestParam(defaultValue = "") String startDate,
            @Parameter(description = "종료 날짜 (yyyyMMdd)", example = "20250807")
            @RequestParam(defaultValue = "") String endDate,
            @AuthenticationPrincipal Users user
    ){
        log.info("{} 의 {} 타입 상담 전체 조회", user.getId(), meetingType);

        PageResponseDto<MeetingMatchesResponseDto> response = meetingMatchesService.findByMeetingType(user, meetingType, pageable, startDate, endDate);

        return ResponseEntity.ok().body(response);
    }


}
