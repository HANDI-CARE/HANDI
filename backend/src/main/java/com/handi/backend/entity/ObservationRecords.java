package com.handi.backend.entity;

import com.handi.backend.enums.Level;
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

@Entity
@Table(name = "observation_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Schema(description = "관찰일지")
public class ObservationRecords {
    // PK
    @Schema(description = "관찰일지 ID", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 환자 PK
    @Schema(description = "시니어 정보")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_id", nullable = false)
    private Seniors senior;

    // 내용
    @Schema(description = "관찰 내용", example = "오늘 어르신반이 평소보다 안좋아 보이신다. 식사량도 줄어들었고 활동성도 떨어져 보입니다.")
    @Column(length = 5000)
    private String content;

    // 중요도
    @Schema(description = "중요도 (HIGH, MEDIUM, LOW)", example = "MEDIUM")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level;

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
    @Column(name = "is_deleted")
    @Schema(description = "삭제 여부", nullable = false, example = "false")
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