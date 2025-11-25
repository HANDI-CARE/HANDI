package com.handi.backend.mapper;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.admin.AdminUserCreateRequestDto;
import com.handi.backend.dto.admin.AdminUserResponseDto;
import com.handi.backend.dto.admin.AdminUserUpdateRequestDto;
import com.handi.backend.dto.user.UserCreateRequestDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.entity.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final DateTimeConverter dateTimeConverter;

    public UserResponseDto toResponseDto(Users user) {
        return new UserResponseDto(
                user.getId(),
                user.getOauthUser() == null ? null : user.getOauthUser().getId(),
                user.getOrganizationId(),
                user.getRole(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getProfileImageUrl(),
                user.getAddress(),
                user.getFcmToken(),
                dateTimeConverter.localDateTimeToString(user.getCreatedAt()),
                dateTimeConverter.localDateTimeToString(user.getUpdatedAt()),
                false
        );
    }

    public AdminUserResponseDto toAdminResponseDto(Users user) {
        return new AdminUserResponseDto(
                user.getId(),
                user.getOauthUser() == null ? null : user.getOauthUser().getId(),
                user.getOrganizationId(),
                user.getRole(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getProfileImageUrl(),
                user.getAddress(),
                user.getFcmToken(),
                dateTimeConverter.localDateTimeToString(user.getCreatedAt()),
                dateTimeConverter.localDateTimeToString(user.getUpdatedAt()),
                user.getIsDeleted(),
                false
        );
    }

    public Users toEntity(UserCreateRequestDto requestDto) {
        Users user = new Users();

        user.setOrganizationId(requestDto.getOrganizationId());
        user.setRole(requestDto.getRole());

        user.setName(requestDto.getName());
        user.setPhoneNumber(requestDto.getPhoneNumber());
        user.setProfileImageUrl(requestDto.getProfileImageUrl());
        user.setAddress(requestDto.getAddress());

        return user;
    }

    public Users toEntity(AdminUserCreateRequestDto requestDto) {
        Users user = new Users();

        user.setOrganizationId(requestDto.getOrganizationId());
        user.setRole(requestDto.getRole());

        user.setName(requestDto.getName());
        user.setEmail(requestDto.getEmail());
        user.setPhoneNumber(requestDto.getPhoneNumber());
        user.setProfileImageUrl(requestDto.getProfileImageUrl());
        user.setAddress(requestDto.getAddress());

        return user;
    }

    public void updateEntity(Users user, UserCreateRequestDto requestDto) {
        user.setOrganizationId(requestDto.getOrganizationId());
        user.setRole(requestDto.getRole());

        user.setName(requestDto.getName());
        user.setPhoneNumber(requestDto.getPhoneNumber());
        user.setProfileImageUrl(requestDto.getProfileImageUrl());
        user.setAddress(requestDto.getAddress());
    }

    public void updateEntity(Users user, AdminUserUpdateRequestDto requestDto) {
        user.setRole(requestDto.getRole());

        user.setName(requestDto.getName());
        user.setPhoneNumber(requestDto.getPhoneNumber());
        user.setProfileImageUrl(requestDto.getProfileImageUrl());
        user.setAddress(requestDto.getAddress());
    }
}