package com.handi.backend.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vital_signs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Schema(description = "활력징후 정보")
public class VitalSigns {
    // PK
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "활력징후 ID", example = "1")
    private Integer id;

    // 환자 PK
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_id", nullable = false)
    @Schema(description = "시니어 정보")
    private Seniors senior;

    // 최고 혈압
    @Schema(description = "최고 혈압 (mmHg)", example = "120")
    private Integer systolic;

    // 최저 혈압
    @Schema(description = "최저 혈압 (mmHg)", example = "80")
    private Integer diastolic;

    // 혈당
    @Column(name = "blood_glucose")
    @Schema(description = "혈당 (mg/dL)", example = "100")
    private Integer bloodGlucose;

    // 체온
    @Column(precision = 4, scale = 1)
    @Schema(description = "체온 (°C)", example = "36.5")
    private BigDecimal temperature;

    // 키
    @Column(precision = 4, scale = 1)
    @Schema(description = "키 (cm)", example = "165.0")
    private BigDecimal height;

    // 몸무게
    @Column(precision = 4, scale = 1)
    @Schema(description = "몸무게 (kg)", example = "65.0")
    private BigDecimal weight;

    // 측정일자
    @Schema(description = "활력징후 측정일자", example = "2024-01-15")
    @Column(name = "measured_date")
    private LocalDate measuredDate;
    // 생성 시각
    @Schema(description = "생성 시각", example = "2024-01-15T10:00:00")
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // 수정 시각
    @Schema(description = "수정 시각", example = "2024-01-15T10:30:00")
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 삭제 여부
    @Schema(description = "삭제 여부", example = "false")
    @Column(name = "is_deleted")
    private Boolean isDeleted;

    //  default
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}