package com.handi.backend.dto.meeting;

import com.handi.backend.dto.observation.record.Guardian;
import com.handi.backend.dto.observation.record.Nurse;
import com.handi.backend.dto.observation.record.Senior;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingMatchesResponseDto {
    @Schema(description = "상담 PK")
    private Integer id;

    @Schema(description = "간호사")
    private Nurse nurse;

    @Schema(description = "보호자")
    private Guardian guardian;

    @Schema(description = "환자")
    private Senior senior;

    @Schema(description = "매칭 시간", example = "20250807151515")
    private String meetingTime;

    @Schema(description = "매칭 상태", example = "SCHEDULED")
    private String status;

    @Schema(description = "상담 제목", example = "정기 상담")
    private String title;

    @Schema(description = "상담 분류", allowableValues = {"withEmployee", "withDoctor"}, example = "withEmployee")
    private String meetingType;

    @Schema(description = "상담 내용", example = "정기 상담 입니다.")
    private String content;

    @Schema(description = "진료 분류", example = "내과")
    private String classification;

    @Schema(description = "병원 이름", example = "서울 병원")
    private String hospitalName;

    @Schema(description = "의사 이름", example = "김의사")
    private String doctorName;

    @Schema(description = "화상 채팅방 입장 가능 시간", example = "20250101121212")
    private String startedAt;

    @Schema(description = "화상 채팅방 입장 종료 시간", example = "20250101121212")
    private String endedAt;

}
