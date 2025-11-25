package com.handi.backend.controller;

import com.handi.backend.dto.ai.document.DocumentMaskRequest;
import com.handi.backend.dto.ai.document.DocumentDetectFromImageResponse;
import com.handi.backend.dto.ai.document.DocumentMaskResponse;
import com.handi.backend.service.FastApiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/ai/document")
@RequiredArgsConstructor
@Tag(name = "✅ AI Document", description = "FastAPI 개인정보마스킹")
public class AIDocumentController {

    private final FastApiService fastApiService;

    @PostMapping(value = "/detectAllFromImage",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "✅ 이미지에서 전체 텍스트 탐지", description = "FastAPI를 통해 이미지에서 전체 텍스츠를 분석합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "탐지 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 - 파일 누락"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<DocumentDetectFromImageResponse> detectAllByImage(
            @Parameter(description = "업로드할 이미지 파일", required = true)
            @RequestParam("file") MultipartFile file) throws Exception {
        try{
            DocumentDetectFromImageResponse response = fastApiService.detectFromImage(file, true);
            return ResponseEntity.ok(response);
        }catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PostMapping(value = "/detectEntitiesFromImage",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "✅ 이미지에서 개인정보만 탐지", description = "FastAPI를 통해 이미지에서 개인정보만 추출합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "탐지 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청 - 파일 누락"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<DocumentDetectFromImageResponse> detectEntitiesByImage(
            @Parameter(description = "업로드할 이미지 파일", required = true)
            @RequestParam("file") MultipartFile file) throws Exception {
        try{
            DocumentDetectFromImageResponse response = fastApiService.detectFromImage(file, false);
            return ResponseEntity.ok(response);
        }catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PostMapping(consumes = "multipart/form-data", value = "/documentMasking")
    @Operation(summary = "✅ 이미지 마스킹 함수", description = "FastAPI를 통해 이미지를 마스킹합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "마스킹 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청"),
        @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<byte[]> documentMasking (
            @Parameter(description = "마스킹 요청 데이터", required = true)
            @ModelAttribute DocumentMaskRequest request) throws Exception {
        try{
            DocumentMaskResponse response = fastApiService.documentMask(request);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf(response.getContentType()));
            headers.setContentDispositionFormData("attachment", response.getFilename());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(response.getImageData());
        }catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }
}

