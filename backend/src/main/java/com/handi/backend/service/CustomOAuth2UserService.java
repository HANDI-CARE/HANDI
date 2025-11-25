package com.handi.backend.service;

import com.handi.backend.dto.oauth2.GoogleResponse;
import com.handi.backend.dto.oauth2.KakaoResponse;
import com.handi.backend.dto.oauth2.NaverResponse;
import com.handi.backend.dto.oauth2.OAuth2Response;
import com.handi.backend.entity.OauthUsers;
import com.handi.backend.entity.Users;

import com.handi.backend.repository.OauthUsersRepository;
import com.handi.backend.repository.UsersRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final OauthUsersRepository oauthUsersRepository;
    private final UsersRepository usersRepository;

    /**
     * provider로 부터 전달받은 유저로부터 Entity에 매치하는 유저 처리하기
     *
     * @param userRequest OAuth2UserRequest
     * @return OAuth2User
     */
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. OAuth2 정보 가져오기
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 2. 플랫폼 구분
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        // 3. 플랫폼별 파싱
        OAuth2Response oAuth2Response = getProviderResponse(registrationId, oAuth2User.getAttributes());

        if (oAuth2Response == null) {
            log.error("지원하지 않는 OAuth2 플랫폼: {}", registrationId);
            throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 플랫폼입니다.");
        }

        // 4. 필수 정보 검증
        if (oAuth2Response.getEmail() == null || oAuth2Response.getEmail().isEmpty()) {
            log.error("OAuth2 응답에서 이메일을 찾을 수 없습니다: platform={}", registrationId);
            throw new OAuth2AuthenticationException("이메일 정보가 필요합니다.");
        }

        // 5. 사용자 처리 : OAuthUsers 생성 or OAuthUsers 조회  or Users 조회
        Object userOrOAuthUser = processUserLogin(oAuth2Response);

        // 6. OAuth2User 객체 생성
        if (userOrOAuthUser instanceof OauthUsers) {
            // 임시 사용자 - OAuthUsers 기반
            return createOAuth2UserFromOAuthUsers((OauthUsers) userOrOAuthUser, oAuth2User.getAttributes());
        } else {
            // 완전한 사용자 - Users 기반
            return createOAuth2UserFromUsers((Users) userOrOAuthUser, oAuth2User.getAttributes());
        }
    }

    // Provider별 응답 형식 변환
    private OAuth2Response getProviderResponse(String registrationId, Map<String, Object> attributes) {
        return switch (registrationId.toLowerCase()) {
            case "google" -> new GoogleResponse(attributes);
            case "naver" -> {
                Map<String, Object> response = (Map<String, Object>) attributes.get("response");
                yield new NaverResponse(response);
            }
            case "kakao" -> new KakaoResponse(attributes);
            default -> null;
        };
    }

    // Users 기반 로그인 처리 - email로 먼저 조회
    private Object processUserLogin(OAuth2Response oAuth2Response) {
        String email = oAuth2Response.getEmail();

        // 1. OAuthUser 테이블에서 email로 먼저 조회
        OauthUsers existingOAuthUser = oauthUsersRepository.findByEmail(email).orElse(null);

        // 2. 신규 유저 회원가입 처리
        if (existingOAuthUser == null) {
            log.info("회원가입 요청: email={}", email);
            OauthUsers oauthUser = new OauthUsers();
            oauthUser.setSocialProvider(oAuth2Response.getSocialProvider());
            oauthUser.setProviderUserId(oAuth2Response.getId());
            oauthUser.setEmail(oAuth2Response.getEmail());
            oauthUser.setName(oAuth2Response.getName());
            oauthUser.setPhoneNumber(oAuth2Response.getPhoneNumber());
            oauthUser.setProfileImageUrl(oAuth2Response.getProfileImageUrl());
            oauthUsersRepository.save(oauthUser);
            return oauthUser;
        }

        // 3. Users 테이블에서 OAuthUsers fk로 조회
        Users existingUser = usersRepository.findByOauthUser(existingOAuthUser).orElse(null);

        // 4. 로그인: 임시 사용자의 경우
        if (existingUser == null) {
            log.info("임시 사용자의 로그인 요청: email={}", email);
            return existingOAuthUser;
        }

        // 5. 완전한 사용자 - 바로 로그인
        log.info("완전한 사용자의 로그인 요청: email={}", email);
        return existingUser;
    }

    // 임시 사용자용 : OAuthUsers 기반 `OAuth2User` 객체 생성
    private OAuth2User createOAuth2UserFromOAuthUsers(OauthUsers oauthUser, Map<String, Object> originalAttributes) {
        Map<String, Object> attributes = new HashMap<>(originalAttributes);

        // request attribute로 쓸 수 있게 함
        attributes.put("userId", null);
        attributes.put("oauthUserId", oauthUser.getId());
        attributes.put("email", oauthUser.getEmail());
        attributes.put("name", oauthUser.getName());
        attributes.put("phoneNumber", oauthUser.getPhoneNumber());
        attributes.put("profileImageUrl", oauthUser.getProfileImageUrl());
        attributes.put("needsAdditionalInfo", true); // 항상 추가 정보 필요

        return new OAuth2User() {
            @Override
            public Map<String, Object> getAttributes() {
                return attributes;
            }

            @Override
            public Collection<? extends GrantedAuthority> getAuthorities() {
                return List.of(new SimpleGrantedAuthority("ROLE_PENDING_USER")); // 추가 정보 입력 대기
            }

            @Override
            public String getName() {
                return oauthUser.getName();
            }
        };
    }

    // 완전한 사용자용 : Users 기반 `OAuth2User` 객체 생성
    private OAuth2User createOAuth2UserFromUsers(Users user, Map<String, Object> originalAttributes) {
        Map<String, Object> attributes = new HashMap<>(originalAttributes);

        // request attribute로 쓸 수 있게 함
        attributes.put("userId", user.getId());
        attributes.put("oauthUserId", user.getOauthUser().getId());
        attributes.put("email", user.getEmail());
        attributes.put("name", user.getName());
        attributes.put("phoneNumber", user.getPhoneNumber());
        attributes.put("profileImageUrl", user.getProfileImageUrl());

//        attributes.put("isApproved", user.getIsApproved());
//        attributes.put("organizationId", user.getOrganizationId());
//        attributes.put("role", user.getRole());
//        attributes.put("fcmToken", user.getFcmToken());

        attributes.put("needsAdditionalInfo", user.getRole() == null); // 추가 정보 입력 필요 여부

        return new OAuth2User() {
            @Override
            public Map<String, Object> getAttributes() {
                return attributes;
            }

            @Override
            public Collection<? extends GrantedAuthority> getAuthorities() {
                // role이 있으면 실제 권한, 없으면 추가 정보 입력 대기 상태
                if (user.getRole() != null) {
                    return user.getAuthorities(); // Users의 실제 권한 사용
                } else {
                    return List.of(new SimpleGrantedAuthority("ROLE_PENDING_USER")); // 추가 정보 입력 대기
                }
            }

            @Override
            public String getName() {
                return user.getName();
            }
        };
    }

}

