package com.handi.backend.service;

import com.handi.backend.dto.admin.CodeSendResponseDto;
import com.handi.backend.dto.user.CodeVerificationResponseDto;
import com.handi.backend.enums.Role;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.repository.OrganizationsRepository;
import com.handi.backend.util.PhoneNumberUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Slf4j
@RequiredArgsConstructor
public class VerificationService {

    private final OrganizationsRepository organizationsRepository;
    private final RedisService redisService;
    private final SmsService smsService;
    private final PhoneNumberUtil phoneNumberUtil;

    /**
     * Redis를 사용하여 기관의 코드를 생성함
     *
     * @param organizationId 소속기관 ID
     * @return CodeSendResponseDto
     */
    public CodeSendResponseDto sendOrgCode(int organizationId, String koreanPhoneNumber, Role role) {
        // 국제 휴대폰 양식으로 변환 후 사용
        String phoneNumber = phoneNumberUtil.normalizeKoreanPhoneNumber(koreanPhoneNumber);

        log.info("기관 발행 코드 발행 서비스 시작: organizationId={}, phone={}", organizationId, phoneNumber);

        // 기관 유무 확인
        organizationsRepository.findById(organizationId).orElseThrow(() -> new NotFoundException("기관을 찾을 수 없습니다: " + organizationId));

        // redis key, code 생성
        String code = generateCode(); // key값으로 사용할 것

        // 30분 넉넉히 TTL 설정
        Duration ttl = Duration.ofMinutes(30);
        LocalDateTime expiresAt = LocalDateTime.now().plus(ttl);

        // redis에 저장
        redisService.storeOrgCode(code, phoneNumber, organizationId, role);

        try {
            String message = String.format("한디 기관 가입 코드: [%s]\n타인에게 절대 알리지 마세요", code);
            smsService.sendSms(phoneNumber, message);

            log.info("인증 코드 발행 완료: organizationId={}, code={}", organizationId, code);

            return new CodeSendResponseDto(organizationId, 300, expiresAt, "30분 내로 기관 발행 코드를 사용하여 가입 절차를 진행해주세요");
        } catch (Exception e) {
            // Redis에서 코드 삭제 (SMS 실패시)
            redisService.deleteOrgCode(code);

            log.error("SMS 발송 실패: phone={}, error={}", phoneNumberUtil.maskPhoneNumber(phoneNumber), e.getMessage());

            throw new RuntimeException("SMS 발송에 실패했습니다. 다시 시도해주세요.");
        }
    }

    public CodeVerificationResponseDto verifyCode(String userInputCode) {
        try {
            Object codeData = redisService.getOrgCode(userInputCode);

            if (!(codeData instanceof Map)) {
                log.error("잘못된 코드 데이터 형식: userInputCode={}", userInputCode);
                throw new RuntimeException("유효하지 않은 인증 코드입니다.");
            }

            Map<String, Object> obj = (Map<String, Object>) codeData;

            String phoneNumber = (String) obj.get("phoneNumber");
            Integer organizationId = (Integer) obj.get("organizationId");
            Role role = (Role) obj.get("role");

            if (phoneNumber == null || organizationId == null || role == null) {
                log.error("코드 데이터 필드 누락: userInputCode={}", userInputCode);
                throw new RuntimeException("유효하지 않은 인증 코드입니다.");
            }

            // 인증 성공 후 코드 삭제 (재사용 방지)
//            redisService.deleteOrgCode(userInputCode);

            CodeVerificationResponseDto dto = new CodeVerificationResponseDto();
            dto.setPhoneNumber(phoneNumberUtil.normalizeCleanPhoneNumber(phoneNumber));
            dto.setOrganizationId(organizationId);
            organizationsRepository.findById(organizationId).ifPresent(org -> dto.setOrganizationName(org.getName()));
            dto.setRole(role);

            log.info("기관 발행 코드 인증 성공: code={}, organizationId={}, role={}", userInputCode, organizationId, role);

            return dto;
        } catch (RuntimeException e) {
            log.error("기관 발행 코드 인증 실패: code={}, error={}", userInputCode, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("기관 발행 코드 인증 중 예상치 못한 오류: code={}, error={}", userInputCode, e.getMessage());
            throw new RuntimeException("시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    }

    // ==================== 헬퍼 메서드 ====================

    /**
     * 6자리의 랜덤 숫자 코드를 생성함
     *
     * @return 코드 생성 ex) 789012
     */
    private String generateCode() {
        int code = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return String.valueOf(code);
    }

}
