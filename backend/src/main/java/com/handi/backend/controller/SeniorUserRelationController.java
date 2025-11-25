package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.senior.SeniorEmployeeRelationRequestDto;
import com.handi.backend.dto.senior.SeniorGuardianRelationRequestDto;
import com.handi.backend.service.SeniorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/senior-relations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ SeniorUserRelation", description = "시니어-사용자 관계 관리")
public class SeniorUserRelationController {

    private final SeniorService seniorService;

    @PostMapping("/{seniorId}/employees")
    @Operation(summary = "✅ 시니어-직원 관계 생성", description = "시니어와 여러 직원 간의 관계를 일괄 생성합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "직원 관계 생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "시니어 또는 직원을 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<Void>> createSeniorEmployeeRelation(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "요청 데이터")
            @Valid @RequestBody SeniorEmployeeRelationRequestDto request) {

        log.info("✅ 시니어-직원 관계 생성 요청: seniorId={}, employeeIds={}",
                seniorId, request.getEmployeeIds());
        seniorService.createSeniorEmployeeRelation(seniorId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CommonResponseDto.success("시니어-직원 관계가 성공적으로 생성되었습니다.", null));
    }

    @PostMapping("/{seniorId}/guardians")
    @Operation(summary = "✅ 시니어-보호자 관계 생성", description = "시니어와 여러 보호자 간의 관계를 일괄 생성합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "보호자 관계 생성 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "시니어 또는 보호자를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<Void>> createSeniorGuardianRelation(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "요청 데이터")
            @Valid @RequestBody SeniorGuardianRelationRequestDto request) {

        log.info("시니어-보호자 관계 생성 요청: seniorId={}, guardianIds={}", 
                seniorId, request.getGuardianIds());
        seniorService.createSeniorGuardianRelation(seniorId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CommonResponseDto.success("시니어-보호자 관계가 성공적으로 생성되었습니다.", null));
    }

    @DeleteMapping("/{seniorId}/user/{userId}")
    @Operation(summary = "✅ 시니어-사용자 관계 삭제", description = "시니어와 사용자 간의 관계를 삭제합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "관계 삭제 성공"),
            @ApiResponse(responseCode = "404", description = "관계를 찾을 수 없음")
    })
    public ResponseEntity<CommonResponseDto<Void>> deleteSeniorUserRelation(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "사용자 ID", example = "1")
            @PathVariable Integer userId) {

        log.info("시니어-사용자 관계 삭제 요청: seniorId={}, userId={}", seniorId, userId);
        seniorService.deleteSeniorUserRelation(seniorId, userId);

        return ResponseEntity.ok(CommonResponseDto.success("시니어-사용자 관계가 성공적으로 삭제되었습니다.", null));
    }
}