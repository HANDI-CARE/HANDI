package com.handi.backend.service;

import com.handi.backend.enums.Role;
import com.handi.backend.util.JwtTokenProvider;
import com.handi.backend.util.PhoneNumberUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final PhoneNumberUtil phoneNumberUtil;

    // 키 네이밍 상수
    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";

    private static final String ORG_CODE_PREFIX = "org:";
    private static final String HEALTH_CHECK_KEY = "health:check";

    // TTL 상수
    private static final long REFRESH_TOKEN_EXPIRE_TIME = 7; // 7일
    private static final long ORG_CODE_EXPIRE_TIME = 30; // 30분

    // ==================== JWT/Auth 관련 ====================

    /**
     * Refresh Token을 Redis에 저장
     */
    public void storeRefreshToken(String refreshToken, Integer oauthUserId) {
        String tokenKey = REFRESH_TOKEN_PREFIX + oauthUserId;
        redisTemplate.opsForValue().set(tokenKey, refreshToken, REFRESH_TOKEN_EXPIRE_TIME, TimeUnit.DAYS);
        log.debug("Redis에 Refresh Token 저장: oauthUserId={}, key={}", oauthUserId, tokenKey);
    }

    /**
     * Redis에서 Refresh Token 유효성 확인
     */
    public boolean validateRefreshTokenInRedis(String refreshToken, Integer oauthUserId) {
        String tokenKey = REFRESH_TOKEN_PREFIX + oauthUserId;
        String storedToken = (String) redisTemplate.opsForValue().get(tokenKey);
        log.debug("Redis Refresh Token 검증: oauthUserId={}", oauthUserId);
        return refreshToken.equals(storedToken);
    }

    /**
     * Redis에서 Refresh Token 삭제 (oauthUserId + refreshToken으로)
     */
    public void deleteRefreshTokenFromRedis(Integer oauthUserId, String refreshToken) {
        String tokenKey = REFRESH_TOKEN_PREFIX + oauthUserId;
        redisTemplate.delete(tokenKey);
        log.debug("Redis에서 Refresh Token 삭제: oauthUserId={}, key={}", oauthUserId, tokenKey);
    }

    // ==================== 기관 발행 코드 관련 ====================

    /**
     * 기관 발행 코드를 Redis에 저장
     */
    public void storeOrgCode(String code, String phoneNumber, Integer organizationId, Role role) {
        String key = buildOrgCodeKey(code);

        Map<String, Object> data = new HashMap<>();
        data.put("phoneNumber", phoneNumber);
        data.put("organizationId", organizationId);
        data.put("role", role);

        try {
            // 덮어쓰기 방식으로 바로 저장 (존재 여부 확인/삭제 불필요)
            redisTemplate.opsForValue().set(key, data, ORG_CODE_EXPIRE_TIME, TimeUnit.MINUTES);
            log.debug("Redis에 기관 발행 코드 저장: code={}, phone={}, role={}", code, phoneNumberUtil.maskPhoneNumber(phoneNumber), role);
        } catch (Exception e) {
            log.error("Redis 저장 실패: code={}, phone={}, role={}, error={}", code, phoneNumberUtil.maskPhoneNumber(phoneNumber), role, e.getMessage());
            throw new RuntimeException("시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    }


    /**
     * 기관 발행 코드를 Redis에서 찾아 꺼냄
     */
    public Object getOrgCode(String userInputCode) {
        // code 중복 발생해도 전화번호와 함께 저장하여 식별하게끔 함
        String key = buildOrgCodeKey(userInputCode);

        try {
            Object orgCode = get(key);
            
            if (orgCode == null) {
                log.debug("존재하지 않거나 만료된 인증 코드: userInputCode={}", userInputCode);
                throw new RuntimeException("유효하지 않은 인증 코드입니다.");
            }

            log.debug("Redis에 기관 발행 코드 가져옴: userInputCode={}", userInputCode);
            return orgCode;
        } catch (RuntimeException e) {
            throw e; // 이미 처리된 예외는 그대로 전파
        } catch (Exception e) {
            log.error("Redis 불러오기 실패: userInputCode={}, error={}", userInputCode, e.getMessage());
            throw new RuntimeException("시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    }


    /**
     * SMS 인증 코드 삭제 (SMS 전송 실패시 등)
     */
    public void deleteOrgCode(String code) {
        String key = buildOrgCodeKey(code);
        redisTemplate.delete(key);
        log.debug("인증 코드 삭제: key={}", key);
    }

    // ==================== Health Check 관련 ====================

    /**
     * Redis 헬스체크 수행
     */
    public boolean performHealthCheck() {
        try {
            String testKey = HEALTH_CHECK_KEY;
            String testValue = "test-" + System.currentTimeMillis();

            redisTemplate.opsForValue().set(testKey, testValue);
            String retrievedValue = (String) redisTemplate.opsForValue().get(testKey);
            redisTemplate.delete(testKey);

            boolean isHealthy = testValue.equals(retrievedValue);
            log.debug("Redis 헬스체크 결과: {}", isHealthy);

            return isHealthy;
        } catch (Exception e) {
            log.error("Redis 헬스체크 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Redis 연결 상태 확인 (간단한 헬스체크)
     */
    public boolean isRedisHealthy() {
        try {
            redisTemplate.opsForValue().set(HEALTH_CHECK_KEY, "ping");
            String result = (String) redisTemplate.opsForValue().get(HEALTH_CHECK_KEY);
            redisTemplate.delete(HEALTH_CHECK_KEY);

            return "ping".equals(result);
        } catch (Exception e) {
            log.error("Redis 헬스체크 실패: {}", e.getMessage());
            return false;
        }
    }

    // ==================== 공통 유틸리티 메서드 ====================

    /**
     * 기본 Redis set 연산
     */
    public void set(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    /**
     * TTL과 함께 Redis set 연산
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }

    /**
     * Redis get 연산
     */
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    /**
     * Redis delete 연산
     */
    public void delete(String key) {
        redisTemplate.delete(key);
    }

    /**
     * Redis hasKey 연산
     */
    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    // ==================== 키 생성 헬퍼 메서드 ====================

    private String buildOrgCodeKey(String code) {
        return ORG_CODE_PREFIX + code;
    }

    public void deleteAll() {
        try {
            redisTemplate.getConnectionFactory().getConnection().flushAll();
            log.info("Redis 모든 데이터 삭제 완료");
        } catch (Exception e) {
            log.error("Redis 데이터 삭제 실패: {}", e.getMessage());
            throw new RuntimeException("Redis 데이터 삭제 실패");
        }
    }

}
