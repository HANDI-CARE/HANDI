package com.handi.backend.repository;

import com.handi.backend.entity.OauthUsers;
import com.handi.backend.entity.Users;
import com.handi.backend.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Integer> {

    // OAuthUsers FK로 찾기
    Optional<Users> findByOauthUser(OauthUsers oauthUser);

    // OAuthUsers FK로 찾기
    Optional<Users> findByOauthUserId(Integer oauthUserId);

    // 이메일로 사용자 조회
    Optional<Users> findByEmail(String email);

    // 이메일 중복 검사
    boolean existsByEmail(String email);

    // 휴대폰 번호 중복 검사
    boolean existsByPhoneNumber(String phoneNumber);

    /**
     * 삭제되지 않은 사용자 목록 조회
     */
    Page<Users> findByIsDeletedFalse(Pageable pageable);

    /**
     * 삭제되지 않은 사용자 중 이름 또는 이메일에 키워드를 포함하는 목록 조회
     */
    Page<Users> findByNameContainingOrEmailContainingAndIsDeletedFalse(String nameKeyword, String emailKeyword, Pageable pageable);

    /**
     * 특정 역할의 사용자 목록 조회
     */
    List<Users> findByRole(Role role);

    /**
     * 특정 기관의 사용자 목록 조회
     *
     * @param organizationId 소속 기관 ID
     * @param pageable       page 정보
     * @return 사용자 목록
     */
    Page<Users> findByOrganizationId(Integer organizationId, Pageable pageable);

    /**
     * 특정 기관의 키워드를 포함하는 사용자 목록 조회
     *
     * @param organizationId 소속 기관 ID
     * @param keyword        키워드 문자열
     * @param pageable       page 정보
     * @return 사용자 목록
     */
    Page<Users> findByOrganizationIdAndNameContaining(Integer organizationId, String keyword, Pageable pageable);

    /**
     * 특정 조직의 특정 역할 사용자 목록 조회
     */
    List<Users> findByOrganizationIdAndRole(Integer organizationId, Role role);

    Page<Users> findByOrganizationIdAndRole(Integer organizationId, Role role, Pageable pageable);

    /**
     * 전체 사용자 이름 또는 이메일 검색 (삭제된 사용자 포함)
     */
    Page<Users> findByNameContainingOrEmailContaining(String nameKeyword, String emailKeyword, Pageable pageable);

    /**
     * 특정 기관의 사용자 목록 조회 (삭제되지 않은)
     */
    Page<Users> findByOrganizationIdAndIsDeletedFalse(Integer organizationId, Pageable pageable);

    /**
     * 특정 기관의 사용자 이름 검색 (삭제되지 않은)
     */
    Page<Users> findByOrganizationIdAndNameContainingAndIsDeletedFalse(Integer organizationId, String keyword, Pageable pageable);

    /**
     * 특정 기관의 특정 역할 사용자 목록 (삭제되지 않고 승인된)
     */
    Page<Users> findByOrganizationIdAndRoleAndIsDeletedFalse(Integer organizationId, Role role, Pageable pageable);

    /**
     * 특정 기관의 특정 역할 사용자 이름 검색 (삭제되지 않고 승인된)
     */
    Page<Users> findByOrganizationIdAndRoleAndNameContainingAndIsDeletedFalse(Integer organizationId, Role role, String keyword, Pageable pageable);

    Page<Users> findByOrganizationIdAndRoleAndNameContaining(Integer id, Role role, String keyword, Pageable pageable);

    @Modifying
    @Query(value = "ALTER SEQUENCE users_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();
}
