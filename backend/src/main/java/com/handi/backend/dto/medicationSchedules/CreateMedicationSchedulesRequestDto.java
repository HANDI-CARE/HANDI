package com.handi.backend.dto.medicationSchedules;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.handi.backend.dto.ai.drug.DrugInfoSimple;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Schema(description = "투약 스케줄 생성 요청")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateMedicationSchedulesRequestDto {
    
    @Schema(description = "직렬화된 JSON 데이터", required = true,
            example = "{\"medicationName\":\"녹색영양제\",\"startDate\":\"20250810\",\"endDate\":\"20250817\",\"description\":{\"drug_candidates\":[{\"image\":\"https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/1Oi0vWfEzG0\",\"dosage\":\"\",\"category\":\"소화성궤양용제\",\"extraInfo\":\"시메티딘\",\"appearance\":\"이약은연녹색의원형정제이다.\",\"dosageForm\":\"원형\",\"productName\":\"타가틴정\",\"thicknessMm\":\"4.7\",\"formCodeName\":\"나정\",\"manufacturer\":\"위더스제약(주)\",\"similarity_score\":1}]},\"medicationTime\":[\"BEFORE_LUNCH\"],\"drug_summary\":[{\"name\":\"팜시버정\",\"capacity\":\"250mg\"}]}")
    private String data;
    
    private String medicationName;
    private String startDate;
    private String endDate;
    private Map<String, Object> description;
    private String[] medicationTime;
    private List<DrugInfoSimple> drug_summary;
    
    private static final ObjectMapper objectMapper = new ObjectMapper();
    
    public void parseFromData() throws JsonProcessingException {
        if (data == null || data.trim().isEmpty()) {
            throw new IllegalArgumentException("data 필드는 필수입니다.");
        }
        
        // JSON 문자열 전처리: 제어 문자 제거 및 정리
        String cleanedData = data
                .replaceAll("\\r\\n", "")  // Windows 줄바꿈
                .replaceAll("\\n", "")     // Unix 줄바꿈  
                .replaceAll("\\r", "")     // Mac 줄바꿈
                .replaceAll("\\t", "")     // 탭 문자
                .trim();
        
        JsonNode jsonNode = objectMapper.readTree(cleanedData);
        
        this.medicationName = jsonNode.has("medicationName") ? jsonNode.get("medicationName").asText() : null;
        this.startDate = jsonNode.has("startDate") ? jsonNode.get("startDate").asText() : null;
        this.endDate = jsonNode.has("endDate") ? jsonNode.get("endDate").asText() : null;
        
        if (jsonNode.has("description")) {
            this.description = objectMapper.convertValue(jsonNode.get("description"), new TypeReference<Map<String, Object>>() {});
        }
        
        if (jsonNode.has("medicationTime")) {
            this.medicationTime = objectMapper.convertValue(jsonNode.get("medicationTime"), String[].class);
        }
        
        if (jsonNode.has("drug_summary")) {
            this.drug_summary = objectMapper.convertValue(jsonNode.get("drug_summary"), new TypeReference<List<DrugInfoSimple>>() {});
        }
    }
}
