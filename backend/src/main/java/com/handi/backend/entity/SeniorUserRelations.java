package com.handi.backend.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.handi.backend.enums.Role;
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

@Schema(description = "시니어-사용자 관계")
@Entity
@Table(name = "senior_user_relations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class SeniorUserRelations {
    @Schema(description = "복합키 (userId + seniorId)", example = "{\"userId\": 1, \"seniorId\": 1}")
    @EmbeddedId
    private SeniorUserRelationsId id;

    @Schema(description = "사용자")
    @JsonBackReference("user-senior-relations")
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private Users user;

    @Schema(description = "시니어")
    @JsonBackReference("senior-user-relations")
    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("seniorId")
    @JoinColumn(name = "senior_id")
    private Seniors senior;

    @Schema(description = "관계 역할 (EMPLOYEE: 직원, GUARDIAN: 보호자)", example = "GUARDIAN")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Schema(description = "생성 시각", example = "2024-01-15T10:00:00")
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Schema(description = "수정 시각", example = "2024-01-15T10:30:00")
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Schema(description = "삭제 여부", example = "false")
    @Column(name = "is_deleted")
    private Boolean isDeleted;


    // 편의 생성자
    public SeniorUserRelations(Users user, Seniors senior, Role role) {
        this.id = new SeniorUserRelationsId(user.getId(), senior.getId());
        this.user = user;
        this.senior = senior;
        this.role = role;
    }

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

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}