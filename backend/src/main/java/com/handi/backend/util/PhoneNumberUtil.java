package com.handi.backend.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PhoneNumberUtil {

    /**
     * 한국 전화번호를 국제 형식(+82)으로 변환
     *
     * @param phoneNumber 입력 전화번호
     * @return +82 형식의 전화번호
     */
    public String normalizeKoreanPhoneNumber(String phoneNumber) {
        // 모든 특수문자 제거
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");

        // 이미 82로 시작하는 경우
        if (cleaned.startsWith("82")) {
            return "+" + cleaned;
        }

        // 010으로 시작하는 경우 (가장 일반적)
        if (cleaned.startsWith("010")) {
            return "+82" + cleaned.substring(1); // 0 제거하고 +82 추가
        }

        // 10자리 숫자인 경우 (010-1234-5678에서 하이픈만 제거)
        if (cleaned.length() == 11 && cleaned.startsWith("0")) {
            return "+82" + cleaned.substring(1);
        }

        // 그 외의 경우 그대로 반환
        return "+" + cleaned;
    }

    /**
     * 휴대폰 번호를 정리하여 010 형태로 반환
     *
     * @param koreanPhoneNumber 입력 전화번호 (+82101234568 또는 010-1234-5678)
     * @return 정리된 전화번호 (01012345678)
     */
    public String normalizeCleanPhoneNumber(String koreanPhoneNumber) {
        if (koreanPhoneNumber == null || koreanPhoneNumber.trim().isEmpty()) {
            log.error("휴대폰 번호가 null이거나 비어있습니다.");
            return null;
        }

        // 모든 특수문자 제거 (+, -, 공백 등)
        String cleaned = koreanPhoneNumber.replaceAll("[^0-9]", "");

        // +82로 시작하는 국제 형식인 경우 -> 010 형태로 변환
        if (cleaned.startsWith("82") && cleaned.length() >= 12) {
            return "0" + cleaned.substring(2); // 82 제거하고 앞에 0 추가
        }

        // 이미 010으로 시작하는 경우 그대로 반환
        if (cleaned.startsWith("010") && cleaned.length() == 11) {
            return cleaned;
        }

        // 그 외의 경우 예외 처리
        log.error("올바르지 않은 한국 휴대폰 번호 형식입니다: " + koreanPhoneNumber);
        return null;
    }

    /**
     * 번호 마스킹 메서드
     *
     * @param phoneNumber 입력 전화번호
     * @return 마스킹된 전화번호
     */
    public String maskPhoneNumber(String phoneNumber) {
        String digits = phoneNumber == null ? "" : phoneNumber.replaceAll("[^0-9]", "");
        if (digits.length() <= 4) {
            return "****";
        }
        int length = digits.length();
        String prefix = digits.substring(0, Math.min(3, length));
        String suffix = digits.substring(length - Math.min(2, length));
        return prefix + "****" + suffix;
    }
}
