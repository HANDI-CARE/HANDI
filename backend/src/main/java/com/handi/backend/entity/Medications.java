package com.handi.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.handi.backend.enums.MedicationTime;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Schema(description = "투약 기록")
public class Medications {
    // PK
    @Schema(description = "투약 기록 ID", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 투약 스케줄 PK
    @Schema(description = "투약 스케줄 정보")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_schedules_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private MedicationSchedules medicationSchedules;

    // 투약 이미지
    @Schema(description = "투약 이미지 경로", example = "/images/medication_20240115_100000.jpg")
    @Column(name = "medication_photo_path")
    private String medicationPhotoPath;

    // 투약 시간
    @Schema(description = "실제 투약 시각", example = "2024-01-15T10:00:00")
    @Column(name = "medicated_at")
    private LocalDateTime medicatedAt;

    // 시간 구분 ( 7가지 )
    @Schema(description = "투약 시간대 구분", example = "AFTER_BREAKFAST")
    @Enumerated(EnumType.STRING)
    @Column(name = "medication_schedule", nullable = false)
    private MedicationTime medicationSchedule;

    // 약 복용 날짜
    @Schema(description = "약 복용 일자", example = "2024-01-15")
    @Column(name = "medication_date")
    private LocalDate medicationDate;

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

    // 생성 시간 default
    // 처음 저장(INSERT)되기 직전에 호출되는 콜백 메서드
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