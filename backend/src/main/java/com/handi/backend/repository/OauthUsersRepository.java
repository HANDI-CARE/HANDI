package com.handi.backend.repository;

import com.handi.backend.entity.OauthUsers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface OauthUsersRepository extends JpaRepository<OauthUsers, Integer> {
    /**
     * 이메일로 OAuth 계정 조회
     *
     * @param email unique 이메일
     * @return Optional<OAuthUsers>
     */
    Optional<OauthUsers> findByEmail(String email);

    @Modifying
    @Query(value = "ALTER SEQUENCE oauth_users_id_seq RESTART WITH 1", nativeQuery = true)
    void resetAutoIncrement();
}
