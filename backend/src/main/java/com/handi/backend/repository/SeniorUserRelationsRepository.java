package com.handi.backend.repository;

import com.handi.backend.entity.SeniorUserRelations;
import com.handi.backend.entity.SeniorUserRelationsId;
import com.handi.backend.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SeniorUserRelationsRepository extends JpaRepository<SeniorUserRelations, SeniorUserRelationsId> {

    /**
     * 사용자 ID로 관련된 시니어 ID 목록 조회
     *
     * @param userId 사용자 ID
     * @return 시니어 ID 목록
     */
    @Query("SELECT sur.senior.id FROM SeniorUserRelations sur WHERE sur.isDeleted = false AND sur.user.id = :userId")
    List<Integer> findSeniorIdsByUserId(@Param("userId") Integer userId);

    /**
     * 시니어 ID로 관련된 사용자 관계 목록 조회
     *
     * @param seniorId 시니어 ID
     * @return 관계 목록
     */
    List<SeniorUserRelations> findBySeniorIdAndIsDeletedFalse(Integer seniorId);

    /**
     * 시니어 ID와 역할로 관계 목록 조회
     *
     * @param seniorId 시니어 ID
     * @param role     역할
     * @return 관계 목록
     */
    List<SeniorUserRelations> findBySeniorIdAndRoleAndIsDeletedFalse(Integer seniorId, Role role);

    /**
     * 특정 관계 존재 여부 확인
     *
     * @param userId   사용자 ID
     * @param seniorId 시니어 ID
     * @return 존재 여부
     */
    boolean existsByUserIdAndSeniorIdAndIsDeletedFalse(Integer userId, Integer seniorId);

    /**
     * 복합키로 관계 조회
     *
     * @param userId   사용자 ID
     * @param seniorId 시니어 ID
     * @return 관계 Optional
     */
    Optional<SeniorUserRelations> findByUserIdAndSeniorIdAndIsDeletedFalse(Integer userId, Integer seniorId);
}
