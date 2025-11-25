package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.common.PageResponseDto;
import com.handi.backend.dto.senior.*;
import com.handi.backend.service.SeniorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/seniors")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Senior", description = "시니어 관리")
public class SeniorController {

    private final SeniorService seniorService;

    @PostMapping
    @Operation(summary = "✅ 시니어 생성", description = "새로운 시니어를 생성합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "시니어 생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "소속기관을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorResponseDto>> createSenior(
            @Parameter(description = "요청 데이터")
            @Valid @RequestBody SeniorCreateRequestDto request) {

        log.info("시니어 생성 요청: {}", request.getName());
        SeniorResponseDto response = seniorService.createSenior(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CommonResponseDto.success("시니어가 성공적으로 생성되었습니다.", response));
    }

    @PutMapping("/{seniorId}")
    @Operation(summary = "✅ 시니어 수정", description = "시니어 정보를 수정합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시니어 수정 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorResponseDto>> updateSenior(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "요청 데이터")
            @Valid @RequestBody SeniorUpdateRequestDto request) {

        log.info("시니어 수정 요청: ID={}", seniorId);
        SeniorResponseDto response = seniorService.updateSenior(seniorId, request);

        return ResponseEntity.ok(CommonResponseDto.success("시니어 정보가 성공적으로 수정되었습니다.", response));
    }

    @GetMapping("/{seniorId}")
    @Operation(summary = "✅ 시니어 조회", description = "시니어 기본 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시니어 조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorResponseDto>> getSenior(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId) {

        log.info("시니어 조회 요청: ID={}", seniorId);
        SeniorResponseDto response = seniorService.getSenior(seniorId);
        return ResponseEntity.ok(CommonResponseDto.success("시니어 조회가 완료되었습니다.", response));
    }

    @GetMapping("/{seniorId}/detail/all")
    @Operation(summary = "✅ 시니어 상세 조회 (모든 관련 사용자)", description = "시니어 상세 정보와 모든 관련 사용자 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시니어 상세 조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorDetailResponseDto>> getSeniorDetailAll(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId) {

        log.info("시니어 상세 조회 (모든 관련 사용자) 요청: ID={}", seniorId);
        SeniorDetailResponseDto response = seniorService.getSeniorDetail(seniorId);
        return ResponseEntity.ok(CommonResponseDto.success("시니어 상세 조회가 완료되었습니다.", response));
    }

    @GetMapping("/{seniorId}/detail/employees")
    @Operation(summary = "✅ 시니어 상세 조회 (직원만)", description = "시니어 상세 정보와 관련 직원 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시니어 상세 조회 (직원) 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorDetailResponseDto>> getSeniorDetailEmployees(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId) {

        log.info("시니어 상세 조회 (직원만) 요청: ID={}", seniorId);
        SeniorDetailResponseDto response = seniorService.getSeniorDetailByRole(seniorId, com.handi.backend.enums.Role.EMPLOYEE);
        return ResponseEntity.ok(CommonResponseDto.success("시니어 관련 직원 조회가 완료되었습니다.", response));
    }

    @GetMapping("/{seniorId}/detail/guardians")
    @Operation(summary = "✅ 시니어 상세 조회 (보호자만)", description = "시니어 상세 정보와 관련 보호자 정보를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시니어 상세 조회 (보호자) 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorDetailResponseDto>> getSeniorDetailGuardians(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId) {

        log.info("시니어 상세 조회 (보호자만) 요청: ID={}", seniorId);
        SeniorDetailResponseDto response = seniorService.getSeniorDetailByRole(seniorId, com.handi.backend.enums.Role.GUARDIAN);
        return ResponseEntity.ok(CommonResponseDto.success("시니어 관련 보호자 조회가 완료되었습니다.", response));
    }

    @GetMapping("/search")
    @Operation(summary = "✅ 시니어 검색", description = "조건에 따라 시니어를 검색합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시니어 검색 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "기관을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<PageResponseDto<SeniorResponseDto>>> searchSeniors(
            @Parameter(description = "기관 ID", example = "1")
            @RequestParam Integer organizationId,
            @Parameter(description = "이름 (부분 검색)", example = "김")
            @RequestParam(required = false) String name,
            @Parameter(description = "활성 상태", example = "true")
            @RequestParam(required = false) Boolean isActive,
            Pageable pageable) {

        log.info("시니어 검색 요청: organizationId={}, name={}, isActive={}", organizationId, name, isActive);
        PageResponseDto<SeniorResponseDto> response = seniorService.searchSeniors(organizationId, name, isActive, pageable);
        return ResponseEntity.ok(CommonResponseDto.success("시니어 검색이 완료되었습니다.", response));
    }

    @DeleteMapping("/{seniorId}")
    @Operation(summary = "✅ 시니어 삭제", description = "시니어를 삭제합니다. (소프트 삭제)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "시니어 삭제 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<Void>> deleteSenior(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId) {

        log.info("시니어 삭제 요청: ID={}", seniorId);
        seniorService.deleteSenior(seniorId);

        return ResponseEntity.ok(CommonResponseDto.success("시니어가 성공적으로 삭제되었습니다.", null));
    }

    @GetMapping("/note/{seniorId}")
    @Operation(summary = "✅ 시니어 메모 조회", description = "시니어 메모를 조회합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorMemoDto>> getSeniorMemo(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId
    ){
        log.info("시니어 메모 조회 요청 : {}", seniorId);

        SeniorMemoDto result = seniorService.getSeniorMemoById(seniorId);

        return ResponseEntity.ok(CommonResponseDto.success("시니어 메모 수정 완료", result)  );
    }

    @PutMapping("/note/{seniorId}")
    @Operation(summary = "✅ 시니어 메모 수정", description = "시니어 메모를 수정합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "시니어를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<SeniorMemoDto>> updateSeniorMemo(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "요청 데이터")
            @RequestBody SeniorMemoRequestDto seniorMemoDto
    ){
        log.info("시니어 메모 수정 요청 : {}", seniorId);

        SeniorMemoDto result = seniorService.updateSeniorMemoById(seniorId, seniorMemoDto);

        return ResponseEntity.ok(CommonResponseDto.success("시니어 메모 수정 완료", result)  );
    }
}