package com.handi.backend.config;

import com.twilio.Twilio;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class TwilioInitializer {

    private final TwilioProperties twilioProperties;

    /**
     * Twilio SDK의 전역 설정 초기화
     */
    @Bean
    public CommandLineRunner initTwilio() {
        return args -> Twilio.init(
                twilioProperties.getAccountSid(),
                twilioProperties.getAuthToken());
    }
}
