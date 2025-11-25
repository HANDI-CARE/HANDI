package com.handi.backend.repository;

import com.handi.backend.entity.DocumentLibrary;
import com.handi.backend.entity.Seniors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentLibraryRepository extends JpaRepository<DocumentLibrary, Integer> {
    Page<DocumentLibrary> findBySeniorAndIsDeletedFalseAndDocumentNameContaining(Seniors senior, String keyword, Pageable pageable);
    Page<DocumentLibrary> findBySeniorAndIsDeletedFalse(Seniors senior, Pageable pageable);

    List<DocumentLibrary> findBySeniorAndIsDeletedFalse(Seniors senior);

    @Modifying
    @Query(value = "ALTER SEQUENCE document_library_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();

    @Modifying
    @Query("DELETE FROM DocumentLibrary d WHERE d.senior.id = :seniorId")
    void deleteBySeniorId(@Param("seniorId") Integer seniorId);
}
