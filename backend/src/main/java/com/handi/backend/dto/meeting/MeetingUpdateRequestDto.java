package com.handi.backend.dto.meeting;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingUpdateRequestDto {
    @Schema(description = "상담 제목", example = "정기 상담")
    private String title;

    @Schema(description = "상담 내용", example = "정기 상담 입니다.")
    private String content;

    @Schema(description = "진료 분류", example = "내과")
    private String classification;

    @Schema(description = "병원 이름", example = "서울 병원")
    private String hospitalName;

    @Schema(description = "의사 이름", example = "김의사")
    private String doctorName;

}
