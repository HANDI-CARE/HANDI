package com.handi.backend.dto.medication;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Schema(description = "투약 사진 업로드 요청")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MedicationUploadRequestDto {
    @Schema(description = "환자 ID", example = "1")
    private Integer seniorId;

    @Schema(description = "업로드할 사진 파일")
    private MultipartFile multipartFile;
}
