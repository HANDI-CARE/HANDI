package com.handi.backend.repository;

import com.handi.backend.entity.MedicationSchedules;
import com.handi.backend.entity.Seniors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface MedicationSchedulesRepository extends JpaRepository<MedicationSchedules, Integer> {
    List<MedicationSchedules> findBySenior(Seniors seniors);
    Page<MedicationSchedules> findBySeniorIdAndMedicationEnddateGreaterThanEqualAndMedicationStartdateLessThanEqual(Integer seniorId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * 삭제되지 않은 투약 스케줄 조회
     */
    List<MedicationSchedules> findBySeniorAndIsDeletedFalse(Seniors seniors);

    /**
     * 특정 시니어의 삭제되지 않은 투약 스케줄 조회 (날짜 범위)
     */
    Page<MedicationSchedules> findBySeniorIdAndMedicationEnddateGreaterThanEqualAndMedicationStartdateLessThanEqualAndIsDeletedFalse(
            Integer seniorId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    /**
     * 삭제되지 않은 투약 스케줄 페이징 조회
     */
    Page<MedicationSchedules> findBySeniorAndIsDeletedFalse(Seniors senior, Pageable pageable);

    /**
     * 특정 시니어의 약물명으로 삭제되지 않은 투약 스케줄 검색
     */
    Page<MedicationSchedules> findBySeniorAndMedicationNameContainingAndIsDeletedFalse(Seniors senior, String medicationName, Pageable pageable);

    // 삭제되지 않은 것 중 오늘것들만
    List<MedicationSchedules> findBySeniorAndIsDeletedFalseAndMedicationStartdateLessThanEqualAndMedicationEnddateGreaterThanEqual(Seniors senior, LocalDate today1, LocalDate today2);

    @Modifying
    @Query(value = "ALTER SEQUENCE medication_schedules_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();

    @Modifying
    @Query("DELETE FROM MedicationSchedules m WHERE m.senior.id = :seniorId")
    void deleteBySeniorId(@Param("seniorId") Integer seniorId);
}
