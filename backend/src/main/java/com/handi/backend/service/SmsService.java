package com.handi.backend.service;

import com.handi.backend.config.TwilioProperties;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final TwilioProperties twilioProperties;

    /**
     * Twilio 메시지 보내기
     *
     * @param phoneNumber 국적 포함 핸드폰번호
     * @param content     메시지 내용
     */
    public void sendSms(String phoneNumber, String content) {
        try {
            Message message = Message.creator(
                    new PhoneNumber(phoneNumber),
                    new PhoneNumber(twilioProperties.getFromNumber()),
                    content
            ).create();

            log.info("SMS 발송 성공: SID={}", message.getSid());

            // 응답 추적용
            // SID = Service Identifier (고유 식별자)
        } catch (Exception e) {
            log.error("SMS 발송 실패: {}", e.getMessage());
            throw new RuntimeException("SMS 발송 실패", e);
        }
    }
}
