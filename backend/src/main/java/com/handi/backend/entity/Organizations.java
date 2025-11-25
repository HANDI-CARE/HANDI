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

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Schema(description = "소속 기관")
public class Organizations {
    // PK
    @Schema(description = "기관 ID", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 기관명
    @Schema(description = "기관명", example = "하는대학요양원")
    @Column(nullable = false)
    private String name;

    // 아침시간
    @Schema(description = "아침식사 시간", example = "08:00:00")
    @Column(name = "breakfast_time")
    private LocalTime breakfastTime;

    // 점심시간
    @Schema(description = "점심식사 시간", example = "12:00:00")
    @Column(name = "lunch_time")
    private LocalTime lunchTime;

    // 저녁시간
    @Schema(description = "저녁식사 시간", example = "18:00:00")
    @Column(name = "dinner_time")
    private LocalTime dinnerTime;

    // 취침시간
    @Schema(description = "취침 시간", example = "22:00:00")
    @Column(name = "sleep_time")
    private LocalTime sleepTime;

    // 생성 시각
    @Schema(description = "생성 시각", example = "2024-01-15T10:00:00")
    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // 수정 시각
    @Schema(description = "수정 시각", example = "2024-01-15T15:30:00")
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
