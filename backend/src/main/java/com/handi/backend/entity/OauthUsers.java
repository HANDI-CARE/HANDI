package com.handi.backend.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.handi.backend.enums.SocialProvider;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Schema(description = "OAuth 계정")
@Entity
@Table(name = "oauth_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class) // 이게 있어야 CreatedDate가 작동함
public class OauthUsers {
    @Schema(description = "PK", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Schema(description = "소셜 로그인 프로바이더", example = "GOOGLE")
    @Column(name = "social_provider", nullable = false)
    @Enumerated(EnumType.STRING)
    private SocialProvider socialProvider;

    @Schema(description = "소셜 로그인 프로바이더 user ID", example = "1234567890")
    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;

    @Schema(description = "email", example = "user@gmail.com")
    @Column(nullable = false, unique = true)
    private String email;

    @Schema(description = "이름", example = "김철수")
    private String name;

    @Schema(description = "휴대폰 번호", example = "01012345678")
    @Column(name = "phone_number")
    private String phoneNumber;

    @Schema(description = "프로필 이미지 URL", example = "https://lh3.googleusercontent.com/a/example")
    @Column(name = "profile_image_url", length = 2000)
    private String profileImageUrl;

    @Schema(description = "생성 시각", example = "2024-01-15T10:00:00")
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Schema(description = "수정 시각", example = "2024-01-15T15:30:00")
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Schema(description = "삭제 여부", example = "false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    // 부모 엔티티의 작업을 자식 엔티티에 자동 전파
    // persist, merge, remove, refresh, detach
    @OneToOne(mappedBy = "oauthUser", cascade = CascadeType.ALL)
    @JsonManagedReference
    private Users user;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isDeleted == null) {
            isDeleted = true;
        }
        // profileImageUrl의 길이가 1000자 이상이 되는 경우 이 필드를 제외하고 저장
        // 255 이상 저장하려할 때 따로 설정해주지 않으면 -> SqlExceptionHelper
        if (this.profileImageUrl != null && this.profileImageUrl.length() > 2000) {
            this.profileImageUrl = null;
        }
    }

    // 수정 시각 default
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}