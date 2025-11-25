package com.handi.backend.dto.medicationSchedules;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Schema(description = "투약 스케줄 응답")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicationSchedulesResponseDto {
    @Schema(description = "투약 스케줄 ID", example = "1")
    private Integer id;

    @Schema(description = "환자 ID", example = "1")
    private Integer seniorId;

    @Schema(description = "환자 이름", example = "김할머니")
    private String seniorName;

    @Schema(description = "약물 이름", example = "아스피린")
    private String medicationName;

    @Schema(description = "시작 날짜", example = "20250803")
    private String startDate;

    @Schema(description = "종료 날짜", example = "20250810")
    private String endDate;

    @Schema(
            description = "복용 설명",
            example = "{\n" +
                    "  \"drug_candidates\": [\n" +
                    "    {\n" +
                    "      \"image\": \"https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0\",\n" +
                    "      \"dosage\": \"\",\n" +
                    "      \"category\": \"소화성궤양용제\",\n" +
                    "      \"extraInfo\": \"시메티딘\",\n" +
                    "      \"appearance\": \"이약은연녹색의원형정제이다.\",\n" +
                    "      \"dosageForm\": \"원형\",\n" +
                    "      \"description\": {\n" +
                    "        \"상세\": {\n" +
                    "          \"용법 및 용량\": \"노인 환자는 신장 기능이 저하될 수 있으므로, 일반 성인 용법인 1회 400mg을 하루 2회 또는 취침 시 800mg으로 투여할 수 있지만, 신장 기능에 따라 용량을 조절해야 합니다. 필요 시 1회 300mg을 하루 4회로 나누어 복용할 수 있으며, 최대 1일 2.4g을 초과하지 않도록 주의해야 합니다.\",\n" +
                    "          \"효능 및 효과\": \"타가틴정은 위염, 위 및 십이지장 궤양, 역류성 식도염 등의 증상을 개선하는 데 도움을 줍니다. 특히 노인 환자에게는 위 점막의 병변을 개선하여 소화기 건강을 유지하는 데 중요한 역할을 합니다.\",\n" +
                    "          \"복약 시 주의 사항\": \"타가틴정을 복용할 때는 졸음이 올 수 있으므로 운전이나 위험한 기계 조작을 피해야 합니다. 또한, 신장 기능이 저하된 환자는 용량을 조절해야 하며, 유당을 함유하고 있어 유당불내증이 있는 환자는 복용을 피해야 합니다. 이 약물은 다른 약물과 상호작용할 수 있으므로, 특히 쿠마린계 항응고제와 함께 복용할 경우 프로트롬빈 시간을 주의 깊게 관찰해야 합니다.\"\n" +
                    "        },\n" +
                    "        \"키워드\": {\n" +
                    "          \"용법 및 용량\": \"1회 400mg, 하루 2회, 취침 시 800mg 가능\",\n" +
                    "          \"효능 및 효과\": \"위염 개선, 궤양 치료, 역류성 식도염 완화\",\n" +
                    "          \"복약 시 주의 사항\": \"졸음 주의, 신장 기능 저하 시 용량 조절, 유당불내증 주의\"\n" +
                    "        }\n" +
                    "      },\n" +
                    "      \"productName\": \"타가틴정\",\n" +
                    "      \"thicknessMm\": \"4.7\",\n" +
                    "      \"formCodeName\": \"나정\",\n" +
                    "      \"manufacturer\": \"위더스제약(주)\",\n" +
                    "      \"similarity_score\": 1\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}"
    )
    private Map<String, Object>  description;

    @Schema(description = "복용 시간 배열", example = "[\"AFTER_BREAKFAST\", \"AFTER_DINNER\"]")
    private String[] medicationTimes;

    @Schema(description = "생성일자", example = "20250803090000")
    private String createdAt;

    @Schema(description = "수정일자", example = "20250803091000")
    private String updatedAt;
}
