package com.handi.backend.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.handi.backend.enums.Gender;
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
import java.util.List;


@Entity
@Table(name = "seniors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Schema(description = "환자 (시니어)")
public class Seniors {
    @Schema(description = "PK")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 소속기관과의 관계
    @Schema(description = "소속기관")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", referencedColumnName = "id")
    private Organizations organization;

    // 환자이름
    @Schema(description = "환자 이름", example = "김할머니")
    @Column(nullable = false)
    private String name;

    // 생년월일
    @Schema(description = "생년월일", example = "2024-01-15")
    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    // 성별
    @Schema(description = "성별", example = "FEMALE")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    // 입소일자
    @Schema(description = "입소일자", example = "2024-02-01")
    @Column(name = "admission_date")
    private LocalDate admissionDate;

    // 퇴소일자
    @Schema(description = "퇴소일자", example = "2024-03-01")
    @Column(name = "discharge_date")
    private LocalDate dischargeDate;

    // 환자 메모
    @Schema(description = "기타 메모")
    @Column(length = 10000)
    private String note;

    // 활성 상태 (퇴소 여부)
    @Schema(description = "활성 상태 (false: 퇴소)", example = "true")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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

    // SeniorUserRelations와의 양방향 관계
    @JsonManagedReference
    @OneToMany(mappedBy = "senior", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SeniorUserRelations> seniorUserRelations;

    // 입소일 default
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = false;
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