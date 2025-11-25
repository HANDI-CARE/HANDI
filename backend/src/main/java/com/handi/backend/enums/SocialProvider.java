package com.handi.backend.enums;


import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
public enum SocialProvider {
    GOOGLE("google", "구글"),
    KAKAO("kakao", "카카오"),
    NAVER("naver", "네이버"),
    MOCK("mock", "목업");

    private final String code;
    @Getter
    private final String displayName;


    // 역직렬화: JSON → enum
    @JsonCreator
    public static SocialProvider fromCode(String code) {
        for (SocialProvider provider : values()) {
            if (provider.code.equals(code)) {
                return provider;
            }
        }
        throw new IllegalArgumentException("Unknown provider: " + code);
    }

    // 직렬화: enum -> JSON
    @JsonValue
    public String getCode() {
        return code;
    }
}
