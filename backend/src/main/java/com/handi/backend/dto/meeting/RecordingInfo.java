package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "녹화 정보 DTO")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RecordingInfo {
    @Schema(description = "파일명", example = "roomA-20250807100000.ogg")
    private String name;
    @Schema(description = "녹화 시작 시각(Unix ms)", example = "1723005600000")
    private long startedAt;
}
