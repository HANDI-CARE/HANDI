package com.handi.backend.repository;

import com.handi.backend.entity.Seniors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SeniorsRepository extends JpaRepository<Seniors, Integer> {

    /**
     * 특정 기관의 환자 목록 조회
     *
     * @param organizationId 소속 기관 ID
     * @param pageable       page 정보
     * @return 환자 목록
     */
    Page<Seniors> findByOrganizationId(Integer organizationId, Pageable pageable);

    /**
     * 단일 조회 시 삭제되지 않은 시니어만
     */
    @Query("SELECT s FROM Seniors s WHERE s.id = :id AND s.isDeleted = false")
    java.util.Optional<Seniors> findByIdAndIsDeletedFalse(@Param("id") Integer id);

    /**
     * 특정 기관의 활성/비활성 환자 목록 조회
     *
     * @param organizationId 소속 기관 ID
     * @param pageable       page 정보
     * @return 활성/비활성 환자 목록
     */
    Page<Seniors> findByOrganizationIdAndIsActiveTrue(Integer organizationId, Pageable pageable);

    /**
     * 특정 기관의 활성 환자 목록 조회
     *
     * @param organizationId 소속 기관 ID
     * @param pageable       page 정보
     * @return 활성 환자 목록
     */
    Page<Seniors> findByOrganizationIdAndIsActiveTrueAndIsDeletedFalse(Integer organizationId, Pageable pageable);

    /**
     * 특정 기관의 키워드를 포함하는 활성/비활성 환자 목록 조회
     *
     * @param organizationId 소속 기관 ID
     * @param keyword        키워드 문자열
     * @param pageable       page 정보
     * @return 활성/비활성 환자 목록
     */
    Page<Seniors> findByOrganizationIdAndNameContainingAndIsActiveTrue(Integer organizationId, String keyword, Pageable pageable);

    /**
     * 특정 기관의 키워드를 포함하는 활성 환자 목록 조회
     *
     * @param organizationId 소속 기관 ID
     * @param keyword        키워드 문자열
     * @param pageable       page 정보
     * @return 활성 환자 목록
     */
    Page<Seniors> findByOrganizationIdAndNameContainingAndIsActiveTrueAndIsDeletedFalse(Integer organizationId, String keyword, Pageable pageable);

    /**
     * 복합 조건으로 환자 검색
     *
     * @param organizationId 소속 기관 ID
     * @param name           이름 (포함 검색)
     * @param isActive       활성 상태
     * @param pageable       page 정보
     * @return 환자 목록
     */
    @Query("SELECT s FROM Seniors s WHERE s.organization.id = :organizationId " +
            "AND s.isDeleted = false " +
            "AND (:name IS NULL OR s.name LIKE %:name%) " +
            "AND (:isActive IS NULL OR s.isActive = :isActive)")
    Page<Seniors> findBySearchCriteria(@Param("organizationId") Integer organizationId,
                                       @Param("name") String name,
                                       @Param("isActive") Boolean isActive,
                                       Pageable pageable);

    /**
     * 특정 사용자와 관련된 시니어 목록 조회 (관계 테이블을 통해)
     *
     * @param userId   사용자 ID
     * @param pageable page 정보
     * @return 시니어 목록
     */
    @Query("SELECT s FROM Seniors s JOIN s.seniorUserRelations sur WHERE s.isDeleted = false AND sur.isDeleted = false AND sur.user.id = :userId")
    Page<Seniors> findByRelatedUserId(@Param("userId") Integer userId, Pageable pageable);

    @Query("SELECT s FROM Seniors s JOIN s.seniorUserRelations sur WHERE sur.user.id = :userId")
    List<Seniors> findByRelatedUserId(Integer userId);

    /**
     * 특정 사용자와 관련된 활성 시니어 목록 조회 (관계 테이블을 통해)
     *
     * @param userId   사용자 ID
     * @param pageable page 정보
     * @return 활성 시니어 목록
     */
    @Query("SELECT s FROM Seniors s JOIN s.seniorUserRelations sur WHERE s.isDeleted = false AND sur.isDeleted = false AND sur.user.id = :userId AND s.isActive = true")
    Page<Seniors> findByRelatedUserIdAndIsActiveTrue(@Param("userId") Integer userId, Pageable pageable);

    @Modifying
    @Query(value = "ALTER SEQUENCE seniors_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();
}
