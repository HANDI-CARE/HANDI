package com.handi.backend.dto.oauth2;

import com.handi.backend.enums.SocialProvider;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@RequiredArgsConstructor
public class NaverResponse implements OAuth2Response {
    private final Map<String, Object> attributes;

    @Override
    public SocialProvider getSocialProvider() {
        return SocialProvider.NAVER;
    }

    @Override
    public String getId() {
        return attributes.get("id").toString();
    }

    @Override
    public String getEmail() {
        return attributes.get("email").toString();
    }

    @Override
    public String getName() {
        Object picture = attributes.get("name");
        if (picture != null) {
            return picture.toString();
        }
        return null;
    }

    @Override
    public String getPhoneNumber() {
        Object mobile = attributes.get("mobile");
        if (mobile == null) {
            return null;
        }
        return mobile.toString();
    }

    @Override
    public String getProfileImageUrl() {
        Object profileImage = attributes.get("profile_image");
        if (profileImage == null) {
            return null;
        }
        return profileImage.toString();
    }
}
