package com.handi.backend.dto.ai.drug;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DrugInfoBasic {
    private String productName;
    private String extraInfo;
    private String dosage;
    private String manufacturer;
    private String appearance;
    private String dosageForm;
    private String image;
    private String category;
    private String formCodeName;
    private String thicknessMm;
}
