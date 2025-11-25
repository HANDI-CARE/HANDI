package com.handi.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.handi.backend.converter.StringArrayConverter;
import com.vladmihalcea.hibernate.type.json.JsonType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Convert;
import org.hibernate.annotations.Type;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "medication_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Schema(description = "투약 스케줄")
public class MedicationSchedules {
    // PK
    @Schema(description = "투약 스케줄 ID", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 환자 PK
    @Schema(description = "시니어 정보")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "medicationSchedules"})
    private Seniors senior;

    // 약 이름
    @Schema(description = "약물 이름", example = "아스피린")
    @Column(name = "medication_name")
    private String medicationName;

    // 투약 시작 날짜
    @Schema(description = "투약 시작 일자", example = "2024-01-15")
    @Column(name = "medication_startdate")
    private LocalDate medicationStartdate;

    // 투약 종료 날짜
    @Schema(description = "투약 종료 일자", example = "2024-02-15")
    @Column(name = "medication_enddate")
    private LocalDate medicationEnddate;

    // 생성 일자
    @Schema(description = "생성 시각", example = "2024-01-15T10:00:00")
    @Column(name = "created_at", updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    // 수정 시각
    @Schema(description = "수정 시각", example = "2024-01-15T15:30:00")
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 주의사항
    @Type(JsonType.class) // 핵심 매핑
    @Column(columnDefinition = "jsonb")
    @Schema(description = "주의사항", example = "식후 30분에 복용")
    private Map<String, Object> description;

    // 해당 약을 먹어야하는 시간
    @Schema(description = "투약 시간 배열", example = "[\"BEFORE_LUNCH\", \"AFTER_DINNER\"]")
    @Convert(converter = StringArrayConverter.class)
    @Column(name = "medication_times")
    private String[] medicationTime;

    // 삭제 여부
    @Schema(description = "삭제 여부", example = "false")
    @Column(name = "is_deleted")
    private Boolean isDeleted;

    // 생성일자 default
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

    // 수정 시각 default
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}