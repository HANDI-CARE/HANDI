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

@Entity
@Table(name = "document_library")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Schema(description = "문서 라이브러리")
public class DocumentLibrary {
    // PK
    @Schema(description = "문서 ID", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 환자 PK
    @Schema(description = "시니어 정보")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_id", nullable = false)
    private Seniors senior;

    // 문서 이름
    @Schema(description = "문서 이름", example = "건강검진결과서")
    @Column(name = "document_name")
    private String documentName;

    // 문서 이미지 링크
    @Schema(description = "원본 이미지 경로들 (JSON 배열 형태)", example = "[\"/documents/health_check_1.jpg\", \"/documents/health_check_2.jpg\"]")
    @Column(name = "original_photo_paths")
    private String originalPhotoPaths; // TEXT[] -> String으로 변환 (JSON 형태로 저장)

    // 업로드 시간
    @Schema(description = "업로드 시각", example = "2024-01-15T10:00:00")
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

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
    
    // 삭제여부
    @Schema(description = "삭제 여부", example = "false")
    @Column(name = "is_deleted")
    private Boolean isDeleted;

    // 생성 시간 default
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