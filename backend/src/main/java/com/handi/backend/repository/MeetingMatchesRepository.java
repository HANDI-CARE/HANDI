package com.handi.backend.repository;

import com.handi.backend.entity.MeetingMatches;
import com.handi.backend.entity.Users;
import com.handi.backend.entity.Seniors;
import com.handi.backend.enums.ConsultationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MeetingMatchesRepository extends JpaRepository<MeetingMatches, Integer> {

    /**
     * ID로 미팅 조회 (연관 엔티티들을 즉시 로딩)
     */
    @Query("SELECT m FROM MeetingMatches m " +
            "LEFT JOIN FETCH m.employee " +
            "LEFT JOIN FETCH m.guardian " +
            "LEFT JOIN FETCH m.senior " +
            "WHERE m.id = :id")
    Optional<MeetingMatches> findByIdWithDetails(@Param("id") Integer id);


    /**
     * 특정 간호사의 매칭 결과 조회
     */
    List<MeetingMatches> findByEmployee(Users employee);

    /**
     * 특정 보호자의 매칭 결과 조회
     */
    List<MeetingMatches> findByGuardian(Users guardian);

    /**
     * 특정 시니어의 매칭 결과 조회
     */
    List<MeetingMatches> findBySenior(Seniors senior);

    /**
     * 특정 날짜 범위의 매칭 결과 조회
     */
    @Query("SELECT m FROM MeetingMatches m WHERE m.meetingTime BETWEEN :startDate AND :endDate ORDER BY m.meetingTime")
    List<MeetingMatches> findByMeetingTimeBetween(@Param("startDate") LocalDateTime startDate, 
                                                  @Param("endDate") LocalDateTime endDate);

    /**
     * 특정 상태의 매칭 결과 조회
     */
    List<MeetingMatches> findByStatus(ConsultationStatus status);

    /**
     * 특정 간호사의 특정 날짜 매칭 조회
     */
    @Query("SELECT m FROM MeetingMatches m WHERE m.employee = :employee AND DATE(m.meetingTime) = DATE(:date)")
    List<MeetingMatches> findByEmployeeAndMeetingDate(@Param("employee") Users employee, 
                                                      @Param("date") LocalDateTime date);

    /**
     * 특정 시니어의 최근 매칭 조회 (최신 1개)
     */
    @Query("SELECT m FROM MeetingMatches m WHERE m.senior = :senior ORDER BY m.createdAt DESC LIMIT 1")
    MeetingMatches findLatestMatchBySenior(@Param("senior") Seniors senior);

    /**
     * 매칭 통계 - 날짜별 매칭 수
     */
    @Query("SELECT DATE(m.meetingTime) as meetingDate, COUNT(m) as matchCount " +
           "FROM MeetingMatches m " +
           "WHERE m.meetingTime BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE(m.meetingTime) ")
    List<Object[]> getMatchingStatsByDateRange(@Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);

    /**
     * 특정 간호사의 매칭 수 카운트
     */
    @Query("SELECT COUNT(m) FROM MeetingMatches m WHERE m.employee = :employee AND m.status = :status")
    Long countByEmployeeAndStatus(@Param("employee") Users employee, @Param("status") String status);


    MeetingMatches findTopBySeniorAndMeetingTypeOrderByMeetingTimeDesc(Seniors senior, String meetingType);

    MeetingMatches findByEmployeeAndMeetingTime(Users employee, LocalDateTime meetingTime);

    Page<MeetingMatches> findByEmployeeAndMeetingTypeAndMeetingTimeAfter(Users user, String meetingType, LocalDateTime now, Pageable pageable);

    List<MeetingMatches> findByEmployeeAndStartedAtLessThanEqualAndEndedAtGreaterThanEqual(Users employee, LocalDateTime now, LocalDateTime end);

    List<MeetingMatches> findByGuardianAndStartedAtLessThanEqualAndEndedAtGreaterThanEqual(Users guardian, LocalDateTime now, LocalDateTime end);

    Page<MeetingMatches> findByEmployeeAndMeetingTypeAndMeetingTimeBetweenOrderByMeetingTimeAsc(Users user, String meetingType, LocalDateTime start, LocalDateTime end, Pageable pageable);

    Page<MeetingMatches> findByGuardianAndMeetingTypeAndMeetingTimeBetweenOrderByMeetingTimeAsc(Users user, String meetingType, LocalDateTime start, LocalDateTime end, Pageable pageable);

    @Modifying
    @Query(value = "ALTER SEQUENCE meeting_matches_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();

    @Modifying
    @Query("DELETE FROM MeetingMatches m WHERE m.senior.id = :seniorId")
    void deleteBySeniorId(@Param("seniorId") Integer seniorId);
}