package com.handi.backend.dto.ai.video;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VideoRabbitMQRequest {
    private String type;
    private VideoSummaryRequest data;
}
