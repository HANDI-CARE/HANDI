package com.handi.backend.dto.medication;

import com.handi.backend.enums.MedicationTime;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Schema(description = "투약 내역 정보")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicationsDto {

   @Schema(description = "투약 내역 ID", example = "1")
   private Integer id;
   
   @Schema(description = "투약 사진 경로", example = "https://example.com/medication-photo.jpg", nullable = true)
   private String medicationPhotoPath;
   
   @Schema(description = "투약 시간", example = "20250803090000", nullable = true)
   private String medicatedAt;
   
   @Schema(description = "투약 시간대", example = "AFTER_BREAKFAST")
   private MedicationTime medicationTime;
   
   @Schema(description = "투약 날짜", example = "20250803")
   private String medicationDate;

    @Schema(description = "생성일자", example = "20250803090000")
    private String createdAt;

    @Schema(description = "수정일자", example = "20250803091000")
    private String updatedAt;
}
