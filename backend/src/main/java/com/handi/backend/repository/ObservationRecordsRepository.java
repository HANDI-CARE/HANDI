package com.handi.backend.repository;

import com.handi.backend.entity.ObservationRecords;
import com.handi.backend.entity.Seniors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ObservationRecordsRepository extends JpaRepository<ObservationRecords, Integer> {
    Page<ObservationRecords> findBySeniorIdAndIsDeletedFalse(Integer seniorId, Pageable pageable);

    List<ObservationRecords> findBySeniorIdInAndCreatedAtBetweenAndIsDeletedFalseOrderByLevelAscCreatedAtDesc(List<Integer> seniorIds, LocalDateTime startDate, LocalDateTime endDate );

    Page<ObservationRecords> findBySeniorIdAndCreatedAtBetweenAndIsDeletedFalse(Integer seniorId, LocalDateTime start, LocalDateTime end, Pageable pageable);

    ObservationRecords findFirstBySeniorAndCreatedAtBetweenAndIsDeletedFalseOrderByLevelAscCreatedAtDesc(Seniors senior, LocalDateTime startDate, LocalDateTime endDate);

    @Modifying
    @Query(value = "ALTER SEQUENCE observation_records_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();

    @Modifying
    @Query("DELETE FROM ObservationRecords o WHERE o.senior.id = :seniorId")
    void deleteBySeniorId(@Param("seniorId") Integer seniorId);
}
