package com.handi.backend.repository;

import com.handi.backend.entity.MedicationSchedules;
import com.handi.backend.entity.Medications;
import com.handi.backend.enums.MedicationTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface MedicationsRepository extends JpaRepository<Medications, Integer> {
    @Query("SELECT m FROM Medications m WHERE m.medicationSchedules.senior.id = :seniorId AND m.medicationSchedule = :schedule")
    List<Medications> findBySeniorIdAndSchedule(@Param("seniorId") Integer seniorId, @Param("schedule") MedicationTime schedule);

    List<Medications> findByMedicationSchedules(MedicationSchedules medicationSchedules);

    List<Medications> findByMedicationSchedulesAndMedicationDate(MedicationSchedules schedule, LocalDate today);

    @Modifying
    @Query(value = "ALTER SEQUENCE medications_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();

    @Modifying
    @Query("DELETE FROM Medications m WHERE m.medicationSchedules.senior.id = :seniorId")
    void deleteBySeniorId(@Param("seniorId") Integer seniorId);
}
