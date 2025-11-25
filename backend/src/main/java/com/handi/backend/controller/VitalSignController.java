package com.handi.backend.controller;

import com.handi.backend.dto.common.CommonResponseDto;
import com.handi.backend.dto.vital.signs.VitalSignsResponseDto;
import com.handi.backend.dto.vital.signs.VitalSignsUpdateRequest;
import com.handi.backend.service.VitalSignsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vitals")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "✅ Vital Sign", description = "환자별 활력징후")
public class VitalSignController {

    private final VitalSignsService vitalSignsService;

    @GetMapping("/seniors/{seniorId}")
    @Operation(summary = "✅ 환자 활력징후 조회",
            description = "특정 환자의 오늘 날짜 활력징후를 조회합니다. 오늘 데이터가 없으면 null 값으로 새로 생성합니다.")
            @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<VitalSignsResponseDto>> getVitalInfo(
            @Parameter(description = "시니어 ID", example = "1") @PathVariable Integer seniorId,
            @Parameter(description = "날짜 (yyyyMMdd)", example = "20250801") @RequestParam String date) {

        log.info("활력징후 조회 요청: seniorId={}, date={}", seniorId, date);

        VitalSignsResponseDto vitalSignsResponseDto = vitalSignsService.getVitalSignsBySeniorId(seniorId, date);

        // 활력징후는 매일 하나씩 있어야 하므로 따로 create를 만들지 않고 get으로 요청과 동시에 구현
        // 만약 없었으면 새로 만들었고, 있는거면 조회한다
        String message = (vitalSignsResponseDto.getSystolic() == null &&
                vitalSignsResponseDto.getDiastolic() == null &&
                vitalSignsResponseDto.getBloodGlucose() == null &&
                vitalSignsResponseDto.getTemperature() == null &&
                vitalSignsResponseDto.getHeight() == null &&
                vitalSignsResponseDto.getWeight() == null)
                ? "오늘 측정된 활력징후가 없어 빈 데이터를 생성했습니다."
                : "활력징후 조회가 완료되었습니다.";

        log.info("활력징후 조회 완료: seniorId={}, Data={}", seniorId, vitalSignsResponseDto);

        return ResponseEntity.ok(CommonResponseDto.success(message, vitalSignsResponseDto));


    }

    @PutMapping("/seniors/{seniorId}")
    @Operation(summary = "✅ 활력징후 수정", description = "오늘 활력징후 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "수정 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "403", description = "권한 없음"),
            @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<VitalSignsResponseDto>> updateVitalInfo(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "요청 데이터")
            @RequestBody VitalSignsUpdateRequest vitalSignsUpdateRequest,
            @Parameter(description = "날짜 (yyyyMMdd)", example = "20250801")
            @RequestParam @Pattern(regexp = "^\\d{8}$", message = "날짜는 yyyyMMdd 형식이어야 합니다") String date) {

        log.info("활력징후 수정 요청 : seniorId={}, date={}", seniorId, date);

        VitalSignsResponseDto vitalSignsResponseDto = vitalSignsService.updateVitalSigns(seniorId, vitalSignsUpdateRequest, date);

        log.info("활력징후 수정 성공 : seniorId={}", seniorId);

        return ResponseEntity.ok(CommonResponseDto.success("활력징후 수정 완료", vitalSignsResponseDto));

    }

    @GetMapping("/seniors/{seniorId}/range")
    @Operation(summary = "✅ 특정 날짜 활력징후 조회", description = "date = yyyyMMdd 형식으로 기재")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "조회 성공"), @ApiResponse(responseCode = "400", description = "잘못된 요청 - 날짜 형식 오류 또는 미래 날짜"), @ApiResponse(responseCode = "404", description = "환자를 찾을 수 없음")})
    public ResponseEntity<CommonResponseDto<List<VitalSignsResponseDto>>> getVitalInfoByDate(
            @Parameter(description = "시니어 ID", example = "1")
            @PathVariable Integer seniorId,
            @Parameter(description = "시작 날짜 (yyyyMMdd)", example = "20250801")
            @RequestParam(defaultValue = "") String startDate,
            @Parameter(description = "종료 날짜 (yyyyMMdd)", example = "20250807")
            @RequestParam(defaultValue = "") String endDate) {

        List<VitalSignsResponseDto> response = vitalSignsService.getVitalSignsByDate(seniorId, startDate, endDate);

        return ResponseEntity.ok(CommonResponseDto.success("활력징후 조회 완료", response));

    }


}