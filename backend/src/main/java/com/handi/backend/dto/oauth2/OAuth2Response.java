package com.handi.backend.dto.oauth2;

import com.handi.backend.enums.SocialProvider;

/**
 * OAuth2 응답 내용
 */
public interface OAuth2Response {
    SocialProvider getSocialProvider();

    // Provider 로그인 ID
    String getId();

    String getEmail();

    String getName();

    String getPhoneNumber();

    String getProfileImageUrl();

}
