package com.handi.backend.dto.oauth2;

import com.handi.backend.enums.SocialProvider;

import java.util.Map;

public class KakaoResponse implements OAuth2Response {

    private final Map<String, Object> attributes;
    private final Map<String, Object> kakaoAccount;
    private final Map<String, Object> properties;


    public KakaoResponse(Map<String, Object> attributes) {
        this.attributes = attributes;
        this.kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        this.properties = (Map<String, Object>) attributes.get("properties");
    }

    @Override
    public SocialProvider getSocialProvider() {
        return SocialProvider.KAKAO;
    }

    @Override
    public String getId() {
        return attributes.get("id").toString();
    }

    @Override
    public String getEmail() {
        return (String) kakaoAccount.get("email");
    }

    @Override
    public String getName() {
        if (properties == null) return null;
        return (String) properties.get("nickname");
    }

    @Override
    public String getPhoneNumber() {
        Object phoneNumber = kakaoAccount.get("phone_number");
        if (phoneNumber != null) {
            return phoneNumber.toString();
        }
        return null;
    }

    @Override
    public String getProfileImageUrl() {
        if (kakaoAccount == null) return null;
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        if (profile == null) return null;
        return (String) profile.get("profile_image_url");
    }
}
