package com.handi.backend.entity;

import com.handi.backend.enums.ConsultationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Schema(description = "미팅 매칭 결과")
@Entity
@Table(name = "meeting_matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingMatches {
    
    @Schema(description = "매칭 ID (PK)", example = "1")
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Schema(description = "간호사 사용자")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Users employee;

    @Schema(description = "보호자 사용자")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Users guardian;

    @Schema(description = "시니어")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senior_id", nullable = false)
    private Seniors senior;

    @Schema(description = "매칭된 미팅 시간", example = "20250101T12:12:12")
    @Column(name = "meeting_time", nullable = false)
    private LocalDateTime meetingTime;

    @Schema(description = "매칭 생성 시각", example = "20250101T12:12:12")
    @Column(name = "matched_at", nullable = false)
    private LocalDateTime matchedAt;

    @Schema(description = "레코드 생성 시각", example = "20250101T12:12:12")
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Schema(description = "매칭 상태", allowableValues = {"PENDING", "CONDUCTED", "CANCELED"}, example = "PENDING")
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ConsultationStatus status;

    @Schema(description = "매칭 알고리즘 정보", example = "BackTracking")
    @Column(name = "algorithm_info")
    private String algorithmInfo;

    @Schema(description = "상담 제목", example =  "정기 상담")
    @Column(name = "title")
    private String title;

    @Schema(description = "상담 분류", allowableValues = {"withEmployee", "withDoctor"}, example = "withEmployee")
    @Column(name = "meeting_type")
    private String meetingType;

    @Schema(description = "상담 내용", example = "정기 상담 입니다.")
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Schema(description = "수정 시각", example = "20250101T12:12:12")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Schema(description = "화상 회의 코드", example = "MEET0001")
    @Column(name = "code")
    private String code;

    @Schema(description = "상담 녹화/자료 MinIO URL")
    @Column(name = "minio_url")
    private String minioUrl;

    @Schema(description = "화상 채팅방 입장 가능 시간", example = "20250101T12:12:12")
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Schema(description = "화상 채팅방 입장 종료 시간", example = "20250101T12:12:12")
    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Schema(description = "진료 분류", example = "내과")
    @Column(name = "classification")
    private String classification;

    @Schema(description = "병원 이름", example = "서울 병원")
    @Column(name = "hospital_name")
    private String hospitalName;

    @Schema(description = "의사 이름", example = "김의사")
    @Column(name = "doctor_name")
    private String doctorName;

    @Schema(description = "삭제 여부", example = "false")
    @Column(name = "is_deleted")
    private Boolean isDeleted;


    @PrePersist
    protected void onCreate() {
        if (matchedAt == null) {
            matchedAt = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ConsultationStatus.CONDUCTED;
        }
        if(meetingType == null){
            meetingType = "withEmployee";
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

}