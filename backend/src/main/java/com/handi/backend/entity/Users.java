package com.handi.backend.entity;

import com.handi.backend.enums.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

// spring security 규칙을 위한 UserDetails 구현체이기도 함 (중요)
@Schema(description = "사용자")
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Users implements UserDetails {
    @Schema(description = "PK", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // OAuth User FK
    @Schema(description = "OAuth 사용자 ID")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "oauth_user_id",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_users_oauth", foreignKeyDefinition = "FOREIGN KEY (oauth_user_id) REFERENCES oauth_users(id) ON DELETE SET NULL")
    ) // name은 따로 따라야 하는 규칙은 없음
    private OauthUsers oauthUser;

    // 소속기관
    @Schema(description = "소속기관", example = "1")
    @Column(name = "organization_id")
    private Integer organizationId;

    // Role ( EMPLOYEE, ADMIN, GUARDIAN )
    @Schema(description = "역할", example = "EMPLOYEE")
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    // email
    @Schema(description = "email", example = "user@example.com")
    @Column(nullable = false, unique = true)
    private String email;

    // 이름
    @Schema(description = "이름", example = "김철수")
    @Column(nullable = false)
    private String name;

    // 휴대폰 번호
    @Schema(description = "휴대폰 번호", example = "01012345678")
    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    // 프로필 이미지 URL
    @Schema(description = "프로필 이미지 URL", example = "https://example.com/profile.jpg")
    @Column(name = "profile_image_url", length = 2000)
    private String profileImageUrl;

    // 주소
    @Schema(description = "주소", example = "서울시 강남구 테헤란로 123")
    private String address;

    // FCM Token
    @Schema(description = "FCM Token", example = "dKj2L3m4N5o6P7q8R9s0T1u2V3w4X5y6Z7a8B9c0D1e2F3g4")
    @Column(name = "fcm_token")
    private String fcmToken;

    // 생성일자
    @Schema(description = "생성 시각", example = "2024-01-15T10:00:00")
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // 수정일자
    @Schema(description = "수정 시각", example = "2024-01-15T15:30:00")
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 삭제 여부
    @Schema(description = "삭제 여부", example = "false")
    @Column(name = "is_deleted")
    private Boolean isDeleted;

    // default value 설정
    @PrePersist
    protected void onCreate() {
        if (isDeleted == null) {
            isDeleted = false;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role != null) {
            return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getUsername() {
        return this.email;  // 로그인 식별자로 email 사용
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !Boolean.TRUE.equals(isDeleted);
    }
}