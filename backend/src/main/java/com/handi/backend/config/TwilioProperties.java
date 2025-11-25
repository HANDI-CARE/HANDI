package com.handi.backend.config;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * application.yml에서 설정한 값을 이 클래스에서 바인딩 (Java 클래스의 필드에 자동으로 연결)
 */
@Component
@ConfigurationProperties(prefix = "twilio")
@Getter
@Setter
public class TwilioProperties {
    private String verifyServiceSid;
    private String accountSid;
    private String authToken;
    private String fromNumber;
}
