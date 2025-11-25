package com.handi.backend.service;

import com.handi.backend.config.RabbitMQConfig;
import com.handi.backend.dto.ai.drug.DrugRabbitMQRequest;
import com.handi.backend.dto.ai.drug.DrugSummaryRequest;
import com.handi.backend.dto.ai.video.VideoRabbitMQRequest;
import com.handi.backend.dto.ai.video.VideoSummaryRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RabbitMQService {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMQConfig rabbitMQConfig;

    public void sendDrugSummaryRequest(DrugSummaryRequest drugInfoList) {
        try {
            rabbitTemplate.convertAndSend(
                    rabbitMQConfig.getExchangeName(),
                    rabbitMQConfig.getRoutingKey(),
                    new DrugRabbitMQRequest("drug-summary", drugInfoList)
            );
            log.info("Drug summary request sent: {}", drugInfoList);
        } catch (Exception e) {
            log.error("Failed to send drug summary request", e);
            throw new RuntimeException("Failed to send drug summary request", e);
        }
    }

    public void sendVideoSummaryRequest(VideoSummaryRequest videoConsultationData) {
        try {
            rabbitTemplate.convertAndSend(
                    rabbitMQConfig.getExchangeName(),
                    rabbitMQConfig.getRoutingKey(),
                    new VideoRabbitMQRequest("video-summary", videoConsultationData)
            );
            log.info("Video consultation summary request sent: {}", videoConsultationData);
        } catch (Exception e) {
            log.error("Failed to send video consultation summary request", e);
            throw new RuntimeException("Failed to send video consultation summary request", e);
        }
    }

    @Deprecated
    public void sendToFastAPI(DrugSummaryRequest  message) {
        sendDrugSummaryRequest(message);
    }
}
