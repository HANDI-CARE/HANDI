package com.handi.backend.service;

import com.handi.backend.converter.DateTimeConverter;
import com.handi.backend.dto.user.UserCreateRequestDto;
import com.handi.backend.dto.user.UserResponseDto;
import com.handi.backend.dto.user.UserTokenRequestDto;
import com.handi.backend.entity.OauthUsers;
import com.handi.backend.entity.Users;
import com.handi.backend.exception.NotFoundException;
import com.handi.backend.mapper.UserMapper;
import com.handi.backend.repository.OauthUsersRepository;
import com.handi.backend.repository.UsersRepository;
import com.handi.backend.dto.organization.OrganizationResponseDto;
import com.handi.backend.entity.Organizations;
import com.handi.backend.repository.OrganizationsRepository;
import com.handi.backend.mapper.OrganizationMapper;
import com.handi.backend.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UsersRepository usersRepository;
    private final OauthUsersRepository oauthUsersRepository;
    private final UserMapper userMapper;
    private final OrganizationsRepository organizationsRepository;
    private final OrganizationMapper organizationMapper;
    private final DateTimeConverter dateTimeConverter;

    /**
     * 사용자 조회 (Oauth User ID로)
     * JWT 필터 처리시, OAuth 계정 유무 확인시 사용
     *
     * @param oauthUserId 사용자 oauth ID
     * @return 조회된 사용자
     */
    public Object getByOauthUserId(Integer oauthUserId) {
        log.info("사용자 조회 서비스 시작: oauthUserId={}", oauthUserId);
        Users user = usersRepository.findByOauthUserId(oauthUserId).orElse(null);
        if (user != null) {
            log.info("사용자 조회 완료: ID={}, oauthUserId={}", user.getId(), oauthUserId);
            return user;
        }

        OauthUsers oauthUser = oauthUsersRepository.findById(oauthUserId).orElse(null);
        log.info("사용자 조회 완료 (임시 사용자): oauthUserId={}", oauthUserId);
        return oauthUser;
    }

    /**
     * 사용자 조회 (Oauth User ID로)
     * JWT 필터 처리시, OAuth 계정 유무 확인시 사용
     *
     * @param email 사용자 이메일
     * @return 조회된 사용자
     */
    public Object getByEmail(String email) {
        log.info("사용자 조회 서비스 시작: email={}", email);
        Users user = usersRepository.findByEmail(email).orElse(null);
        if (user != null) {
            log.info("사용자 조회 완료: ID={}, email={}", user.getId(), email);
            return user;
        }

        OauthUsers oauthUser = oauthUsersRepository.findByEmail(email).orElse(null);
        log.info("사용자 조회 완료 (임시 사용자): oauthUserId={}", email);
        return oauthUser;
    }


    /**
     * userMe 조회시 사용
     *
     * @param email 이메일
     * @return UserResponseDto
     */
    public UserResponseDto getUserMeByEmail(String email) {
        log.info("사용자 조회 서비스 시작: email={}", email);
        Users existingUser = usersRepository.findByEmail(email).orElse(null);
        UserResponseDto user;
        if (existingUser != null) {
            user = userMapper.toResponseDto(existingUser);
            log.info("사용자 조회 완료: email={}", email);
            return user;
        }

        OauthUsers existingOauthUser = oauthUsersRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        log.info("사용자 조회 완료 (임시 사용자): email={}", email);
        return UserResponseDto.builder()
                .oauthUserId(existingOauthUser.getId())
                .name(existingOauthUser.getName())
                .email(existingOauthUser.getEmail())
                .phoneNumber(existingOauthUser.getPhoneNumber())
                .profileImageUrl(existingOauthUser.getProfileImageUrl())
                .createdAt(dateTimeConverter.localDateTimeToString(existingOauthUser.getCreatedAt()))
                .needsAdditionalInfo(true)
                .build();
    }

    /**
     * 사용자 생성
     *
     * @param email      사용자 이메일
     * @param requestDto 사용자 생성 요청 DTO
     * @return 생성된 사용자
     */
    public UserResponseDto createUserMe(Integer oauthUserId, String email, UserCreateRequestDto requestDto) {
        log.info("사용자 생성 서비스 시작: email={}", email);

        // organization 존재 검증
        Organizations organization =
                organizationsRepository.findById(requestDto.getOrganizationId()).orElseThrow(() -> new NotFoundException("기관을 찾을 수 없습니다: " + requestDto.getOrganizationId()));


        // ouath user 존재 검증
        OauthUsers oauthUser =
                oauthUsersRepository.findById(oauthUserId).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + oauthUserId)); // 직접 조회를 하지 않아도 프록시만 생성해서 JPA가 자동으로 관계를 설정해줌

        // 휴대폰 번호 중복 검증
//        if (requestDto.getPhoneNumber() != null) {
//            validateUniquePhoneNumber(requestDto.getPhoneNumber());
//        }

        // DTO -> Entity 변환
        Users user = userMapper.toEntity(requestDto);

        user.setOauthUser(oauthUser);
        user.setName(user.getName() != null ? user.getName() : oauthUser.getName());
        user.setEmail(oauthUser.getEmail());
        user.setPhoneNumber(user.getPhoneNumber() != null ? user.getPhoneNumber() : oauthUser.getPhoneNumber());
        user.setProfileImageUrl(user.getProfileImageUrl() != null ? user.getProfileImageUrl() : oauthUser.getProfileImageUrl());

        // 데이터베이스에 저장
        Users savedUser = usersRepository.save(user);

        log.info("사용자 생성 완료: ID={}, email={}", savedUser.getId(), savedUser.getEmail());
        return userMapper.toResponseDto(savedUser);
    }

    /**
     * 사용자 수정
     *
     * @param email      사용자 이메일
     * @param requestDto 사용자 수정 요청 DTO
     * @return 수정된 사용자
     */
    public UserResponseDto updateUserMe(String email, UserCreateRequestDto requestDto) {
        log.info("사용자 수정 서비스 시작: email={}", email);

        // 사용자 조회
        Users user = usersRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 휴대폰 번호 중복 검증
        if (requestDto.getPhoneNumber() != null && !user.getPhoneNumber().equals(requestDto.getPhoneNumber())) {
            validateUniquePhoneNumber(requestDto.getPhoneNumber());
        }


        // 엔티티 업데이트
        userMapper.updateEntity(user, requestDto);

        // 데이터베이스에 수정
        Users savedUser = usersRepository.save(user);

        log.info("사용자 수정 완료: ID={}, 이메일={}", savedUser.getId(), savedUser.getEmail());

        return userMapper.toResponseDto(savedUser);
    }

    /**
     * 소속 기관 정보 조회 (직원, 보호자 공용)
     *
     * @param email 사용자 이메일
     * @return 기관 정보
     */
    public OrganizationResponseDto getOrganizationInfo(String email) {
        log.info("소속 기관 정보 조회 서비스 시작: email={}", email);

        Users user = usersRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        // 직원 또는 보호자 권한 확인
        if (!Role.EMPLOYEE.equals(user.getRole()) && !Role.GUARDIAN.equals(user.getRole())) {
            throw new IllegalArgumentException("직원 또는 보호자 권한이 필요합니다");
        }

        // 소속 기관 ID 확인
        Integer organizationId = user.getOrganizationId();
        if (organizationId == null) {
            throw new IllegalArgumentException("소속 기관이 설정되지 않았습니다");
        }

        // 기관 정보 직접 조회 (순환 참조 회피)
        Organizations organization = organizationsRepository.findById(organizationId)
                .orElseThrow(() -> new NotFoundException("기관을 찾을 수 없습니다: " + organizationId));
        OrganizationResponseDto organizationInfo = organizationMapper.toResponseDto(organization);

        log.info("소속 기관 정보 조회 완료: email={}, organizationId={}, organizationName={}",
                email, organizationId, organizationInfo.getName());

        return organizationInfo;
    }

    /**
     * 사용자 삭제
     *
     * @param id 사용자 ID
     */
    public void deleteOne(Integer id) {
        log.info("사용자 삭제 서비스 시작: id={}", id);

        // 삭제 전 존재 여부 확인
        Users user = usersRepository.findById(id).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + id));

        // 논리 삭제 (실제로는 isDeleted 플래그를 true로 설정)
        user.setIsDeleted(true);
        usersRepository.save(user);

        log.info("사용자 삭제 완료: ID={}, 이메일={}", user.getId(), user.getEmail());
    }

    /**
     * 키워드를 포함하는 사용자 목록 조회
     *
     * @param keyword  검색 키워드
     * @param pageable 페이지 정보
     * @return 사용자 목록
     */
    public Page<UserResponseDto> getList(String keyword, Pageable pageable) {
        log.info("사용자 목록 조회 서비스 시작");

        if (keyword == null || keyword.trim().isEmpty()) {
            return usersRepository.findByIsDeletedFalse(pageable).map(userMapper::toResponseDto);
        }
        return usersRepository.findByNameContainingOrEmailContainingAndIsDeletedFalse(keyword, keyword, pageable).map(userMapper::toResponseDto);
    }


    /**
     * 휴대폰 번호 중복 검증
     *
     * @param phoneNumber 휴대폰 번호
     */
    private void validateUniquePhoneNumber(String phoneNumber) {
        if (usersRepository.existsByPhoneNumber(phoneNumber)) {
            throw new IllegalArgumentException("이미 존재하는 휴대폰 번호입니다: " + phoneNumber);
        }
    }

    public UserResponseDto updateFcmToken(Users user, UserTokenRequestDto requestDto) {
        if (requestDto.getToken() == null || requestDto.getToken().trim().isEmpty()) {
            throw new IllegalArgumentException("FCM Token 이 없습니다.");
        }
        user.setFcmToken(requestDto.getToken());
        user.setUpdatedAt(LocalDateTime.now());
        Users savedUser = usersRepository.save(user);

        return userMapper.toResponseDto(savedUser);
    }

    public void deleteFcmToken(Users user) {
        user.setFcmToken(null);
        usersRepository.save(user);
    }

    public void deleteUserMe(String email) {
        log.info("회원 탈퇴 서비스 시작: email={}", email);

        // 사용자 확인
        Users existingUser = usersRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다: " + email));

        existingUser.setIsDeleted(true);
        usersRepository.save(existingUser);
    }
}
