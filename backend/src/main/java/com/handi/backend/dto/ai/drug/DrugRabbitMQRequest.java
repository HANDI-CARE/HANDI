package com.handi.backend.dto.ai.drug;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DrugRabbitMQRequest {
    private String type;
    private DrugSummaryRequest data;
}
