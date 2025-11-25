package com.handi.backend.repository;

import com.handi.backend.entity.Seniors;
import com.handi.backend.entity.VitalSigns;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface VitalSignsRepository extends JpaRepository<VitalSigns, Integer> {
    @Query("SELECT v FROM VitalSigns v WHERE v.senior.id = :seniorId AND v.measuredDate = :measuredDate")
    VitalSigns findBySeniorIdAndMeasuredDate(@Param("seniorId") Integer seniorId, @Param("measuredDate") LocalDate measuredDate);

    List<VitalSigns> findBySeniorAndMeasuredDateBetweenOrderByMeasuredDateAsc(Seniors senior, LocalDate startDate, LocalDate endDate);

    @Modifying
    @Query(value = "ALTER SEQUENCE vital_signs_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();

    @Modifying
    @Query("DELETE FROM VitalSigns v WHERE v.senior.id = :seniorId")
    void deleteBySeniorId(@Param("seniorId") Integer seniorId);
}