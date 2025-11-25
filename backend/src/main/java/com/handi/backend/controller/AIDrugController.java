package com.handi.backend.controller;

import com.handi.backend.dto.ai.drug.DrugSearchRequest;
import com.handi.backend.dto.ai.drug.DrugSummaryRequest;
import com.handi.backend.dto.ai.drug.DrugDetectByImageResponse;
import com.handi.backend.dto.ai.drug.DrugSearchByNameResponse;
import com.handi.backend.service.FastApiService;
import com.handi.backend.service.RabbitMQService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/ai/drug")
@RequiredArgsConstructor
@Tag(name = "✅ AI Drug", description = "FastAPI 의약정보")
public class AIDrugController {

    private final RabbitMQService rabbitMQService;
    private final FastApiService fastApiService;

    @PostMapping("/llm-summary")
    @Operation(summary = "✅ 의약정보 요약 요청", description = "의약정보를 FastAPI로 전송하여 요약을 요청합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "의약정보 요약 요청 성공"),
            @ApiResponse(responseCode = "500", description = "의약정보 요약 요청 실패")
    })
    public ResponseEntity<String> requestDrugSummary(
            @Parameter(description = "요약할 의약정보", required = true)
            @RequestBody DrugSummaryRequest drugInfoList) {
        try {
            rabbitMQService.sendDrugSummaryRequest(drugInfoList);
            return ResponseEntity.ok("의약정보 요약 요청이 성공적으로 전송되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("의약정보 요약 요청 실패: " + e.getMessage());
        }
    }

    @PostMapping("/searchByName")
    @Operation(summary = "✅ 이름으로 약물 검색", description = "기본 약품을 FastAPI로 검색합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "검색 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<DrugSearchByNameResponse> searchByName(
            @Parameter(description = "검색 요청", required = true)
            @RequestBody @Valid DrugSearchRequest request){
        try{
            DrugSearchByNameResponse response = fastApiService.searchByName(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PostMapping(value = "/detectByImage",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "✅ 이미지에서 약물 탐지", description = "FastAPI를 통해 이미지에서 약품을 탐지합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "탐지 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 - 파일 누락"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<DrugDetectByImageResponse> detectByImage(
            @Parameter(description = "업로드할 이미지 파일", required = true)
            @RequestParam("file") MultipartFile file) throws Exception {
        try{
            DrugDetectByImageResponse response = fastApiService.detectDrugFromImage(file);
            return ResponseEntity.ok(response);
        }catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }
}
