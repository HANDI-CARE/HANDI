package com.handi.backend.dto.meeting;

import com.handi.backend.enums.ConsultationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingMatchesStatusDto {
    @Schema(description = "매칭 ID (PK)", example = "1")
    private Integer id;

    @Schema(description = "매칭 상태", allowableValues = {"PENDING", "CONDUCTED", "CANCELED"}, example = "PENDING")
    private ConsultationStatus status;
}
