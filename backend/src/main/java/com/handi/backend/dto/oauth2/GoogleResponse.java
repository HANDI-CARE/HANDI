package com.handi.backend.dto.oauth2;

import com.handi.backend.enums.SocialProvider;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@RequiredArgsConstructor
public class GoogleResponse implements OAuth2Response {

    private final Map<String, Object> attributes;

    @Override
    public SocialProvider getSocialProvider() {
        return SocialProvider.GOOGLE;
    }

    @Override
    public String getId() {
        return attributes.get("sub").toString();
    }

    @Override
    public String getEmail() {
        return attributes.get("email").toString();
    }

    @Override
    public String getName() {
        // 한국 서비스여서 성+이름 으로 함
        // attribute.get("name").toString() // 이건 닉네임처럼 뭘 붙일 수 있음..

        Object familyName = attributes.get("family_name");
        Object givenName = attributes.get("given_name");
        Object name = attributes.get("name");

        if (familyName != null && givenName != null) {
            return familyName.toString().concat(givenName.toString());
        }
        return name.toString();
    }

    @Override
    public String getPhoneNumber() {
        return null;
    }

    @Override
    public String getProfileImageUrl() {
        Object picture = attributes.get("picture");
        if (picture != null) {
            return picture.toString();
        }
        return null;
    }
}
