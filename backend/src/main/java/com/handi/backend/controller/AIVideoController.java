package com.handi.backend.controller;

import com.handi.backend.dto.ai.video.VideoSummaryRequest;
import com.handi.backend.service.RabbitMQService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/video")
@RequiredArgsConstructor
@Tag(name = "✅ AI Video", description = "FastAPI 화상상담")
public class AIVideoController {

    private final RabbitMQService rabbitMQService;

    @PostMapping("/llm-summary")
    @Operation(summary = "✅ 화상상담 내역 요약 요청", description = "화상상담 내역을 FastAPI로 전송하여 요약을 요청합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "화상상담 요약 요청 성공"),
            @ApiResponse(responseCode = "500", description = "화상상담 요약 요청 실패")
    })
    public ResponseEntity<String> requestVideoConsultationSummary(
            @Parameter(description = "요약할 화상상담 내역", required = true)
            @RequestBody VideoSummaryRequest videoConsultationData) {
        try {
            rabbitMQService.sendVideoSummaryRequest(videoConsultationData);
            return ResponseEntity.ok("화상상담 요약 요청이 성공적으로 전송되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("화상상담 요약 요청 실패: " + e.getMessage());
        }
    }
}
