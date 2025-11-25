package com.handi.backend.dto.ai.video;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema(description = "화상상담 요약 요청 DTO")
@Data
public class VideoSummaryRequest {
    @Schema(description = "상담 ID", example = "123")
    private int id;
    @Schema(description = "파일 링크", example = "openvidu-appdata/roomA-20250807100000.ogg")
    private String link;
}
