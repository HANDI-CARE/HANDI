package com.handi.backend.dto.medicationSchedules;

import com.handi.backend.dto.ai.drug.DrugInfoSimple;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Schema(description = "투약 스케줄 수정 요청")

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMedicationSchedulesRequestDto {
    @Schema(description = "약물 이름", example = "고혈압 치료제")
    private String medicationName;

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
                    "      \"productName\": \"타가틴정\",\n" +
                    "      \"thicknessMm\": \"4.7\",\n" +
                    "      \"formCodeName\": \"나정\",\n" +
                    "      \"manufacturer\": \"위더스제약(주)\",\n" +
                    "      \"similarity_score\": 1\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}"
    )
    private Map<String, Object> description;

    @Schema(description = "약물 요약 정보 배열")
    private List<DrugInfoSimple> drug_summary;
}
