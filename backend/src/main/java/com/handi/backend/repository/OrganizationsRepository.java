package com.handi.backend.repository;

import com.handi.backend.entity.Organizations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationsRepository extends JpaRepository<Organizations, Integer> {
    // save(생성, 갱신), findById, deleteById

    /**
     * 문자열과 일치하는 기관을 조회
     * @param name 문자열
     * @return Organizations
     */
    Organizations findByName(String name);

    /**
     * 특정 문자열을 가진 기관을 조회
     * @param keyword 문자열
     * @param pageable 페이지 쿼리 정보
     * @return Organizations
     */
    Page<Organizations> findByNameContaining(String keyword, Pageable pageable);

    /**
     * 삭제되지 않은 기관 페이징 조회
     */
    Page<Organizations> findAllByIsDeletedFalse(Pageable pageable);

    /**
     * 삭제되지 않은 기관 이름 검색
     */
    Page<Organizations> findByNameContainingAndIsDeletedFalse(String keyword, Pageable pageable);

    /**
     * 삭제되지 않은 단건 조회
     */
    @Query("SELECT o FROM Organizations o WHERE o.id = :id AND o.isDeleted = false")
    java.util.Optional<com.handi.backend.entity.Organizations> findByIdAndIsDeletedFalse(@Param("id") Integer id);

    @Modifying
    @Query(value = "ALTER SEQUENCE organizations_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();
}
